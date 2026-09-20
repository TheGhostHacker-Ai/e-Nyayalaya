const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'is_case_member'");
    console.log(res.rows[0].pg_get_functiondef);
  } catch(e) { console.error(e); }
  client.end();
});
