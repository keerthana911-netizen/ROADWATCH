create function public.log_ai(target uuid, target_type text, suggestion_kind text, ai_model text, ai_version text, certainty numeric, snapshot jsonb, result jsonb, hash text) returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid;
begin
 if auth.uid() is null then raise exception 'Session required'; end if;
 if not ((target_type='report' and can_read_report(target)) or (target_type='incident' and can_read_incident(target) and my_role() in ('officer','reviewer')) or (target_type='voice' and target=auth.uid() and my_role()='citizen') or (target_type='segment' and exists(select 1 from road_segments where id=target and (my_role()='reviewer' or (my_role()='officer' and ward_id=my_ward()))))) then raise exception 'Cannot log AI for this entity'; end if;
 if suggestion_kind='photo_triage' and not(result ?& array['is_pothole','severity_estimate','sensitive_hint','reasoning']) then raise exception 'Invalid triage schema'; end if;
 insert into ai_suggestions(entity_type,entity_id,kind,model,model_version,confidence,input_snapshot,output,input_hash) values(target_type,target,suggestion_kind,ai_model,ai_version,certainty,snapshot,result,hash) returning id into sid; return sid;
end$$;
create function public.decide_ai(target uuid, choice text, edited_output jsonb default null) returns void language plpgsql security definer set search_path=public as $$
declare a ai_suggestions; road uuid;
begin
 select * into a from ai_suggestions where id=target for update;
 if not found or a.decision<>'pending' then raise exception 'Suggestion already decided or not found'; end if;
 if a.entity_type='voice' then
 if a.entity_id<>auth.uid() or my_role() is distinct from 'citizen' then raise exception 'Your voice suggestion only'; end if;
 elsif a.entity_type='report' then
 select road_segment_id into road from reports where id=a.entity_id;
 perform require_officer(road);
 elsif a.entity_type='incident' then
 select road_segment_id into road from incidents where id=a.entity_id;
 if my_role()='officer' then perform require_officer(road); elsif my_role() is distinct from 'reviewer' then raise exception 'Officer or reviewer required'; end if;
 elsif a.entity_type='segment' then
 if my_role()='officer' then perform require_officer(a.entity_id); elsif my_role() is distinct from 'reviewer' then raise exception 'Officer or reviewer required'; end if;
 else raise exception 'Unsupported entity'; end if;
 if choice not in ('accepted','rejected','edited') then raise exception 'Invalid decision'; end if;
 if choice='edited' and edited_output is null then raise exception 'Edited output required'; end if;
 update ai_suggestions set decision=choice,decided_by=auth.uid(),decided_at=now(),output=case when choice='edited' then edited_output else output end where id=target;
 -- This function deliberately writes ONLY the governance decision, never any incident fact or status.
end$$;
