const { readUserId } = require('../services/authToken');

function requireAuth(req, res, next) {
  const userId = readUserId(req);
  if (!userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  req.userId = userId;
  next();
}

module.exports = requireAuth;
