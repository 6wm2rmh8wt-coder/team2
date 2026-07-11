const express = require('express');
const { put } = require('@vercel/blob');
const { sql } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { checkInteractions } = require('../services/interactionEngine');
const { upload } = require('../upload');

const router = express.Router();
router.use(requireAuth);

function parseMeds(medications) {
  if (Array.isArray(medications)) return medications;
  if (typeof medications === 'string') return JSON.parse(medications);
  return [];
}

async function getFilesForVisits(visitIds) {
  if (visitIds.length === 0) return {};
  const rows = await sql`
    SELECT * FROM visit_files WHERE visit_id = ANY(${visitIds}) ORDER BY id
  `;
  const byVisit = {};
  for (const row of rows) {
    (byVisit[row.visit_id] ||= []).push({
      id: row.id,
      originalName: row.original_name,
      mimeType: row.mime_type,
    });
  }
  return byVisit;
}

async function getAllSubstanceNames(userId, excludeVisitId) {
  const visits = await sql`SELECT id, medications FROM visits WHERE user_id = ${userId}`;
  const meds = visits
    .filter((v) => v.id !== excludeVisitId)
    .flatMap((v) => parseMeds(v.medications));
  const substances = await sql`SELECT name FROM substances WHERE user_id = ${userId}`;
  return [...meds, ...substances.map((s) => s.name)];
}

router.get('/visits', async (req, res) => {
  const visits = await sql`
    SELECT * FROM visits WHERE user_id = ${req.userId} ORDER BY visit_date DESC, id DESC
  `;
  const filesByVisit = await getFilesForVisits(visits.map((v) => v.id));
  res.json(
    visits.map((v) => ({
      ...v,
      medications: parseMeds(v.medications),
      files: filesByVisit[v.id] || [],
    }))
  );
});

router.post('/visits', async (req, res) => {
  const {
    hospitalName,
    visitDate,
    medications = [],
    diagnosis = '',
    medicalHistory = '',
    testResult = '',
    source = 'manual',
  } = req.body;

  if (!hospitalName || !visitDate) {
    return res.status(400).json({ error: '병원명과 진료일은 필수입니다.' });
  }

  const [visit] = await sql`
    INSERT INTO visits (user_id, hospital_name, visit_date, medications, diagnosis, medical_history, test_result, source)
    VALUES (${req.userId}, ${hospitalName}, ${visitDate}, ${JSON.stringify(medications)}::jsonb, ${diagnosis}, ${medicalHistory}, ${testResult}, ${source})
    RETURNING id
  `;

  const visitId = visit.id;
  const existingNames = await getAllSubstanceNames(req.userId, visitId);
  const interactionResult = await checkInteractions([...medications, ...existingNames]);

  res.json({ visitId, interactionResult });
});

// 병원별 진단서·검사결과지 파일 첨부 (실시간 HIE 연동의 MVP 대체) — Vercel Blob에 저장
router.post('/visits/:id/files', upload.array('files', 5), async (req, res) => {
  const [visit] = await sql`
    SELECT id FROM visits WHERE id = ${req.params.id} AND user_id = ${req.userId}
  `;
  if (!visit) {
    return res.status(404).json({ error: '진료 기록을 찾을 수 없습니다.' });
  }

  const files = [];
  for (const file of req.files || []) {
    const blob = await put(`visits/${visit.id}/${Date.now()}-${file.originalname}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: true,
    });
    await sql`
      INSERT INTO visit_files (visit_id, user_id, original_name, blob_url, mime_type)
      VALUES (${visit.id}, ${req.userId}, ${file.originalname}, ${blob.url}, ${file.mimetype})
    `;
    files.push({ originalName: file.originalname, mimeType: file.mimetype });
  }

  res.json({ files });
});

router.get('/files/:fileId', async (req, res) => {
  const [file] = await sql`
    SELECT * FROM visit_files WHERE id = ${req.params.fileId} AND user_id = ${req.userId}
  `;
  if (!file) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }
  res.redirect(file.blob_url);
});

module.exports = router;
