const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function simplifyAllInserts() {
  try {
    await client.connect();
    
    const query = `
      -- Simplify Judgements
      DROP POLICY IF EXISTS "only judge pronounces" ON judgements;
      CREATE POLICY "only judge pronounces" ON judgements FOR INSERT WITH CHECK (
        current_role_of() = 'judge' AND pronounced_by = auth.uid()
      );

      -- Simplify Court Sessions
      DROP POLICY IF EXISTS "judge adds sessions" ON court_sessions;
      CREATE POLICY "judge adds sessions" ON court_sessions FOR INSERT WITH CHECK (
        current_role_of() = 'judge' AND recorded_by = auth.uid()
      );

      -- Simplify Documents (Evidence, etc)
      DROP POLICY IF EXISTS "members upload docs" ON documents;
      CREATE POLICY "members upload docs" ON documents FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
      );

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Simplified all insert RLS for the timeline elements!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

simplifyAllInserts();
