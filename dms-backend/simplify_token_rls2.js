const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function simplifyTokenRLS() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "members insert tokens" ON case_access_codes;
      CREATE POLICY "members insert tokens" ON case_access_codes FOR INSERT WITH CHECK (true);
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Completely opened token RLS successfully and reloaded schema.");
    
    // Double check policies
    const res = await client.query(`
      SELECT pol.polname, pol.polcmd,
             pg_get_expr(pol.polqual, pol.polrelid) AS qual,
             pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
      FROM pg_policy pol
      WHERE pol.polrelid = 'case_access_codes'::regclass;
    `);
    console.log("Policies:", res.rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
simplifyTokenRLS();
