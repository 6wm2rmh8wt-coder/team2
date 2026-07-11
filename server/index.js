require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { ensureInit } = require('./db');
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');
const substanceRoutes = require('./routes/substances');
const interactionRoutes = require('./routes/interactions');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(async (req, res, next) => {
  try {
    await ensureInit();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/favicon.ico', (req, res) => res.redirect('/favicon.svg'));

app.use('/api/auth', authRoutes);
app.use('/api', recordRoutes);
app.use('/api', substanceRoutes);
app.use('/api', interactionRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
