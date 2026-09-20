const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function fixProfilesRls() {
  try {
    await client.connect();
    
    const query = `
      DROP POLICY IF EXISTS "create own profile on signup" ON profiles;
      CREATE POLICY "create own profile on signup" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
    `;
    
    await client.query(query);
    console.log("Successfully updated profiles RLS policy to allow instant approvals!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixProfilesRls();
