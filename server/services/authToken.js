const jwt = require('jsonwebtoken');

const SECRET = process.env.SESSION_SECRET || 'dev-secret';
const COOKIE_NAME = 'token';

function issueToken(res, userId) {
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearToken(res) {
  res.clearCookie(COOKIE_NAME);
}

function readUserId(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET).userId;
  } catch {
    return null;
  }
}

module.exports = { issueToken, clearToken, readUserId };
