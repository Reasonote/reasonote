-- Add new columns to rsn_page table
ALTER TABLE public.rsn_page
ADD COLUMN original_filename TEXT,
ADD COLUMN storage_path TEXT,
ADD COLUMN file_type TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.rsn_page.original_filename IS 'The original filename of the uploaded file';
COMMENT ON COLUMN public.rsn_page.storage_path IS 'The storage path of the file in the attachment-uploads bucket';
COMMENT ON COLUMN public.rsn_page.file_type IS 'The MIME type of the uploaded file';


-- Make sure the storage bucket exists
INSERT INTO storage.buckets (id, name)
VALUES ('attachment-uploads', 'attachment-uploads')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the new bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachment-uploads');

CREATE POLICY "Allow authenticated users to read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachment-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
