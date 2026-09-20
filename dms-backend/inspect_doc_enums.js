const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  const types = await client.query(`
    SELECT column_name, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name IN ('doc_type', 'status');
  `);
  console.log('Document column udt_names:', types.rows);

  for (const row of types.rows) {
    const enums = await client.query(`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = $1;
    `, [row.udt_name]);
    console.log(`Enum values for ${row.udt_name}:`, enums.rows.map(e => e.enumlabel));
  }

  // Ensure documents insert policy
  await client.query(`
    DROP POLICY IF EXISTS "allow insert documents" ON documents;
    DROP POLICY IF EXISTS "public or member insert documents" ON documents;
    CREATE POLICY "public or member insert documents" ON documents FOR INSERT WITH CHECK (true);
    CREATE POLICY "public or member read documents" ON documents FOR SELECT USING (true);
  `);
  console.log('Updated documents policies');

  await client.end();
}
run();
