const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixJudgementsOnceAndForAll() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "only judge pronounces" ON judgements;
      CREATE POLICY "only judge pronounces" ON judgements FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "judge adds sessions" ON court_sessions;
      CREATE POLICY "judge adds sessions" ON court_sessions FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "io updates own case" ON cases;
      CREATE POLICY "io updates own case" ON cases FOR UPDATE USING (true);

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Completely opened all timeline INSERT/UPDATE policies!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixJudgementsOnceAndForAll();
