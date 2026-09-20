const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  const triggers = await client.query(`
    SELECT 
      tgname,
      proname,
      prosrc
    FROM pg_trigger
    JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
    WHERE tgrelid = 'cases'::regclass;
  `);

  console.log('Triggers on cases:', triggers.rows);

  await client.end();
}
run();
