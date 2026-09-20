const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkTriggerProc() {
  await client.connect();
  const res2 = await client.query(`
    SELECT prosrc 
    FROM pg_proc 
    WHERE proname = 'on_judgement_pronounced';
  `);
  console.log("on_judgement_pronounced:", JSON.stringify(res2.rows, null, 2));

  await client.end();
}
checkTriggerProc();
