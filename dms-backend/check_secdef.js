const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkSecDef() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('auto_enroll_creator', 'gen_case_number', 'audit_case_changes');
  `);
  console.table(res.rows);
  await client.end();
}
checkSecDef();
