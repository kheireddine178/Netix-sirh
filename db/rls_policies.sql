-- ==================================================================
-- SÉCURITÉ : ROW LEVEL SECURITY (RLS) POUR TOUTES LES TABLES
-- ==================================================================

-- 1. Activation globale du RLS
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conges ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations_inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avances_salaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs_salarie ENABLE ROW LEVEL SECURITY;

-- 2. Création de fonctions de sécurité pour récupérer le profil
CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_salarie_id() RETURNS int AS $$
  SELECT salarie_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- ==================================================================
-- NETTOYAGE EXHAUSTIF (Supprime TOUTES les anciennes politiques)
-- ==================================================================
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('salaries', 'contrats', 'documents_salaries', 'conges', 'missions', 'promotions', 'sanctions', 'formations', 'formations_inscriptions', 'avances_salaire', 'objectifs_salarie')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;


-- 3. Politiques pour la table "salaries"
CREATE POLICY "Salarie lit son profil" ON salaries
FOR SELECT USING (id = get_user_salarie_id());

CREATE POLICY "RH accès total" ON salaries
FOR ALL USING (get_user_role() IN ('Responsable RH', 'Gestionnaire RH'));

CREATE POLICY "Direction lecture seule" ON salaries
FOR SELECT USING (get_user_role() = 'Directeur');


-- 4. Politiques dynamiques pour toutes les tables ayant "salarie_id"
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'contrats', 'documents_salaries', 'conges', 'missions', 
        'promotions', 'sanctions', 'formations_inscriptions', 
        'avances_salaire', 'objectifs_salarie'
    ])
    LOOP
        -- Création
        EXECUTE format('
            CREATE POLICY "Salarie lit ses propres donnees" ON %I
            FOR SELECT USING (salarie_id = get_user_salarie_id());
            
            CREATE POLICY "Salarie insere ses propres donnees" ON %I
            FOR INSERT WITH CHECK (salarie_id = get_user_salarie_id());

            CREATE POLICY "RH accès total" ON %I
            FOR ALL USING (get_user_role() IN (''Responsable RH'', ''Gestionnaire RH''));

            CREATE POLICY "Direction lecture seule" ON %I
            FOR SELECT USING (get_user_role() = ''Directeur'');
        ', t, t, t, t);
    END LOOP;
END $$;

-- 5. Politique pour le catalogue des formations (sans salarie_id)
DROP POLICY IF EXISTS "Formations lecture pour tous" ON formations;
DROP POLICY IF EXISTS "Formations modif pour RH" ON formations;

CREATE POLICY "Formations lecture pour tous" ON formations
FOR SELECT USING (TRUE);

CREATE POLICY "Formations modif pour RH" ON formations
FOR ALL USING (get_user_role() IN ('Responsable RH', 'Gestionnaire RH'));
