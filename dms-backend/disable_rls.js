const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function disableRLS() {
  try {
    await client.connect();
    
    const query = `
      ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
    `;
    
    await client.query(query);
    console.log("Disabled RLS on cases completely.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
disableRLS();
