const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkJudgementsPolicies() {
  await client.connect();
  const res = await client.query(`
    SELECT pol.polname, pol.polcmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    WHERE pol.polrelid = 'judgements'::regclass;
  `);
  console.log("judgements RLS:", JSON.stringify(res.rows, null, 2));

  // Let's also check documents table just in case they clicked the wrong button and it was documents.
  const res2 = await client.query(`
    SELECT pol.polname, pol.polcmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    WHERE pol.polrelid = 'documents'::regclass;
  `);
  console.log("documents RLS:", JSON.stringify(res2.rows, null, 2));
  
  await client.end();
}
checkJudgementsPolicies();
