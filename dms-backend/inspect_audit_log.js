const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'audit_log'
    ORDER BY ordinal_position;
  `);
  console.log('audit_log columns:', res.rows);

  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'audit_log'::regclass;
  `);
  console.log('Constraints on audit_log:', constraints.rows);

  await client.end();
}
run();
