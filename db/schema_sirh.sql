-- Script d'initialisation de la base de données pour Netix SIRH (6 nouveaux modules complémentaires)
-- À copier et exécuter dans l'éditeur de requêtes SQL (SQL Editor) de votre tableau de bord Supabase.

-- ==================================================================
-- MODULE 1 : CONTRATS & DOSSIERS COLLABORATEURS
-- ==================================================================

-- Table des contrats des salariés
CREATE TABLE IF NOT EXISTS contrats (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    type_contrat VARCHAR(50) NOT NULL, -- 'CDI', 'CDD', 'CTA' (Aide à l'insertion), etc.
    date_debut DATE NOT NULL,
    date_fin DATE,
    periode_essai_mois INT DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'En cours', -- 'En cours', 'Terminé', 'Période d''essai'
    salaire_base_contrat NUMERIC(15, 2) NOT NULL,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des documents personnels téléversés (CNI, Diplômes, Contrat signé...)
CREATE TABLE IF NOT EXISTS documents_salaries (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    nom_document VARCHAR(255) NOT NULL,
    categorie VARCHAR(100) NOT NULL, -- 'Identité', 'Diplôme', 'Contrat', 'Autre'
    fichier_url TEXT NOT NULL,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 2 : ABSENCES & CONGÉS
-- ==================================================================

-- Table des congés et absences
CREATE TABLE IF NOT EXISTS conges (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    type_conge VARCHAR(100) NOT NULL, -- 'Annuel', 'Maladie', 'Maternité', 'Sans solde'
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    jours_ouvrables INT NOT NULL,
    statut VARCHAR(50) DEFAULT 'En attente', -- 'En attente', 'Approuvé', 'Rejeté'
    motif TEXT,
    justificatif_url TEXT,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 3 : MISSIONS & DÉPLACEMENTS
-- ==================================================================

-- Table des ordres de missions professionnelles
CREATE TABLE IF NOT EXISTS missions (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    objet VARCHAR(255) NOT NULL, -- 'Visite technique', 'Réunion clients', etc.
    destination VARCHAR(255) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    moyen_transport VARCHAR(100) NOT NULL, -- 'Véhicule de service', 'Avion', etc.
    statut VARCHAR(50) DEFAULT 'En attente', -- 'En attente', 'Approuvée', 'Terminée'
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 4 : HISTORIQUE DE CARRIÈRE & DISCIPLINE
-- ==================================================================

-- Table des promotions et changements de poste
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    ancien_poste VARCHAR(255),
    nouveau_poste VARCHAR(255) NOT NULL,
    ancienne_categorie VARCHAR(100),
    nouvelle_categorie VARCHAR(100),
    date_effet DATE NOT NULL,
    salaire_base_nouveau NUMERIC(15, 2) NOT NULL,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sanctions disciplinaires
CREATE TABLE IF NOT EXISTS sanctions (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    type_sanction VARCHAR(100) NOT NULL, -- 'Avertissement', 'Blâme', 'Mise à pied', 'Licenciement'
    motif TEXT NOT NULL,
    date_sanction DATE NOT NULL,
    duree_mise_a_pied INT, -- en jours
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 5 : FORMATIONS & ÉVALUATIONS
-- ==================================================================

-- Table du catalogue des formations
CREATE TABLE IF NOT EXISTS formations (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    organisme VARCHAR(255) NOT NULL,
    duree_jours INT NOT NULL,
    prix_da NUMERIC(15, 2) DEFAULT 0
);

-- Table des inscriptions des salariés aux formations
CREATE TABLE IF NOT EXISTS formations_inscriptions (
    id SERIAL PRIMARY KEY,
    formation_id INT REFERENCES formations(id) ON DELETE CASCADE,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    statut VARCHAR(50) DEFAULT 'Prévue', -- 'Prévue', 'En cours', 'Terminée', 'Annulée'
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 6 : AVANCES SUR SALAIRE (Demande ESS & Déduction Paie)
-- ==================================================================

-- Table des demandes d'avances sur salaire
CREATE TABLE IF NOT EXISTS avances_salaire (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    montant NUMERIC(15, 2) NOT NULL,
    mois INT NOT NULL,
    annee INT NOT NULL,
    statut VARCHAR(50) DEFAULT 'En attente', -- 'En attente', 'Approuvée', 'Rejetée'
    motif TEXT,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- MODULE 7 : OBJECTIFS & EVALUATION DE PERFORMANCE
-- ==================================================================

-- Table des objectifs annuels (KPIs)
CREATE TABLE IF NOT EXISTS objectifs_salarie (
    id SERIAL PRIMARY KEY,
    salarie_id INT REFERENCES salaries(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    poids INT DEFAULT 1,
    cible VARCHAR(100),
    realise VARCHAR(100),
    taux_reussite INT DEFAULT 0, -- 0 à 100%
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
