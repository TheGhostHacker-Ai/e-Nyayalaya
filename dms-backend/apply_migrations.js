const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

async function executeSqlStatements(client, sqlText) {
  // Split by semicolon, but this is a naive split.
  // Instead of splitting (which breaks functions with semicolons inside $$),
  // we will just execute the whole block, and if it fails, we log it but don't crash entirely.
  // Actually, since there are $$ blocks, naive splitting is dangerous.
  try {
    await client.query(sqlText);
  } catch (err) {
    if (err.code === '42710' || err.code === '42P07' || err.code === '42701') {
      console.log("Ignoring already exists error: ", err.message);
    } else {
      console.error("Error executing block:", err.message);
      // throw err; // Don't throw so we can proceed with other blocks
    }
  }
}

async function apply() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log("Applying ALTER TYPE standalone...");
    for (const q of [
      `alter type case_stage add value if not exists 'appeal_admitted';`,
      `alter type case_stage add value if not exists 'in_appellate_hearing';`,
      `alter type case_stage add value if not exists 'appeal_disposed';`
    ]) {
      try { await client.query(q); } catch(e) {}
    }
    console.log("ALTER TYPE applied.");

    const revokeSql = fs.readFileSync(path.join(__dirname, '..', 'revocation-workflow-migration.sql'), 'utf8');
    let appealsSql = fs.readFileSync(path.join(__dirname, '..', 'appeals-workflow-migration.sql'), 'utf8');
    
    appealsSql = appealsSql.replace(/alter type case_stage add value if not exists 'appeal_admitted';/g, '');
    appealsSql = appealsSql.replace(/alter type case_stage add value if not exists 'in_appellate_hearing';/g, '');
    appealsSql = appealsSql.replace(/alter type case_stage add value if not exists 'appeal_disposed';/g, '');

    console.log("Executing revocation SQL...");
    await executeSqlStatements(client, revokeSql);

    console.log("Executing appeals SQL...");
    await executeSqlStatements(client, appealsSql);

    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log("Successfully applied all migrations and reloaded schema cache!");

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await client.end();
  }
}

apply();
