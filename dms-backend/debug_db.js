const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function debugDb() {
  try {
    await client.connect();
    
    console.log("--- PROFILES ---");
    const profiles = await client.query(`SELECT email, role, status FROM profiles;`);
    console.table(profiles.rows);

    console.log("\n--- ORGS ---");
    const orgs = await client.query(`SELECT id, name, org_type FROM organisations limit 5;`);
    console.table(orgs.rows);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

debugDb();
