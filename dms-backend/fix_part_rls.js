const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixPartRLS() {
  try {
    await client.connect();
    
    // Create SELECT policy for case_participants
    const query = `
      DROP POLICY IF EXISTS "read all participants" ON case_participants;
      CREATE POLICY "read all participants" ON case_participants FOR SELECT USING (auth.uid() IS NOT NULL);
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Fixed case_participants RLS successfully.");

    const res = await client.query(`SELECT email, role, badge_no FROM profiles WHERE role = 'lawyer'`);
    console.log("Existing Lawyers:");
    console.table(res.rows);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
fixPartRLS();
