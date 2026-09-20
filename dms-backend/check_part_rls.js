const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkParticipantsRLS() {
  await client.connect();
  const res = await client.query(`
    SELECT pol.polname, pol.polcmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    WHERE pol.polrelid = 'case_participants'::regclass;
  `);
  console.log("case_participants RLS:", JSON.stringify(res.rows, null, 2));

  await client.end();
}
checkParticipantsRLS();
