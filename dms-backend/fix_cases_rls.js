const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixRLS() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "members read case" ON cases;
      CREATE POLICY "members read case" ON cases FOR SELECT USING (
        is_approved() AND (
          filed_by = auth.uid() OR
          is_case_member(id)
        )
      );
      
      -- Let's also restore the exact original insert policy just in case
      DROP POLICY IF EXISTS "police file case" ON cases;
      CREATE POLICY "police file case" ON cases FOR INSERT WITH CHECK (
        is_approved() 
        AND current_role_of() IN ('police_officer', 'investigating_officer')
        AND filed_by = auth.uid()
      );
    `;
    
    await client.query(query);
    console.log("Fixed cases RLS successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
fixRLS();
