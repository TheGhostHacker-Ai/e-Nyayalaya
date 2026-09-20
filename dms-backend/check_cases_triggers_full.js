const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT tgname, tgenabled, proname, prosrc 
    FROM pg_trigger 
    JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid 
    WHERE tgrelid = 'cases'::regclass;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
