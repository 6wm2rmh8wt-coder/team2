const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { checkInteractions } = require('../services/interactionEngine');

const router = express.Router();

// 등록 이력과 무관하게 자유롭게 여러 물질을 입력해 통합 조회하는 검색엔진
router.post('/interactions/search', requireAuth, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.filter((i) => i.trim()).length < 2) {
    return res.status(400).json({ error: '두 개 이상의 물질을 입력해주세요.' });
  }
  const result = await checkInteractions(items);
  res.json(result);
});

module.exports = router;
