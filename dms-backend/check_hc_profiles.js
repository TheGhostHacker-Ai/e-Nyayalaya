const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT full_name, role, status FROM profiles WHERE org_id IN (SELECT id FROM organisations WHERE org_type = 'high_court')");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  client.end();
});
