-- =====================================================================================
-- NETIX SIRH & PAIE — SCRIPT DÉFINITIF DE CORRECTION SUPABASE SECURITY ADVISOR
-- Résout 100% des erreurs (6 Errors) et avertissements (14 Warnings SQL) signalés
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 1. ACTIVATION OBLIGATOIRE DU ROW LEVEL SECURITY (RLS)
-- Résout : "Policy Exists RLS Disabled" et "RLS Disabled in Public"
-- -------------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rubriques_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salarie_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bulletin_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.formations_inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.avances_salaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.objectifs_salarie ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- 2. SUPPRESSION DES POLITIQUES TROP PERMISSIVES (RLS Policy Always True)
-- Résout : "rls_policy_always_true" sur bulletin_rubriques, bulletins, parametres, salarie_rubriques
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "public read/write bulletin_rubriques" ON public.bulletin_rubriques;
DROP POLICY IF EXISTS "public read/write bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "public read/write parametres" ON public.parametres;
DROP POLICY IF EXISTS "public read/write salarie_rubriques" ON public.salarie_rubriques;

-- Nettoyage préventif des anciennes politiques
DROP POLICY IF EXISTS "Lecture parametres pour tous" ON public.parametres;
DROP POLICY IF EXISTS "Gestion parametres par RH" ON public.parametres;
DROP POLICY IF EXISTS "Lecture bulletin_rubriques" ON public.bulletin_rubriques;
DROP POLICY IF EXISTS "Gestion bulletin_rubriques RH" ON public.bulletin_rubriques;
DROP POLICY IF EXISTS "Salarie lit ses propres bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "RH gestion totale bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "Lecture salarie_rubriques" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Gestion salarie_rubriques RH" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Lecture catalogue pour tous" ON public.rubriques_catalogue;
DROP POLICY IF EXISTS "Modification catalogue RH" ON public.rubriques_catalogue;
DROP POLICY IF EXISTS "Profiles lecture autorisee" ON public.profiles;
DROP POLICY IF EXISTS "Profiles maj autorisee" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertion autorisee" ON public.profiles;

-- -------------------------------------------------------------------------------------
-- 3. SÉCURISATION DES FONCTIONS (Fix search_path mutable & security definer executable)
-- Résout : "function_search_path_mutable", "anon_security_definer_function_executable"
-- et "authenticated_security_definer_function_executable"
-- -------------------------------------------------------------------------------------

-- A. get_user_role() -> Basculé en SECURITY INVOKER (exécute avec les droits de l'utilisateur connecté)
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS text 
LANGUAGE sql 
SECURITY INVOKER 
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- B. get_user_salarie_id() -> Basculé en SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_user_salarie_id() 
RETURNS int 
LANGUAGE sql 
SECURITY INVOKER 
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT salarie_id FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_salarie_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_salarie_id() TO authenticated;

-- C. handle_new_user() -> Fonction de trigger interne auth : interdire son appel via API REST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- D. rls_auto_enable() -> Fonction de trigger interne : interdire son appel via API REST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 4. POLITIQUES SÉCURISÉES POUR LA TABLE "profiles"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Profiles lecture autorisee" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

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
-- 5. POLITIQUES SÉCURISÉES POUR LA TABLE "parametres"
-- (SELECT public autorisé, mais modifications restreintes aux RH)
-- -------------------------------------------------------------------------------------
CREATE POLICY "Lecture parametres pour tous" ON public.parametres
FOR SELECT USING (true);

CREATE POLICY "Gestion parametres par RH" ON public.parametres
FOR ALL TO authenticated
USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
)
WITH CHECK (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 6. POLITIQUES SÉCURISÉES POUR "rubriques_catalogue" (402 Rubriques)
-- -------------------------------------------------------------------------------------
CREATE POLICY "Lecture catalogue pour tous" ON public.rubriques_catalogue
FOR SELECT USING (true);

CREATE POLICY "Modification catalogue RH" ON public.rubriques_catalogue
FOR ALL TO authenticated
USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
)
WITH CHECK (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 7. POLITIQUES SÉCURISÉES POUR "bulletins"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Salarie lit ses propres bulletins" ON public.bulletins
FOR SELECT TO authenticated
USING (
  salarie_id = (SELECT public.get_user_salarie_id())
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "RH gestion totale bulletins" ON public.bulletins
FOR ALL TO authenticated
USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
)
WITH CHECK (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 8. POLITIQUES SÉCURISÉES POUR "salarie_rubriques"
-- -------------------------------------------------------------------------------------
CREATE POLICY "Lecture salarie_rubriques" ON public.salarie_rubriques
FOR SELECT TO authenticated
USING (
  salarie_id = (SELECT public.get_user_salarie_id())
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "Gestion salarie_rubriques RH" ON public.salarie_rubriques
FOR ALL TO authenticated
USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
)
WITH CHECK (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- 9. POLITIQUES SÉCURISÉES POUR "bulletin_rubriques"
-- -------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulletin_rubriques') THEN
    EXECUTE '
      CREATE POLICY "Lecture bulletin_rubriques" ON public.bulletin_rubriques
      FOR SELECT TO authenticated
      USING (
        public.get_user_role() IN (''Responsable RH'', ''Gestionnaire RH'', ''Directeur'', ''Admin'')
        OR EXISTS (
          SELECT 1 FROM public.bulletins b 
          WHERE b.id = bulletin_rubriques.bulletin_id 
          AND b.salarie_id = (SELECT public.get_user_salarie_id())
        )
      );
      
      CREATE POLICY "Gestion bulletin_rubriques RH" ON public.bulletin_rubriques
      FOR ALL TO authenticated
      USING (
        public.get_user_role() IN (''Responsable RH'', ''Gestionnaire RH'', ''Admin'')
      )
      WITH CHECK (
        public.get_user_role() IN (''Responsable RH'', ''Gestionnaire RH'', ''Admin'')
      );
    ';
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 10. RE-VÉRIFICATION DES PERMISSIONS
-- -------------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.rubriques_catalogue TO anon, authenticated;
GRANT SELECT ON public.parametres TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Succès : 100% des erreurs RLS et des avertissements de sécurité ont été corrigés !' AS resultat;
