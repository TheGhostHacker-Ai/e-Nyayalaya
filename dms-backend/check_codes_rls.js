const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkCodesRLS() {
  await client.connect();
  const res = await client.query(`
    SELECT pol.polname, pol.polcmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    WHERE pol.polrelid = 'case_access_codes'::regclass;
  `);
  console.log("case_access_codes RLS:", JSON.stringify(res.rows, null, 2));
  
  const res2 = await client.query(`
    SELECT prosrc FROM pg_proc WHERE proname = 'is_case_member';
  `);
  console.log("is_case_member SRC:", res2.rows[0].prosrc);

  await client.end();
}
checkCodesRLS();
