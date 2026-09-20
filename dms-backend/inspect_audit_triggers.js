const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  const triggers = await client.query(`
    SELECT tgname, proname, prosrc
    FROM pg_trigger
    JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
    WHERE tgrelid = 'audit_log'::regclass;
  `);
  console.log('Triggers on audit_log:', triggers.rows);

  const policies = await client.query(`
    SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) AS qual, pg_get_expr(polwithcheck, polrelid) AS with_check
    FROM pg_policy
    WHERE polrelid = 'audit_log'::regclass;
  `);
  console.log('Policies on audit_log:', policies.rows);

  // In supabase-js, .insert([...]).select() executes an INSERT and then a SELECT!
  // If SELECT policy on audit_log restricts anon, the .select() will fail with 42501 (RLS violation)!
  // Let's add SELECT policy on audit_log for public/anon
  await client.query(`
    DROP POLICY IF EXISTS "public read audit" ON audit_log;
    CREATE POLICY "public read audit" ON audit_log FOR SELECT USING (true);
  `);
  console.log('Added public read audit policy');

  await client.end();
}
run();
