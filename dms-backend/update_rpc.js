const { Client } = require('pg');
const client = new Client('postgresql://postgres:Obrinnar%40son%2311@db.qsmuvcijmmzjwwuqftbm.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query(`
      create or replace function judge_revoke_lawyer(p_case_id uuid, p_lawyer_id uuid, p_reason text)
      returns void language plpgsql security definer as $$
      declare
        v_count int;
      begin
        if current_role_of() <> 'judge' or not is_case_member(p_case_id) then
          raise exception 'not authorised';
        end if;
      
        update case_participants
           set revoked_at = now()
         where case_id = p_case_id and user_id = p_lawyer_id and revoked_at is null;
         
        get diagnostics v_count = ROW_COUNT;
        if v_count = 0 then
          raise exception 'No active participant found for this lawyer in this case.';
        end if;
      
        insert into audit_log (actor_id, action, entity_type, entity_id, case_id, metadata)
        values (auth.uid(), 'LAWYER_REVOKED_DIRECT', 'case_participants', p_lawyer_id,
                p_case_id, jsonb_build_object('reason', p_reason));
      end $$;
    `);
    console.log("RPC updated successfully.");
  } catch(e) { console.error(e); }
  client.end();
});
