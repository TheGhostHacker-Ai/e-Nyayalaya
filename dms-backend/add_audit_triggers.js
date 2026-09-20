const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function addAuditTriggers() {
  try {
    await client.connect();
    
    const query = `
      -- 1. Trigger for Cases
      CREATE OR REPLACE FUNCTION audit_cases() RETURNS trigger AS $$
      BEGIN
        INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id)
        VALUES (NEW.filed_by, 'CASE_CREATED', 'cases', NEW.id, NEW.id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS trg_audit_cases ON cases;
      CREATE TRIGGER trg_audit_cases AFTER INSERT ON cases
      FOR EACH ROW EXECUTE FUNCTION audit_cases();

      -- 2. Trigger for Documents
      CREATE OR REPLACE FUNCTION audit_documents() RETURNS trigger AS $$
      BEGIN
        INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id)
        VALUES (NEW.uploaded_by, 'EVIDENCE_UPLOADED', 'documents', NEW.id, NEW.case_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS trg_audit_documents ON documents;
      CREATE TRIGGER trg_audit_documents AFTER INSERT ON documents
      FOR EACH ROW EXECUTE FUNCTION audit_documents();

      -- 3. Trigger for Court Sessions
      CREATE OR REPLACE FUNCTION audit_sessions() RETURNS trigger AS $$
      BEGIN
        INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id)
        VALUES (NEW.recorded_by, 'HEARING_SCHEDULED', 'court_sessions', NEW.id, NEW.case_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS trg_audit_sessions ON court_sessions;
      CREATE TRIGGER trg_audit_sessions AFTER INSERT ON court_sessions
      FOR EACH ROW EXECUTE FUNCTION audit_sessions();

      -- 4. Trigger for Judgements
      CREATE OR REPLACE FUNCTION audit_judgements() RETURNS trigger AS $$
      BEGIN
        INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id)
        VALUES (NEW.pronounced_by, 'JUDGEMENT_PRONOUNCED', 'judgements', NEW.id, NEW.case_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS trg_audit_judgements ON judgements;
      CREATE TRIGGER trg_audit_judgements AFTER INSERT ON judgements
      FOR EACH ROW EXECUTE FUNCTION audit_judgements();
    `;
    
    await client.query(query);
    console.log("Successfully created automatic audit triggers!");
    
    // Backfill existing data to make the demo look good immediately!
    const backfill = `
      INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id, created_at)
      SELECT filed_by, 'CASE_CREATED', 'cases', id, id, created_at FROM cases WHERE id NOT IN (SELECT entity_id FROM audit_log WHERE entity_type = 'cases');
      
      INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id, created_at)
      SELECT uploaded_by, 'EVIDENCE_UPLOADED', 'documents', id, case_id, created_at FROM documents WHERE id NOT IN (SELECT entity_id FROM audit_log WHERE entity_type = 'documents');
      
      INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id, created_at)
      SELECT recorded_by, 'HEARING_SCHEDULED', 'court_sessions', id, case_id, created_at FROM court_sessions WHERE id NOT IN (SELECT entity_id FROM audit_log WHERE entity_type = 'court_sessions');
      
      INSERT INTO audit_log (actor_id, action, entity_type, entity_id, case_id, created_at)
      SELECT pronounced_by, 'JUDGEMENT_PRONOUNCED', 'judgements', id, case_id, pronounced_at FROM judgements WHERE id NOT IN (SELECT entity_id FROM audit_log WHERE entity_type = 'judgements');
    `;
    
    await client.query(backfill);
    console.log("Successfully backfilled historical audit logs!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

addAuditTriggers();
