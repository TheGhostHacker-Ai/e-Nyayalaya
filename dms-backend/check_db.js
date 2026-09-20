const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function checkLawyers() {
  await client.connect();
  const res = await client.query("SELECT * FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.role = 'lawyer' OR p.id IS NULL");
  console.log("Auth users / Profiles:");
  console.log(res.rows);
  
  const res2 = await client.query("SELECT * FROM case_participants");
  console.log("Participants:");
  console.log(res2.rows);

  await client.end();
}
checkLawyers();
