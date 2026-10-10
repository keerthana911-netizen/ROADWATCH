-- Officer-confirmed grouping; preserve separate report and incident status vocabularies.
create function public.group_report(target uuid, match_id uuid, explanation text) returns uuid language plpgsql security definer set search_path=public as $$
declare r reports; i incidents; new_id uuid;
begin
 select * into r from reports where id=target for update;
 if not found then raise exception 'Report not found'; end if;
 perform require_officer(r.road_segment_id);
 if r.incident_id is not null then raise exception 'Report already grouped'; end if;
 if length(trim(explanation))<5 then raise exception 'Written reason required'; end if;
 perform set_config('roadwatch.reason',explanation,true);
 if match_id is null then insert into incidents(road_segment_id,location) values(r.road_segment_id,r.location) returning id into new_id;
 else
 select * into i from incidents where id=match_id for update;
 if not found or i.status not in ('open','assigned') then raise exception 'Only open or assigned incidents can receive reports'; end if;
 perform require_officer(i.road_segment_id);
 if i.road_segment_id<>r.road_segment_id then raise exception 'Confirm the correct road segment before merging'; end if;
 new_id:=i.id;
 end if;
 update reports set incident_id=new_id,status=case when i.status='assigned' then 'assigned' else 'grouped' end where id=r.id;
 return new_id;
end$$;
create function public.assign_repair(target uuid, confirmed_severity numeric, confirmed_sensitive boolean, assignee uuid, due date, contractor text, warranty integer, explanation text) returns void language plpgsql security definer set search_path=public as $$
declare i incidents;
begin
 select * into i from incidents where id=target for update;
 if not found then raise exception 'Incident not found'; end if;
 perform require_officer(i.road_segment_id);
 if i.status not in ('open','assigned') then raise exception 'Incident cannot be assigned in this state'; end if;
 if length(trim(explanation))<5 then raise exception 'Written confirmation reason required'; end if;
 if confirmed_severity not between 0 and 1 or warranty not between 1 and 3650 or due is null then raise exception 'Invalid assignment'; end if;
 if not exists(select 1 from profiles where id=assignee and role='officer' and ward_id=my_ward()) then raise exception 'Owner must be an officer in this ward'; end if;
 perform set_config('roadwatch.reason',explanation,true);
 insert into repair_jobs(incident_id,owner,due_date,contractor_name,warranty_days) values(target,assignee,due,nullif(trim(contractor),''),warranty) on conflict(incident_id) do update set owner=excluded.owner,due_date=excluded.due_date,contractor_name=excluded.contractor_name,warranty_days=excluded.warranty_days;
 update incidents set severity=confirmed_severity,sensitive_location=confirmed_sensitive,status='assigned' where id=target;
 if i.status='assigned' then insert into status_events(entity_type,entity_id,from_status,to_status,actor_id,reason) values('incident',target,'assigned','assigned',auth.uid(),explanation); end if;
 update reports set status='assigned' where incident_id=target and status is distinct from 'assigned';
end$$;
create function public.mark_repaired(target uuid, photo text, explanation text) returns void language plpgsql security definer set search_path=public as $$
declare i incidents;
begin
 select * into i from incidents where id=target for update;
 if not found then raise exception 'Incident not found'; end if;
 perform require_officer(i.road_segment_id);
 if i.status<>'assigned' or not exists(select 1 from repair_jobs where incident_id=target) then raise exception 'Assign a repair job first'; end if;
 if length(trim(explanation))<5 or split_part(photo,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='road-photos' and name=photo) then raise exception 'Uploaded after-photo and written reason required'; end if;
 perform set_config('roadwatch.reason',explanation,true);
 update repair_jobs set after_photo_path=photo,repaired_at=now() where incident_id=target;
 update incidents set status='repaired_pending_review' where id=target;
 update reports set status='repaired_pending_review' where incident_id=target;
end$$;

