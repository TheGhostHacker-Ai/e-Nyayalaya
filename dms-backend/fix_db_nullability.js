const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  // 1. Check enum values for case_stage
  const enumRes = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'case_stage'
    ORDER BY e.enumsortorder;
  `);
  console.log('case_stage enum values:', enumRes.rows.map(r => r.enumlabel));

  // 2. Make filed_by nullable on cases table if it is not nullable
  await client.query(`
    ALTER TABLE cases ALTER COLUMN filed_by DROP NOT NULL;
  `);
  console.log('cases.filed_by dropped NOT NULL constraint');

  // 3. Check if audit_log entity_type is required, let's make it nullable or have a default if needed
  await client.query(`
    ALTER TABLE audit_log ALTER COLUMN entity_type DROP NOT NULL;
  `);
  console.log('audit_log.entity_type dropped NOT NULL constraint');

  await client.end();
}
run();
