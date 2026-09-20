const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function dumpPolicies() {
  await client.connect();
  const res = await client.query(`
    SELECT polname, polcmd, polqual, polwithcheck 
    FROM pg_policy 
    WHERE polrelid = 'cases'::regclass;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
dumpPolicies();
