const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkCasesTriggers() {
  await client.connect();
  const res = await client.query(`
    SELECT trigger_name, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'cases';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
checkCasesTriggers();
