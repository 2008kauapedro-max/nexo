-- Serialize the report allowance across concurrent HTTP requests, including direct RPCs.
create or replace function public.report_question(p_question uuid,p_reason text,p_detail text)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_question is null or p_reason is null or p_reason not in ('Resposta incorreta','Enunciado incorreto','Imagem quebrada','Questão duplicada','Explicação ruim','Outro')
    or p_detail is null or length(p_detail)>1000 then raise exception 'INVALID_INPUT'; end if;
 perform 1 from public.profiles where id=uid for update;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(select 1 from public.questions where id=p_question and status='published') then raise exception 'NOT_FOUND'; end if;
 -- Replays remain successful even at the allowance, without modifying the original report.
 if exists(select 1 from public.question_reports where user_id=uid and question_id=p_question) then return; end if;
 if (select count(*) from public.question_reports where user_id=uid and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT'; end if;
 insert into public.question_reports(user_id,question_id,reason,detail) values(uid,p_question,p_reason,p_detail);
end $$;


revoke all on function public.report_question(uuid,text,text) from public,anon;
grant execute on function public.report_question(uuid,text,text) to authenticated;

