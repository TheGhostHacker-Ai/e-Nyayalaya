const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkAuditDocs() {
  await client.connect();
  const res = await client.query(`
    SELECT prosrc FROM pg_proc WHERE proname = 'audit_documents';
  `);
  console.log(res.rows[0]?.prosrc);
  await client.end();
}
checkAuditDocs();
