const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  // 1. Check documents columns
  const docCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'documents'
    ORDER BY ordinal_position;
  `);
  console.log('documents columns:', docCols.rows);

  // 2. Check audit_log policies
  const auditPolicies = await client.query(`
    SELECT polname, polcmd, polroles, pg_get_expr(polqual, polrelid) AS qual, pg_get_expr(polwithcheck, polrelid) AS with_check
    FROM pg_policy
    WHERE polrelid = 'audit_log'::regclass;
  `);
  console.log('audit_log policies:', auditPolicies.rows);

  await client.end();
}
run();
