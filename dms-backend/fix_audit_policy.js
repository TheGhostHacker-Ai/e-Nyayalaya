const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  const auditPolicies = await client.query(`
    SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) AS qual, pg_get_expr(polwithcheck, polrelid) AS with_check
    FROM pg_policy
    WHERE polrelid = 'audit_log'::regclass;
  `);
  console.log('audit_log policies:', auditPolicies.rows);

  // Re-create insert policy for audit_log for public / anon / authenticated
  await client.query(`
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "allow insert audit" ON audit_log;
    DROP POLICY IF EXISTS "public insert audit" ON audit_log;
    CREATE POLICY "public insert audit" ON audit_log FOR INSERT TO public WITH CHECK (true);
    GRANT ALL ON TABLE audit_log TO anon, authenticated, public, service_role;
  `);
  console.log('audit_log policy updated');

  await client.end();
}
run();
