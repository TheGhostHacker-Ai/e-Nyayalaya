const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function fixSchema() {
  try {
    await client.connect();
    
    // Add description column
    try {
      await client.query(`ALTER TABLE cases ADD COLUMN description TEXT;`);
      console.log("Added description column to cases.");
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log("Description column already exists.");
    }

    // Force PostgREST schema cache reload
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Notified PostgREST to reload schema cache.");
    
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await client.end();
  }
}

fixSchema();
