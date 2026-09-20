const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkProfiles() {
  await client.connect();
  const res = await client.query(`
    SELECT id, email, full_name, role, status
    FROM profiles 
    ORDER BY created_at DESC 
    LIMIT 5;
  `);
  console.table(res.rows);
  await client.end();
}
checkProfiles();
