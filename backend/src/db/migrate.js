require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../config/logger');

const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await pool.query(
      'SELECT filename FROM _migrations WHERE filename = $1', [file]
    );
    if (already.rows.length) {
      logger.info(`⏭️  Skipping ${file} (already ran)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info(`Running migration: ${file}`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    logger.info(`✅ ${file} completed`);
  }

  logger.info('🎉 All migrations done');
  await pool.end();
};

migrate().catch((err) => {
  console.error(err.message);
  process.exit(1);
});