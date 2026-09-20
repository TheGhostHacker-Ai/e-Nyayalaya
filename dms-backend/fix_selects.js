const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixAllSelects() {
  try {
    await client.connect();
    
    // Open SELECT policies for the presentation MVP
    const query = `
      -- DOCUMENTS
      DROP POLICY IF EXISTS "members read docs" ON documents;
      CREATE POLICY "members read docs" ON documents FOR SELECT USING (true);
      
      -- COURT SESSIONS
      DROP POLICY IF EXISTS "members read sessions" ON court_sessions;
      CREATE POLICY "members read sessions" ON court_sessions FOR SELECT USING (true);
      
      -- CASES
      DROP POLICY IF EXISTS "creator reads case" ON cases;
      DROP POLICY IF EXISTS "members read case" ON cases;
      CREATE POLICY "read all cases" ON cases FOR SELECT USING (true);

      -- CASE PARTICIPANTS (already done earlier, but ensure it)
      DROP POLICY IF EXISTS "read all participants" ON case_participants;
      CREATE POLICY "read all participants" ON case_participants FOR SELECT USING (true);

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Completely opened all timeline SELECT policies!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixAllSelects();
