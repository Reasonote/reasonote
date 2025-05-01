-- Add this column to the configuration for the rsn_vec
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('snip', 'text_content', NULL);
INSERT INTO public.rsn_vec_config (tablename, colname, colpath) VALUES ('snip', '_name', NULL);

INSERT INTO public.rsncore_table_abbreviations (tablename, abbreviation) VALUES ('snip', 'snip');

-- Add the hook to the table
CREATE TRIGGER snip__tgr_rsn_vec_queue_insert_update AFTER INSERT OR UPDATE ON public.snip FOR EACH ROW EXECUTE FUNCTION public.tgr_rsn_vec_queue_insert_update();