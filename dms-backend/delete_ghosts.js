const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function deleteGhosts() {
  try {
    await client.connect();
    
    const query = `
      DELETE FROM auth.users 
      WHERE id NOT IN (SELECT id FROM public.profiles);
    `;
    
    await client.query(query);
    console.log("Successfully wiped all ghost accounts (users that have no profile)!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

deleteGhosts();
