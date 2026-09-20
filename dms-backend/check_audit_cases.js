const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkAudit() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, prosecdef, prosrc FROM pg_proc WHERE proname = 'audit_cases';
  `);
  console.log(res.rows[0]);
  await client.end();
}
checkAudit();
