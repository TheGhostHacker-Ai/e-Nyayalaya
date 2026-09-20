const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function clearLawyers() {
  try {
    await client.connect();
    
    // Delete all lawyers to give a clean slate
    await client.query(`DELETE FROM auth.users WHERE id IN (SELECT id FROM profiles WHERE role = 'lawyer')`);
    await client.query(`DELETE FROM profiles WHERE role = 'lawyer'`);
    
    console.log("Cleared all lawyer accounts for a fresh start.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}
clearLawyers();
