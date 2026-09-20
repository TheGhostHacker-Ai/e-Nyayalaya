const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function checkAuth() {
  try {
    await client.connect();
    // Fetch the 5 most recently updated users in auth.users
    const query = `
      SELECT email, email_confirmed_at, confirmation_sent_at, recovery_sent_at, updated_at
      FROM auth.users
      ORDER BY updated_at DESC
      LIMIT 5;
    `;
    const res = await client.query(query);
    console.log("Recent Auth Users:");
    console.table(res.rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkAuth();
