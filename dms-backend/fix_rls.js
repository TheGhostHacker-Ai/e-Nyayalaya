const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function fixRls() {
  try {
    await client.connect();
    
    // Add a policy so the creator can always read the case they just inserted,
    // which prevents the INSERT ... RETURNING * clause from failing RLS!
    const query = `
      CREATE POLICY "creator reads case" ON cases FOR SELECT USING (filed_by = auth.uid());
    `;
    
    await client.query(query);
    console.log("Successfully fixed the Cases RLS policy!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixRls();
