const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkTrigger() {
  await client.connect();
  const res = await client.query(`
    SELECT pg_get_triggerdef(oid) 
    FROM pg_trigger 
    WHERE tgname = 'trg_judgement';
  `);
  console.log("trg_judgement:", JSON.stringify(res.rows, null, 2));

  const res2 = await client.query(`
    SELECT prosrc 
    FROM pg_proc 
    WHERE proname = 'update_case_on_judgement';
  `);
  console.log("update_case_on_judgement:", JSON.stringify(res2.rows, null, 2));

  await client.end();
}
checkTrigger();
