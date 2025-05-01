-- INSERT INTO rsn_private.oplog_webhooks (webhook_name, webhook_url, webhook_format, tables, all_tables)
-- VALUES ('test', 'https://discord.com/api/webhooks/1186708780247957565/l3TTnoAy5MOUf8rzmPQKdEnlU3eWfrYCoxan63BelwVALWBkEJOSH4_GRWa_W2ueRTe9', 'discord', null, true);

-- Delete that entry
DELETE FROM rsn_private.oplog_webhooks WHERE webhook_name = 'test' AND webhook_url = 'https://discord.com/api/webhooks/1186708780247957565/l3TTnoAy5MOUf8rzmPQKdEnlU3eWfrYCoxan63BelwVALWBkEJOSH4_GRWa_W2ueRTe9';