const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename IN ('cases', 'documents', 'audit_log', 'organisations');
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
