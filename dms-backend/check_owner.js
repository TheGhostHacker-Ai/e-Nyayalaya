const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkOwner() {
  await client.connect();
  const res = await client.query(`
    SELECT p.proname, p.prosecdef, a.rolname as owner 
    FROM pg_proc p 
    JOIN pg_authid a ON p.proowner = a.oid 
    WHERE proname IN ('auto_enroll_creator', 'is_approved');
  `);
  console.table(res.rows);
  await client.end();
}
checkOwner();
