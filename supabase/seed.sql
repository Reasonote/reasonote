
INSERT INTO public.rsn_user_sysdata (auth_id, extra_license_info, has_onboarded) VALUES (
    '01010101-0101-0101-0101-010134501073',
    '{"Reasonote-Admin": true}'::jsonb,
    true
) ON CONFLICT DO NOTHING;


-- Generic User settings
INSERT INTO public.user_setting (id, rsn_user, metadata, ai_about_me, ai_instructions, created_date, updated_date, created_by, updated_by, feelings) VALUES ('usrset_8d4608f7-f09f-4f1b-9dee-5b1a31c36c71', 'rsnusr_01010101-0101-0101-0101-010134501073', NULL, NULL, NULL, '2024-03-01 00:34:54.385885+00', '2024-03-24 00:14:39.750343+00', 'rsnusr_01010101-0101-0101-0101-010134501073', 'rsnusr_01010101-0101-0101-0101-010134501073', '[{"id": "feeling_4ae663c2-f9aa-48bc-87e3-0fc26b1c2c52", "feeling": "like", "subject_name": "LOTR (Original Trilogy)", "subject_type": "movie"}, {"id": "feeling_645585c9-135e-45d4-9d05-60012eaf686b", "feeling": "like", "subject_name": "Discworld", "subject_type": "book"}]');


-- INSERT INTO public.snip (id, _name, _type, source_url, text_content, metadata, _owner, created_date, updated_date, created_by, updated_by, extraction_state, extraction_info, extraction_error, page_id) VALUES ('snip_3789a9e1-7b47-4545-a3a3-aa611bba1972', 'Snip on 2024-03-25 19:28:34.791394+00', 'url', 'https://stackoverflow.com/questions/63812903/how-to-give-typography-like-style-to-an-input-element-with-material-ui', NULL, NULL, NULL, '2024-03-25 19:28:34.791394+00', '2024-03-25 19:28:34.791394+00', NULL, NULL, 'pending', NULL, NULL, NULL);