create function public.admin_questions_page(p_search text default '',p_page integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare needle text:=lower(trim(coalesce(p_search,''))); total bigint; rows jsonb;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'FORBIDDEN'; end if;
 if length(needle)>256 or p_page is null or p_page<0 or p_page>100000 then raise exception 'INVALID_INPUT'; end if;
 select count(*) into total from public.questions q where needle='' or position(needle in lower(q.statement))>0;
 select coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object('answer',a.answer,'explanation',a.explanation) order by q.updated_at desc,q.id),'[]'::jsonb) into rows
 from (select id,statement,subject_id,topic_id,difficulty,status,options,updated_at from public.questions
       where needle='' or position(needle in lower(statement))>0 order by updated_at desc,id limit 10 offset p_page*10) q
 join private.question_answers a on a.question_id=q.id;
 return jsonb_build_object('rows',rows,'total',total);
end $$;
revoke all on function public.admin_questions_page(text,integer) from public,anon;
grant execute on function public.admin_questions_page(text,integer) to authenticated;

alter table public.questions
 add column locale text not null default 'pt-BR',
 add column source_language text not null default 'pt-BR',
 add column translation_of uuid references public.questions(id),
 add column translation_status text not null default 'original' check(translation_status in ('original','draft','validated','reviewed')),
 add column translation_source text,
 add column review_status text not null default 'pending' check(review_status in ('pending','approved','rejected'));
create index questions_translation_of_idx on public.questions(translation_of);
update public.questions set review_status='approved' where status='published';
alter table public.questions add constraint reviewed_translation_publication check(
 translation_status='original' and translation_of is null
 or translation_status<>'original' and translation_of is not null and translation_of<>id
 and (status<>'published' or (translation_status='reviewed' and review_status='approved' and nullif(trim(translation_source),'') is not null))
);
alter table public.questions add constraint question_locale_supported check(locale in ('pt-BR','en-US','es','fr','de','it','ja','ko','zh-CN','ru'));
comment on column public.questions.translation_of is 'Translation provenance. A translation is not the original official question. Source and exam attribution must remain attached to the original.';
