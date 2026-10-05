create index questions_topic_subject_fk_idx on public.questions(topic_id,subject_id);
create index questions_subtopic_topic_fk_idx on public.questions(subtopic_id,topic_id);
