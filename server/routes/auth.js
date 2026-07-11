const express = require('express');
const bcrypt = require('bcryptjs');
const { sql } = require('../db');
const { issueToken, clearToken, readUserId } = require('../services/authToken');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: '이미 가입된 이메일입니다.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, name) VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id
  `;

  issueToken(res, user.id);
  res.json({ id: user.id, email, name });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  issueToken(res, user.id);
  res.json({ id: user.id, email: user.email, name: user.name });
});

router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const userId = readUserId(req);
  if (!userId) return res.status(401).json({ error: '로그인이 필요합니다.' });
  const [user] = await sql`SELECT id, email, name FROM users WHERE id = ${userId}`;
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  res.json(user);
});

module.exports = router;
