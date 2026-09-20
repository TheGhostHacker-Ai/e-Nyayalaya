const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function simplifyTokenRLS() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "members insert tokens" ON case_access_codes;
      CREATE POLICY "members insert tokens" ON case_access_codes FOR INSERT WITH CHECK (
        current_role_of() IN ('police_officer', 'investigating_officer', 'judge')
      );
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Simplified token RLS successfully and reloaded schema.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
simplifyTokenRLS();
