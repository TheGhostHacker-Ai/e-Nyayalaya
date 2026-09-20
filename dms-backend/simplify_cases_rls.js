const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function simplifyRLS() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "police file case" ON cases;
      CREATE POLICY "police file case" ON cases FOR INSERT WITH CHECK (
        filed_by = auth.uid()
      );

      DROP POLICY IF EXISTS "members read case" ON cases;
      CREATE POLICY "members read case" ON cases FOR SELECT USING (
        filed_by = auth.uid() OR is_case_member(id)
      );
    `;
    
    await client.query(query);
    console.log("Simplified cases RLS successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
simplifyRLS();
