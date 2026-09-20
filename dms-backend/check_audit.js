const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function checkAudit() {
  try {
    await client.connect();
    
    const count = await client.query(`SELECT count(*) FROM audit_log;`);
    console.log("Total audit logs:", count.rows[0].count);
    
    if (count.rows[0].count > 0) {
      const logs = await client.query(`SELECT * FROM audit_log limit 5;`);
      console.table(logs.rows);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkAudit();
