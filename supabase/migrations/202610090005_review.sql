create function public.verify_repair(target uuid, approved boolean, explanation text) returns void language plpgsql security definer set search_path=public as $$
declare i incidents;
begin
 if my_role() is distinct from 'reviewer' then raise exception 'Reviewer role required'; end if;
 select * into i from incidents where id=target for update;
 if not found or i.status<>'repaired_pending_review' then raise exception 'Repair must await review'; end if;
 if length(trim(explanation))<5 then raise exception 'Written verification reason required'; end if;
 if approved and not exists(select 1 from repair_jobs where incident_id=target and after_photo_path is not null and repaired_at is not null) then raise exception 'After-photo required'; end if;
 perform set_config('roadwatch.reason',explanation,true);
 if approved then update repair_jobs set verified_by=auth.uid(),verified_at=now() where incident_id=target;
 else update repair_jobs set after_photo_path=null,repaired_at=null,verified_by=null,verified_at=null where incident_id=target; end if;
 update incidents set status=case when approved then 'closed' else 'assigned' end where id=target;
 update reports set status=case when approved then 'closed' else 'assigned' end where incident_id=target;
end$$;
