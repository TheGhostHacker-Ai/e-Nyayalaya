const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    await client.query("UPDATE organisations SET org_type = 'supreme_court' WHERE name ILIKE '%supreme court%'");
    console.log('Fixed supreme court org_type');
  } catch(e) { console.error(e); }
  client.end();
});
