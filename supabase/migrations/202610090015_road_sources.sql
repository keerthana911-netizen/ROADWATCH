-- Optional real-road catalogue import preserves source provenance and existing ticket history.
alter table public.road_segments add column source text not null default 'manual';
alter table public.road_segments add column osm_way_id bigint unique;
alter table public.road_segments add column source_url text;
alter table public.road_segments add column source_snapshot_at timestamptz;
alter table public.road_segments add constraint road_source_provenance check(source<>'openstreetmap' or (osm_way_id is not null and source_url is not null and source_snapshot_at is not null));
-- RLS and the no-direct-write privilege policy already apply to these columns.
