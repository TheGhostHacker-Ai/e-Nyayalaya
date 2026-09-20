const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  // Constraints
  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'cases'::regclass;
  `);
  console.log('Constraints on cases:', constraints.rows);

  await client.end();
}
run();
