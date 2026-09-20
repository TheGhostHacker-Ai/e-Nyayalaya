const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function fixAccess() {
  try {
    await client.connect();
    
    // Update the is_case_member function to dynamically grant access to any user
    // whose organisation (Police Station or Court) matches the case's assigned org.
    const query = `
      CREATE OR REPLACE FUNCTION is_case_member(cid uuid) RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER AS $$
        SELECT EXISTS (
          SELECT 1 FROM case_participants cp
          WHERE cp.case_id = cid
            AND cp.user_id = auth.uid()
            AND cp.revoked_at IS NULL
        ) OR EXISTS (
          SELECT 1 FROM cases c
          JOIN profiles p ON p.id = auth.uid()
          WHERE c.id = cid
            AND (c.police_org_id = p.org_id OR c.court_org_id = p.org_id)
            AND p.status = 'approved'
        )
      $$;
    `;
    
    await client.query(query);
    console.log("Successfully updated the ABAC rules! Judges can now see transferred cases instantly.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixAccess();
