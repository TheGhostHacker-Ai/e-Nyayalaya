const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixCasesUpdate() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "io updates own case" ON cases;
      CREATE POLICY "io updates own case" ON cases FOR UPDATE USING (
        current_role_of() IN ('investigating_officer', 'police_officer', 'judge')
      );

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Fixed cases update RLS successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixCasesUpdate();
