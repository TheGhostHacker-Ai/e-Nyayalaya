const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT proname FROM pg_proc WHERE proname = 'judge_revoke_lawyer'");
    console.log('RPC exists:', res.rows.length > 0);
  } catch(e) { console.error(e); }
  client.end();
});
