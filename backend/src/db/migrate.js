const { loadConfig } = require('../config');
const { createPool } = require('./pool');
const { loadSqlScripts } = require('./sqlFiles');

async function migrate() {
  const pool = createPool(loadConfig().db);
  try {
    for (const script of loadSqlScripts()) {
      console.log(`Ejecutando ${script.name}`);
      await pool.query(script.sql);
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.log('Error al migrar:', err.message);
  process.exit(1);
});
