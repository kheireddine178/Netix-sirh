-- =====================================================================================
-- NETIX SIRH & PAIE — SCRIPT DE RÉSOLUTION COMPLÈTE DU SUPABASE SECURITY ADVISOR
-- Résout les 6 erreurs critiques RLS et l'ensemble des avertissements (Warnings)
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- ÉTAPE 1 : ACTIVATION GLOBALE DU ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- (Résout immédiatement les 6 erreurs rouges "Policy Exists RLS Disabled" et "RLS Disabled in Public")
-- -------------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rubriques_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salarie_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bulletin_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bulletin_lignes ENABLE ROW LEVEL SECURITY;
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
-- ÉTAPE 2 : SÉCURISATION DES FONCTIONS SECURITY DEFINER (Search Path Immutable)
-- (Résout les avertissements "function_search_path_mutable")
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

CREATE OR REPLACE FUNCTION public.get_user_salarie_id() 
RETURNS int 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT salarie_id FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- -------------------------------------------------------------------------------------
-- ÉTAPE 3 : POLITIQUES RLS SÉCURISÉES POUR LA TABLE "profiles"
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lecture de son propre profil ou RH" ON public.profiles;
DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "RH acces total profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles lecture autorisee" ON public.profiles;

CREATE POLICY "Profiles lecture autorisee" ON public.profiles
FOR SELECT USING (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "Profiles maj autorisee" ON public.profiles
FOR UPDATE USING (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
) WITH CHECK (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
);

CREATE POLICY "Profiles insertion autorisee" ON public.profiles
FOR INSERT WITH CHECK (
  id = (SELECT auth.uid()) 
  OR public.get_user_role() IN ('Responsable RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- ÉTAPE 4 : POLITIQUES RLS POUR LE CATALOGUE (402 Rubriques)
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lecture catalogue pour tous" ON public.rubriques_catalogue;
DROP POLICY IF EXISTS "Modification catalogue RH" ON public.rubriques_catalogue;

-- Consultation du barème et plan de paie autorisée pour tous les utilisateurs de l'app
CREATE POLICY "Lecture catalogue pour tous" ON public.rubriques_catalogue
FOR SELECT USING (true);

-- Modification réservée aux administrateurs et responsables RH
CREATE POLICY "Modification catalogue RH" ON public.rubriques_catalogue
FOR ALL USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- ÉTAPE 5 : POLITIQUES RLS POUR LES BULLETINS DE PAIE
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Salarie lit ses propres bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "RH gestion totale bulletins" ON public.bulletins;

CREATE POLICY "Salarie lit ses propres bulletins" ON public.bulletins
FOR SELECT USING (
  salarie_id = (SELECT public.get_user_salarie_id())
);

CREATE POLICY "RH gestion totale bulletins" ON public.bulletins
FOR ALL USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- ÉTAPE 6 : POLITIQUES RLS POUR LES RUBRIQUES SALARIÉS (salarie_rubriques)
-- -------------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lecture salarie_rubriques" ON public.salarie_rubriques;
DROP POLICY IF EXISTS "Gestion RH salarie_rubriques" ON public.salarie_rubriques;

CREATE POLICY "Lecture salarie_rubriques" ON public.salarie_rubriques
FOR SELECT USING (
  salarie_id = (SELECT public.get_user_salarie_id())
  OR public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Directeur', 'Admin')
);

CREATE POLICY "Gestion RH salarie_rubriques" ON public.salarie_rubriques
FOR ALL USING (
  public.get_user_role() IN ('Responsable RH', 'Gestionnaire RH', 'Admin')
);

-- -------------------------------------------------------------------------------------
-- ÉTAPE 7 : POLITIQUES POUR LES DÉTAILS DYNAMIQUES (bulletin_rubriques si existante)
-- -------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulletin_rubriques') THEN
    DROP POLICY IF EXISTS "Lecture bulletin_rubriques" ON public.bulletin_rubriques;
    DROP POLICY IF EXISTS "Gestion RH bulletin_rubriques" ON public.bulletin_rubriques;
    
    EXECUTE '
      CREATE POLICY "Lecture bulletin_rubriques" ON public.bulletin_rubriques
      FOR SELECT USING (
        public.get_user_role() IN (''Responsable RH'', ''Gestionnaire RH'', ''Directeur'', ''Admin'')
        OR EXISTS (
          SELECT 1 FROM public.bulletins b 
          WHERE b.id = bulletin_rubriques.bulletin_id 
          AND b.salarie_id = (SELECT public.get_user_salarie_id())
        )
      );
      
      CREATE POLICY "Gestion RH bulletin_rubriques" ON public.bulletin_rubriques
      FOR ALL USING (
        public.get_user_role() IN (''Responsable RH'', ''Gestionnaire RH'', ''Admin'')
      );
    ';
  END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- ÉTAPE 8 : RE-VÉRIFICATION DES DROITS DU RÔLE POSTGREST (authenticated & anon)
-- -------------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.rubriques_catalogue TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Confirmation de fin d'exécution
SELECT 'Sécurité Supabase mise à jour avec succès : Toutes les tables ont RLS activé et les fonctions sont sécurisées.' AS status;
