const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkJudgementsTriggers() {
  await client.connect();
  const res = await client.query(`
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'judgements'::regclass;
  `);
  console.log("judgements triggers:", JSON.stringify(res.rows, null, 2));

  // Let's also check if there is a RESTRICTIVE policy!
  const res2 = await client.query(`
    SELECT pol.polname, pol.polcmd, polpermissive
    FROM pg_policy pol
    WHERE pol.polrelid = 'judgements'::regclass;
  `);
  console.log("judgements permissive/restrictive:", JSON.stringify(res2.rows, null, 2));

  await client.end();
}
checkJudgementsTriggers();
