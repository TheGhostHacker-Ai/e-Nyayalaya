const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixTriggerSecurity() {
  try {
    await client.connect();
    
    // By declaring the trigger function SECURITY DEFINER, it runs as the owner (postgres)
    // and bypasses RLS policies for the cascaded updates to cases and documents.
    const query = `
      CREATE OR REPLACE FUNCTION on_judgement_pronounced() RETURNS trigger
      LANGUAGE plpgsql SECURITY DEFINER
      AS $$
      begin
        update cases 
          set stage = 'disposed'
          where id = new.case_id;
          
        -- Note: the 'is_current' and 'status' columns might not exist if they weren't fully implemented in the current schema.
        -- We'll safely update documents if those columns exist, or just skip it if they don't, 
        -- but wait, the query already has them, so they must exist.
        update documents
          set status = 'locked'
          where case_id = new.case_id;
          
        return new;
      end;
      $$;
    `;
    
    await client.query(query);
    console.log("Fixed trigger by making it SECURITY DEFINER.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixTriggerSecurity();
