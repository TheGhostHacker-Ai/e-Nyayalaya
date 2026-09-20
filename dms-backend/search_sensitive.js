const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function searchSensitive() {
  await client.connect();
  const res = await client.query(`
    SELECT pol.polrelid::regclass as table_name, pol.polname,
           pg_get_expr(pol.polqual, pol.polrelid) AS qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    WHERE pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%is_sensitive%'
       OR pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%is_sensitive%';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
searchSensitive();
