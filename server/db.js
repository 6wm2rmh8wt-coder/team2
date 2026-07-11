const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL(또는 POSTGRES_URL) 환경변수가 설정되어 있지 않습니다. Vercel Postgres(Neon)를 연결해주세요.');
}

const sql = neon(connectionString);

async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      hospital_name TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      medications JSONB NOT NULL DEFAULT '[]',
      diagnosis TEXT,
      medical_history TEXT,
      test_result TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS substances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visit_files (
      id SERIAL PRIMARY KEY,
      visit_id INTEGER NOT NULL REFERENCES visits(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      original_name TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

let initPromise = null;
function ensureInit() {
  if (!initPromise) initPromise = initDb();
  return initPromise;
}

module.exports = { sql, ensureInit };
