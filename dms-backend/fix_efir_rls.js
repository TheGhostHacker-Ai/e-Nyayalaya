const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Fix cases INSERT policy
    await client.query(`
      DROP POLICY IF EXISTS "police file case" ON cases;
      DROP POLICY IF EXISTS "public or police file case" ON cases;
      CREATE POLICY "public or police file case" ON cases FOR INSERT WITH CHECK (
        filed_by = auth.uid() OR 
        auth.uid() IS NULL OR 
        case_category = 'Criminal (e-FIR)'
      );
    `);
    console.log('cases INSERT policy updated successfully');

    // 2. Fix audit_log INSERT policy
    await client.query(`
      DROP POLICY IF EXISTS "allow insert audit" ON audit_log;
      CREATE POLICY "allow insert audit" ON audit_log FOR INSERT WITH CHECK (true);
    `);
    console.log('audit_log INSERT policy updated successfully');

    // 3. Fix documents INSERT policy
    await client.query(`
      DROP POLICY IF EXISTS "allow insert documents" ON documents;
      CREATE POLICY "allow insert documents" ON documents FOR INSERT WITH CHECK (true);
    `);
    console.log('documents INSERT policy updated successfully');

    // 4. Verify policies on cases
    const res = await client.query(`
      SELECT polname, polcmd, polroles, pg_get_expr(polqual, polrelid) AS qual, pg_get_expr(polwithcheck, polrelid) AS with_check
      FROM pg_policy
      WHERE polrelid = 'cases'::regclass;
    `);
    console.log('Current cases policies:', JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error('Error applying policies:', err);
  } finally {
    await client.end();
  }
}

run();
