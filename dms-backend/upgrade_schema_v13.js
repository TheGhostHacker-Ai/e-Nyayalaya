const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function upgradeSchema() {
  try {
    await client.connect();
    
    // 1. Update App Role Enum
    try {
      await client.query(`ALTER TYPE app_role ADD VALUE 'lawyer';`);
      console.log("Added 'lawyer' to app_role enum.");
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    // 2. Add columns to organisations
    try {
      await client.query(`ALTER TABLE organisations ADD COLUMN state TEXT;`);
      await client.query(`ALTER TABLE organisations ADD COLUMN district TEXT;`);
      // Update existing orgs to have a default state for demo
      await client.query(`UPDATE organisations SET state = 'Uttar Pradesh' WHERE state IS NULL;`);
      await client.query(`UPDATE organisations SET district = 'Lucknow' WHERE district IS NULL AND org_type = 'police_station';`);
      await client.query(`UPDATE organisations SET district = 'Lucknow' WHERE district IS NULL AND org_type = 'court';`);
      console.log("Added state and district to organisations.");
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    // 3. Add columns to cases
    try {
      await client.query(`ALTER TABLE cases ADD COLUMN plaintiff TEXT;`);
      await client.query(`ALTER TABLE cases ADD COLUMN defendant TEXT;`);
      // Backfill existing cases with a default title pattern
      await client.query(`UPDATE cases SET plaintiff = 'State', defendant = 'Unknown' WHERE plaintiff IS NULL;`);
      console.log("Added plaintiff and defendant to cases.");
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }

    // 4. Create case_access_codes table
    const createTokensTable = `
      CREATE TABLE IF NOT EXISTS case_access_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) NOT NULL,
        code TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ DEFAULT now()
      );
      
      ALTER TABLE case_access_codes ENABLE ROW LEVEL SECURITY;
      
      -- Anyone logged in can read an active token to join
      DROP POLICY IF EXISTS "read active tokens" ON case_access_codes;
      CREATE POLICY "read active tokens" ON case_access_codes FOR SELECT USING (is_active = true);
      
      -- Only case members can generate tokens
      DROP POLICY IF EXISTS "members insert tokens" ON case_access_codes;
      CREATE POLICY "members insert tokens" ON case_access_codes FOR INSERT WITH CHECK (is_case_member(case_id));
    `;
    await client.query(createTokensTable);
    console.log("Created case_access_codes table and policies.");

    // 5. Update cases trigger to auto-revoke lawyer access on close
    const revokeTrigger = `
      CREATE OR REPLACE FUNCTION revoke_lawyer_access_on_close() RETURNS trigger AS $$
      BEGIN
        IF NEW.stage = 'disposed' AND OLD.stage != 'disposed' THEN
          -- Invalidate access codes
          UPDATE case_access_codes SET is_active = false WHERE case_id = NEW.id;
          -- Revoke lawyers from participants
          UPDATE case_participants SET revoked_at = now() 
          WHERE case_id = NEW.id AND role_in_case = 'lawyer';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_revoke_lawyers ON cases;
      CREATE TRIGGER trg_revoke_lawyers AFTER UPDATE OF stage ON cases
      FOR EACH ROW EXECUTE FUNCTION revoke_lawyer_access_on_close();
    `;
    await client.query(revokeTrigger);
    console.log("Created auto-revoke trigger for disposed cases.");

    // 6. Fix profile trigger to allow lawyers to auto-approve during hackathon demo
    // Already handled because Auth.jsx sends 'approved'.

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    await client.end();
  }
}

upgradeSchema();
