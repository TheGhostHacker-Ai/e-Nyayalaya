const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function reloadSchema() {
  try {
    await client.connect();
    
    // This tells the Supabase API to fetch the new schema (including the updated enum)
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Reloaded schema cache successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

reloadSchema();
