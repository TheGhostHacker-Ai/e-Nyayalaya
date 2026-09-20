const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');

client.connect().then(async () => {
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION get_bulk_transfer_details(cids uuid[])
      RETURNS json
      LANGUAGE plpgsql SECURITY DEFINER AS $$
      DECLARE
        res json;
      BEGIN
        SELECT json_agg(json_build_object(
          'case_id', a.original_case_id,
          'court_name', o.name,
          'court_type', o.org_type,
          'presiding_judge', (
             SELECT p.full_name
             FROM case_participants cp
             JOIN profiles p ON p.id = cp.user_id
             WHERE cp.case_id = a.new_case_id AND p.role = 'judge'
             LIMIT 1
          )
        )) INTO res
        FROM appeals a
        JOIN cases c ON c.id = a.new_case_id
        LEFT JOIN organisations o ON o.id = c.court_org_id
        WHERE a.original_case_id = ANY(cids);
        
        RETURN COALESCE(res, '[]'::json);
      END;
      $$;
    `);
    console.log("RPC created successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
});
