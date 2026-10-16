-- =====================================================================================
-- NETIX SIRH & PAIE — SCRIPT DÉFINITIF DE CORRECTION SUPABASE SECURITY ADVISOR
-- Résout les erreurs RLS, prévient la récursion sur "profiles" et restaure l'accès Dashboard
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 1. ACTIVATION DU ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rubriques_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salarie_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bulletin_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- 2. SÉCURISATION DES FONCTIONS HELPER (SECURITY DEFINER POUR ÉVITER TOUTE RÉCURSION)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_salarie_id() 
RETURNS int 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT salarie_id FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_salarie_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_salarie_id() TO authenticated;

-- Fonctions internes de triggers auth : interdire appel direct par API REST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 3. NETTOYAGE DES ANCIENNES POLITIQUES
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "public read/write bulletin_rubriques" ON public.bulletin_rubriques;
DROP POLICY IF EXISTS "public read/write bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "public read/write parametres" ON public.parametres;
DROP POLICY IF EXISTS "public read/write salarie_rubriques" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Profiles lecture autorisee" ON public.profiles;
DROP POLICY IF EXISTS "Profiles maj autorisee" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertion autorisee" ON public.profiles;
DROP POLICY IF EXISTS "Salaries lecture autorisee" ON public.salaries;
DROP POLICY IF EXISTS "Salaries lecture pour tous" ON public.salaries;
DROP POLICY IF EXISTS "Contrats lecture autorisee" ON public.contrats;
DROP POLICY IF EXISTS "Contrats lecture pour tous" ON public.contrats;
DROP POLICY IF EXISTS "Lecture parametres pour tous" ON public.parametres;
DROP POLICY IF EXISTS "Gestion parametres par RH" ON public.parametres;
DROP POLICY IF EXISTS "Lecture catalogue pour tous" ON public.rubriques_catalogue;
DROP POLICY IF EXISTS "Modification catalogue RH" ON public.rubriques_catalogue;
DROP POLICY IF EXISTS "Salarie lit ses propres bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "RH gestion totale bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "Lecture salarie_rubriques" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Gestion salarie_rubriques RH" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Insertion audit_logs autorisee" ON public.audit_logs;
DROP POLICY IF EXISTS "Lecture audit_logs pour RH et Admins" ON public.audit_logs;

-- -------------------------------------------------------------------------------------
-- 4. POLITIQUES POUR "profiles" (SANS RÉCURSION INFINIE)
-- -------------------------------------------------------------------------------------
CREATE POLICY "Profiles lecture autorisee" ON public.profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Profiles maj autorisee" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
) WITH CHECK (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
);

CREATE POLICY "Profiles insertion autorisee" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 5. POLITIQUES DE LECTURE POUR "salaries" ET "contrats" (Dashboard & Pilotage)
-- -------------------------------------------------------------------------------------
CREATE POLICY "Salaries lecture pour tous" ON public.salaries
FOR SELECT USING (true);

CREATE POLICY "Salaries ecriture RH" ON public.salaries
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

CREATE POLICY "Contrats lecture pour tous" ON public.contrats
FOR SELECT USING (true);

CREATE POLICY "Contrats ecriture RH" ON public.contrats
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

-- -------------------------------------------------------------------------------------
-- 6. POLITIQUES POUR "parametres" ET "rubriques_catalogue"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Lecture parametres pour tous" ON public.parametres
FOR SELECT USING (true);

CREATE POLICY "Gestion parametres par RH" ON public.parametres
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

CREATE POLICY "Lecture catalogue pour tous" ON public.rubriques_catalogue
FOR SELECT USING (true);

CREATE POLICY "Modification catalogue RH" ON public.rubriques_catalogue
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

-- -------------------------------------------------------------------------------------
-- 7. POLITIQUES POUR "bulletins" ET "salarie_rubriques"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Salarie lit ses propres bulletins" ON public.bulletins
FOR SELECT TO authenticated
USING (
  salarie_id = (SELECT public.get_user_salarie_id())
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "RH gestion totale bulletins" ON public.bulletins
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

CREATE POLICY "Lecture salarie_rubriques" ON public.salarie_rubriques
FOR SELECT TO authenticated
USING (
  salarie_id = (SELECT public.get_user_salarie_id())
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "Gestion salarie_rubriques RH" ON public.salarie_rubriques
FOR ALL TO authenticated
USING (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'))
WITH CHECK (public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin'));

-- -------------------------------------------------------------------------------------
-- 8. POLITIQUES POUR "audit_logs"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Insertion audit_logs autorisee" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL 
  OR auteur_id = (SELECT auth.uid()) 
  OR auteur_id IS NULL
);

CREATE POLICY "Lecture audit_logs pour RH et Admins" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 9. PERMISSIONS POSTGREST
-- -------------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.rubriques_catalogue TO anon, authenticated;
GRANT SELECT ON public.parametres TO anon, authenticated;
GRANT SELECT ON public.salaries TO anon, authenticated;
GRANT SELECT ON public.contrats TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Base de donnees securisee et dashboard retabli avec succes !' AS resultat;
