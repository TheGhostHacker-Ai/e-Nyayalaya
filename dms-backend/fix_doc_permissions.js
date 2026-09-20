const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();

  // 1. Drop NOT NULL on documents.uploaded_by
  await client.query(`
    ALTER TABLE documents ALTER COLUMN uploaded_by DROP NOT NULL;
    ALTER TABLE documents ALTER COLUMN storage_path DROP NOT NULL;
  `);
  console.log('documents uploaded_by & storage_path dropped NOT NULL');

  // 2. Grant permissions to anon & authenticated on cases, documents, audit_log, organisations
  await client.query(`
    GRANT ALL ON TABLE cases TO anon, authenticated;
    GRANT ALL ON TABLE documents TO anon, authenticated;
    GRANT ALL ON TABLE audit_log TO anon, authenticated;
    GRANT ALL ON TABLE organisations TO anon, authenticated;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  `);
  console.log('Granted permissions to anon & authenticated');

  // 3. Check document_type enum values
  const docEnum = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'document_type'
    ORDER BY e.enumsortorder;
  `);
  console.log('document_type enum values:', docEnum.rows.map(r => r.enumlabel));

  // 4. Check document_status enum values
  const statusEnum = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'document_status'
    ORDER BY e.enumsortorder;
  `);
  console.log('document_status enum values:', statusEnum.rows.map(r => r.enumlabel));

  await client.end();
}
run();
