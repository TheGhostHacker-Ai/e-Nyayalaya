const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixOrgsInsert() {
  try {
    await client.connect();
    
    // Add public INSERT policy for organisations so registration works
    const query = `
      DROP POLICY IF EXISTS "Public insert for organisations" ON organisations;
      CREATE POLICY "Public insert for organisations" ON organisations FOR INSERT WITH CHECK (true);

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Added public insert policy for organisations!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixOrgsInsert();
