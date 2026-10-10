create function public.store_embedding(target uuid, values_vector extensions.vector(1536), embedding_source text) returns void language plpgsql security definer set search_path=public as $$begin
 if not can_read_report(target) or my_role() not in ('citizen','officer') then raise exception 'Report access required'; end if;
 insert into report_embeddings(report_id,embedding,source) values(target,values_vector,embedding_source) on conflict(report_id) do update set embedding=excluded.embedding,source=excluded.source;
end$$;
create function public.duplicate_candidates(target uuid) returns table(candidate_id uuid,similarity double precision,distance_m double precision,days_apart double precision,ticket_id text) language plpgsql security definer set search_path=public,extensions as $$begin
 if my_role() is distinct from 'officer' or not can_read_report(target) then raise exception 'Ward officer required'; end if;
 return query select distinct on(i.id) i.id,1-(e.embedding <=> query.embedding),st_distance(r.location,origin.location),abs(extract(epoch from (r.created_at-origin.created_at)))::double precision/86400,r.ticket_id
 from report_embeddings query join reports origin on origin.id=query.report_id join report_embeddings e on e.report_id<>query.report_id join reports r on r.id=e.report_id join incidents i on i.id=r.incident_id join road_segments s on s.id=i.road_segment_id
 where query.report_id=target and i.status in ('open','assigned') and s.ward_id=my_ward() and 1-(e.embedding <=> query.embedding)>.82 order by i.id,(e.embedding <=> query.embedding) limit 5;
end$$;
create function public.confirm_duplicate(suggestion uuid,merge_it boolean,explanation text) returns uuid language plpgsql security definer set search_path=public as $$declare a ai_suggestions; result uuid; begin
 select * into a from ai_suggestions where id=suggestion for update;
 if not found or a.kind<>'dup_match' or a.entity_type<>'report' then raise exception 'Duplicate suggestion required'; end if;
 perform decide_ai(suggestion,case when merge_it then 'accepted' else 'rejected' end,null);
 if merge_it then result:=group_report(a.entity_id,(a.output->>'candidate_id')::uuid,explanation); end if;
 return result;
end$$;
