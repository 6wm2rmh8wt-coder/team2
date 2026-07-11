const express = require('express');
const { sql } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { checkInteractions } = require('../services/interactionEngine');

const router = express.Router();
router.use(requireAuth);

function parseMeds(medications) {
  if (Array.isArray(medications)) return medications;
  if (typeof medications === 'string') return JSON.parse(medications);
  return [];
}

async function getAllExistingNames(userId) {
  const visits = await sql`SELECT medications FROM visits WHERE user_id = ${userId}`;
  const meds = visits.flatMap((v) => parseMeds(v.medications));
  const substances = await sql`SELECT name FROM substances WHERE user_id = ${userId}`;
  return [...meds, ...substances.map((s) => s.name)];
}

router.get('/substances', async (req, res) => {
  const rows = await sql`
    SELECT * FROM substances WHERE user_id = ${req.userId} ORDER BY id DESC
  `;
  res.json(rows);
});

router.post('/substances', async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: '이름과 종류(영양제/음식)를 입력해주세요.' });
  }

  const existingNames = await getAllExistingNames(req.userId);

  await sql`
    INSERT INTO substances (user_id, name, category) VALUES (${req.userId}, ${name}, ${category})
  `;

  const interactionResult = await checkInteractions([name, ...existingNames]);
  res.json({ interactionResult });
});

module.exports = router;
