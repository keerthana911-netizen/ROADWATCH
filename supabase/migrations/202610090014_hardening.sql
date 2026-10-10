drop trigger closure_gate on incidents;
create trigger closure_gate before insert or update on incidents for each row execute function closure_gate();
-- Explicit function allowlist: helpers used by RLS and approved transaction entry points only.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function my_role(),my_ward(),can_read_report(uuid),can_read_incident(uuid) to authenticated;
grant execute on function submit_report(uuid,double precision,double precision,text,text,text),flag_unresolved(uuid,text),group_report(uuid,uuid,text),assign_repair(uuid,numeric,boolean,uuid,date,text,integer,text),mark_repaired(uuid,text,text),verify_repair(uuid,boolean,text),log_ai(uuid,text,text,text,text,numeric,jsonb,jsonb,text),decide_ai(uuid,text,jsonb),store_embedding(uuid,extensions.vector,text),duplicate_candidates(uuid),confirm_duplicate(uuid,boolean,text) to authenticated;
-- Field and status constraints remain mandatory even for owner-side administration.
alter table repair_jobs add constraint repair_photo_required check(repaired_at is null or after_photo_path is not null);
alter table repair_jobs add constraint verification_complete check((verified_at is null and verified_by is null) or (verified_at is not null and verified_by is not null and repaired_at is not null and after_photo_path is not null));
