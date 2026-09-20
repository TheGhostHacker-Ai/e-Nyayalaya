const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function seed() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    // Ensure we don't insert duplicates if they already exist
    const query = `
      ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public read for organisations" ON organisations;
      CREATE POLICY "Public read for organisations" ON organisations FOR SELECT USING (true);
    `;
    
    await client.query(query);
    console.log("Successfully seeded organisations.");
    
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await client.end();
  }
}

seed();
