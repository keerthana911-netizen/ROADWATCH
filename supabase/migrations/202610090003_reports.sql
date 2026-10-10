create function public.submit_report(segment uuid, lat double precision, lng double precision, source text, photo text, report_note text) returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare rid uuid;
begin
 if my_role()<>'citizen' then raise exception 'Citizen role required'; end if;
 if lat not between -90 and 90 or lng not between -180 and 180 or source not in ('gps','manual_pin') or length(report_note)>2000 then raise exception 'Invalid report'; end if;
 if not exists(select 1 from road_segments where id=segment) then raise exception 'Unknown road'; end if;
 if split_part(photo,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='road-photos' and name=photo) then raise exception 'Photo upload required'; end if;
 perform set_config('roadwatch.reason','Citizen submitted a photo and location',true);
 insert into reports(reporter_id,road_segment_id,location,location_source,photo_path,note) values(auth.uid(),segment,st_setsrid(st_makepoint(lng,lat),4326)::geography,source,photo,report_note) returning id into rid;
 return rid;
end$$;
create view public.report_locations with(security_invoker=true) as select id,ticket_id,reporter_id,road_segment_id,location_source,note,status,incident_id,created_at,extensions.st_y(location::extensions.geometry) as lat,extensions.st_x(location::extensions.geometry) as lng from reports;
create view public.incident_locations with(security_invoker=true) as select id,road_segment_id,severity,sensitive_location,status,opened_at,previous_repair_id,extensions.st_y(location::extensions.geometry) as lat,extensions.st_x(location::extensions.geometry) as lng from incidents;
grant select on report_locations,incident_locations to authenticated;
create function public.flag_unresolved(target uuid, message text) returns void language plpgsql security definer set search_path=public as $$begin
 if my_role()<>'citizen' or not exists(select 1 from reports where id=target and reporter_id=auth.uid() and status in ('closed','repaired_pending_review')) then raise exception 'Only your repaired report can be flagged'; end if;
 if length(trim(message))<5 or length(message)>2000 then raise exception 'Please explain the unresolved repair'; end if;
 insert into report_notes(report_id,actor_id,note) values(target,auth.uid(),message);
end$$;
