const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixOrgId() {
  try {
    await client.connect();
    
    // Drop NOT NULL constraint on org_id in profiles
    const query = `
      ALTER TABLE profiles ALTER COLUMN org_id DROP NOT NULL;
    `;
    
    await client.query(query);
    console.log("Successfully dropped NOT NULL constraint on profiles.org_id");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
fixOrgId();
