-- Zelf profiel vastleggen na login (role 'user'). Admin blijft handmatig / via beheer-SQL.
-- Vereist voor ensureMyProfileRow() zonder service role.

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'user');

COMMENT ON POLICY profiles_insert_self ON public.profiles IS
  'Ingelogde gebruiker mag eigen profielrij aanmaken als die nog ontbreekt (default role user).';
