
-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
-- has_role still needs to be callable from RLS policies which run as authenticated
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Tighten storage bucket listing: only allow SELECT on objects you own (folder = your uid)
DROP POLICY IF EXISTS "Feature images publicly viewable" ON storage.objects;

CREATE POLICY "Users can view own feature images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'feature-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
-- Public read of the file content still works via direct public URL since bucket is public.
