const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixEnum() {
  try {
    await client.connect();
    
    const query = `
      ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'order_sheet';
    `;
    
    await client.query(query);
    console.log("Successfully added 'order_sheet' to doc_type enum!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixEnum();
