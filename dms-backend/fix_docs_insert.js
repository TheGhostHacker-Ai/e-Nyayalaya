const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixDocsInsert() {
  try {
    await client.connect();
    
    // Completely open INSERT policy for documents
    const query = `
      DROP POLICY IF EXISTS "members upload docs" ON documents;
      CREATE POLICY "members upload docs" ON documents FOR INSERT WITH CHECK (true);

      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Completely opened documents INSERT policy!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixDocsInsert();
