const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  // 1. Update auto_enroll_creator function to guard against NULL filed_by
  await client.query(`
    CREATE OR REPLACE FUNCTION auto_enroll_creator()
    RETURNS TRIGGER AS $$
    declare
      v_role text;
    begin
      IF NEW.filed_by IS NOT NULL THEN
        v_role := case current_role_of()
          when 'judge' then 'referring_judge'
          when 'police_officer' then 'io'
          when 'investigating_officer' then 'io'
          else 'member'
        end;

        insert into case_participants (case_id, user_id, role_in_case, granted_by)
        values (NEW.id, NEW.filed_by, v_role, NEW.filed_by)
        on conflict (case_id, user_id) do nothing;
      END IF;

      return NEW;
    end;
    $$ LANGUAGE plpgsql;
  `);
  console.log('Updated auto_enroll_creator function');

  // 2. Update audit_cases trigger function
  await client.query(`
    CREATE OR REPLACE FUNCTION audit_cases()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id, record_hash)
      VALUES (
        NEW.filed_by, 
        'CASE_CREATED', 
        'cases', 
        NEW.id, 
        NEW.id, 
        coalesce(md5(NEW.id::text || now()::text), 'hash_init')
      );
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('Updated audit_cases function');

  // 3. Make audit_log.record_hash nullable or set default
  await client.query(`
    ALTER TABLE audit_log ALTER COLUMN record_hash DROP NOT NULL;
  `);
  console.log('audit_log.record_hash dropped NOT NULL');

  // 4. Ensure public RLS for reading e-FIR cases on landing page search
  await client.query(`
    DROP POLICY IF EXISTS "public read cases" ON cases;
    CREATE POLICY "public read cases" ON cases FOR SELECT USING (true);
  `);
  console.log('cases public read policy ensured');

  await client.end();
}

run().catch(console.error);
