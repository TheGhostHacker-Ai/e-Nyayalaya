const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'public.organisations'::regclass;
    `);
    console.log("Constraints:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
