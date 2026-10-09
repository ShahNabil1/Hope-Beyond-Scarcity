DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_public_insert" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND char_length(btrim(full_name)) BETWEEN 2 AND 100
  AND char_length(btrim(email)) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(subject)) BETWEEN 2 AND 150
  AND char_length(btrim(message)) BETWEEN 10 AND 2000
);