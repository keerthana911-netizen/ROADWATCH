create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;
create table public.wards(id uuid primary key default gen_random_uuid(), name text not null);
create table public.profiles(id uuid primary key references auth.users(id), name text not null, role text not null check(role in ('citizen','officer','reviewer')), ward_id uuid references wards(id));
create table public.road_segments(id uuid primary key default gen_random_uuid(), name text not null, ward_id uuid not null references wards(id), geometry extensions.geometry(LineString,4326) not null, created_at timestamptz not null default now());
create sequence public.ticket_numbers;
create table public.incidents(id uuid primary key default gen_random_uuid(), road_segment_id uuid not null references road_segments(id), location extensions.geography(Point,4326) not null, severity numeric not null default .5 check(severity between 0 and 1), sensitive_location boolean not null default false, status text not null default 'open' check(status in ('open','assigned','repaired_pending_review','closed')), opened_at timestamptz not null default now(), previous_repair_id uuid);
create table public.reports(id uuid primary key default gen_random_uuid(), ticket_id text unique not null default ('RW-' || lpad(nextval('public.ticket_numbers')::text,4,'0')), reporter_id uuid not null references profiles(id), road_segment_id uuid not null references road_segments(id), location extensions.geography(Point,4326) not null, location_source text not null check(location_source in ('gps','manual_pin')), photo_path text not null, note text not null default '', status text not null default 'submitted' check(status in ('submitted','grouped','assigned','repaired_pending_review','closed')), incident_id uuid references incidents(id), created_at timestamptz not null default now());
create table public.repair_jobs(id uuid primary key default gen_random_uuid(), incident_id uuid not null unique references incidents(id), owner uuid not null references profiles(id), due_date date not null, contractor_name text, warranty_days integer not null default 90 check(warranty_days between 1 and 3650), after_photo_path text, repaired_at timestamptz, verified_by uuid references profiles(id), verified_at timestamptz);
alter table incidents add constraint previous_repair_fk foreign key(previous_repair_id) references repair_jobs(id);
create table public.status_events(id uuid primary key default gen_random_uuid(), entity_type text not null check(entity_type in ('report','incident')), entity_id uuid not null, from_status text, to_status text not null, actor_id uuid not null references profiles(id), reason text not null, created_at timestamptz not null default now());
create table public.report_notes(id uuid primary key default gen_random_uuid(), report_id uuid not null references reports(id), actor_id uuid not null references profiles(id), note text not null, created_at timestamptz not null default now());
create table public.ai_suggestions(id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, kind text not null check(kind in ('photo_triage','dup_match','incident_brief','voice_parse','repeat_risk','contractor_verdict')), model text not null, model_version text not null, confidence numeric not null check(confidence between 0 and 1), input_snapshot jsonb not null, output jsonb not null, input_hash text not null, decision text not null default 'pending' check(decision in ('pending','accepted','rejected','edited')), decided_by uuid references profiles(id), decided_at timestamptz, created_at timestamptz not null default now(), check((decision='pending' and decided_by is null and decided_at is null) or (decision<>'pending' and decided_by is not null and decided_at is not null)));
create index ai_cache on ai_suggestions(input_hash,created_at desc);
create table public.report_embeddings(report_id uuid primary key references reports(id), embedding extensions.vector(1536) not null, source text not null check(source in ('photo','note')), created_at timestamptz not null default now());
create index incidents_geo on incidents using gist(location);
create index reports_geo on reports using gist(location);

-- Helpers use a fixed search path and never read a client-supplied role.
create function public.my_role() returns text language sql stable security definer set search_path=public as $$select role from profiles where id=auth.uid()$$;
create function public.my_ward() returns uuid language sql stable security definer set search_path=public as $$select ward_id from profiles where id=auth.uid()$$;
create function public.can_read_incident(target uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from incidents i join road_segments s on s.id=i.road_segment_id where i.id=target and (my_role()='reviewer' or (my_role()='officer' and s.ward_id=my_ward()) or exists(select 1 from reports r where r.incident_id=i.id and r.reporter_id=auth.uid()))) $$;
create function public.can_read_report(target uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from reports r join road_segments s on s.id=r.road_segment_id where r.id=target and (r.reporter_id=auth.uid() or my_role()='reviewer' or (my_role()='officer' and s.ward_id=my_ward())))$$;
alter table wards enable row level security;
alter table profiles enable row level security;
alter table road_segments enable row level security;
alter table reports enable row level security;
alter table incidents enable row level security;
alter table repair_jobs enable row level security;
alter table status_events enable row level security;
alter table report_notes enable row level security;
alter table ai_suggestions enable row level security;
alter table report_embeddings enable row level security;
create policy wards_read on wards for select to authenticated using(true);
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or my_role()='reviewer' or (my_role()='officer' and ward_id=my_ward()));
create policy segments_read on road_segments for select to authenticated using(my_role() in ('citizen','reviewer') or ward_id=my_ward());
create policy reports_read on reports for select to authenticated using(can_read_report(id));
create policy incidents_read on incidents for select to authenticated using(can_read_incident(id));
create policy jobs_read on repair_jobs for select to authenticated using(can_read_incident(incident_id));
create policy events_read on status_events for select to authenticated using((entity_type='report' and can_read_report(entity_id)) or (entity_type='incident' and can_read_incident(entity_id)));
create policy notes_read on report_notes for select to authenticated using(can_read_report(report_id));
create policy ai_read on ai_suggestions for select to authenticated using((entity_type='report' and can_read_report(entity_id)) or (entity_type='incident' and can_read_incident(entity_id)) or (entity_type='voice' and entity_id=auth.uid()) or (entity_type='segment' and my_role()='reviewer') or (entity_type='segment' and my_role()='officer' and exists(select 1 from road_segments s where s.id=entity_id and s.ward_id=my_ward())));
create policy embeddings_read on report_embeddings for select to authenticated using(my_role() in ('officer','reviewer') and can_read_report(report_id));
-- No table write policies: mutations are transactional, role-gated RPCs invoked by Server Actions.
revoke insert, update, delete on all tables in schema public from anon,authenticated;
grant select on all tables in schema public to authenticated;

create function public.audit_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if TG_OP='INSERT' or new.status is distinct from old.status then
 insert into status_events(entity_type,entity_id,from_status,to_status,actor_id,reason) values(case when TG_TABLE_NAME='reports' then 'report' else 'incident' end,new.id,case when TG_OP='INSERT' then null else old.status end,new.status,coalesce(auth.uid(),nullif(current_setting('roadwatch.seed_actor',true),'')::uuid),coalesce(nullif(current_setting('roadwatch.reason',true),''),'Record created'));
 end if; return new;
end $$;
create trigger reports_audit after insert or update on reports for each row execute function audit_status();
create trigger incidents_audit after insert or update on incidents for each row execute function audit_status();
create function public.immutable_events() returns trigger language plpgsql as $$begin raise exception 'Status events are append-only'; end$$;
create trigger immutable_events before update or delete on status_events for each row execute function immutable_events();
create function public.closure_gate() returns trigger language plpgsql set search_path=public as $$begin
 if new.status='closed' and not exists(select 1 from repair_jobs where incident_id=new.id and after_photo_path is not null and repaired_at is not null and verified_by is not null and verified_at is not null) then raise exception 'Closure requires an after-photo and reviewer verification'; end if; return new; end$$;
create trigger closure_gate before update on incidents for each row execute function closure_gate();
create function public.previous_repair() returns trigger language plpgsql set search_path=public as $$begin
 select j.id into new.previous_repair_id from repair_jobs j join incidents i on i.id=j.incident_id where i.road_segment_id=new.road_segment_id and j.repaired_at < new.opened_at order by j.repaired_at desc limit 1; return new; end$$;
create trigger previous_repair before insert on incidents for each row execute function previous_repair();
create function public.require_officer(segment uuid) returns void language plpgsql security definer set search_path=public as $$begin
 if my_role()<>'officer' or not exists(select 1 from road_segments where id=segment and ward_id=my_ward()) then raise exception 'Officer access for this ward required'; end if; end$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('road-photos','road-photos',false,6291456,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy photos_upload on storage.objects for insert to authenticated with check(bucket_id='road-photos' and (storage.foldername(name))[1]=auth.uid()::text and my_role() in ('citizen','officer'));
create policy photos_read on storage.objects for select to authenticated using(bucket_id='road-photos' and (exists(select 1 from reports r where r.photo_path=name and can_read_report(r.id)) or exists(select 1 from repair_jobs j where j.after_photo_path=name and can_read_incident(j.incident_id))));
-- Uploaded but unattached objects cannot be signed/read. No public bucket or service-role runtime client.
