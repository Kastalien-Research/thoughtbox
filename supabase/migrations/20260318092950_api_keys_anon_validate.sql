CREATE POLICY "api_keys_anon_validate" ON api_keys
  FOR SELECT TO anon
  USING (true);
