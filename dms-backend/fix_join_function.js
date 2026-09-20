const { Client } = require('pg');
const connectionString = 'postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres';
const client = new Client({ connectionString });

async function fixJoinFunction() {
  try {
    await client.connect();
    
    const query = `
      CREATE OR REPLACE FUNCTION join_case_with_token(token_code text)
      RETURNS uuid
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        target_case_id uuid;
        token_id uuid;
      BEGIN
        -- Find active token
        SELECT id, case_id INTO token_id, target_case_id
        FROM case_access_codes
        WHERE code = token_code AND is_active = true;

        IF target_case_id IS NULL THEN
          RAISE EXCEPTION 'Invalid or expired access token.';
        END IF;

        -- Insert into participants (ignore if already exists)
        INSERT INTO case_participants (case_id, user_id, role_in_case)
        VALUES (target_case_id, auth.uid(), 'lawyer')
        ON CONFLICT (case_id, user_id) DO NOTHING;

        RETURN target_case_id;
      END;
      $$;
      
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(query);
    console.log("Successfully recreated join_case_with_token RPC function with user_id!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

fixJoinFunction();
