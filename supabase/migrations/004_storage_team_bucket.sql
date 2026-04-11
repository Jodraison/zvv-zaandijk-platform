-- Public bucket for club team photo (homepage). Uploads use service role on the server.
-- After applying: no manual file steps in the dashboard if you use the platform upload.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team',
  'team',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read team bucket" ON storage.objects;
CREATE POLICY "Public read team bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'team');
