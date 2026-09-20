const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkDocsTriggers() {
  await client.connect();
  const res = await client.query(`
    SELECT tgname, pg_get_triggerdef(oid) as def
    FROM pg_trigger
    WHERE tgrelid = 'documents'::regclass AND tgisinternal = false;
  `);
  console.log("documents triggers:", JSON.stringify(res.rows, null, 2));

  await client.end();
}
checkDocsTriggers();
