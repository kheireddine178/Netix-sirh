# 📄 BRIEFING PRODUCT DESIGN — NETIX SIRH 2.0
> **Document de Cadrage Complet à destination de Gemini 4 Argon (Lead Product Designer & Architect)**

---

## 🎯 MISSION CONFÉRÉE À L'IA (GEMINI 4 ARGON)

Tu agis ici en tant que **Chief Product Officer (CPO) & Head of Product Design d'élite** (avec l'exigence esthétique et fonctionnelle de produits comme *Ramp*, *Mercury*, *Stripe* et *Linear*).

Ton objectif est de concevoir **la vision intégrale de A à Z** de **Netix SIRH 2.0** :
1. Définir une **Architecture d'Information (IA)** claire, moderne et sans friction pour un SIRH complet.
2. Concevoir un **Modèle d'Interaction de rupture** pour le traitement de la paie mensuelle de 200 collaborateurs (remplacement de l'ancien outil *DLG PC PAIE*).
3. Poser les fondations d'un **Design System Fintech Haut de Gamme** (Direction artistique, typographie, palette, hiérarchie visuelle, densité de données).
4. Établir une **Feuille de Route Produit (Roadmap)** détaillée jalon par jalon pour guider l'équipe de développement.

---

## 🏢 1. LE CONTEXTE & L'UTILISATEUR CIBLE (PERSONA)

- **L'Utilisateur Clé** : Chef de Service RH & Paie dans une entreprise en Algérie.
- **Périmètre** : Gestion directe de **200 collaborateurs** (ouvriers, agents de maîtrise, cadres, contrats CDI, CDD, CTA).
- **L'Outil Actuel (Le Némésis)** : **DLG PC PAIE** (logiciel algérien des années 1990 sous Windows XP/7).
  - *Frustrations majeures* : Interface grise austère, 400 codes de rubriques cryptiques à taper de mémoire (ex: R100, R280, R522), navigation 100% manuelle, boîtes de dialogue bloquantes, impressions matricielles lentes, et zéro tableau de bord analytique pour la direction générale.
- **L'Objectif Netix** : Permettre au responsable RH de boucler sa paie mensuelle avec la **vitesse d'un tableur moderne (Spreadsheet 2026)**, la beauté feutrée d'une **Fintech suisse/américaine (Ramp/Mercury)**, et la sécurité juridique absolue de la législation algérienne.

---

## 🌐 2. ÉCOSYSTÈME TECHNIQUE & LIENS DE PRODUCTION

| Composant | Lien / Référence | Détails techniques |
| :--- | :--- | :--- |
| **Dépôt GitHub** | [https://github.com/kheireddine178/Netix-sirh](https://github.com/kheireddine178/Netix-sirh) | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Site en Ligne (Vercel)** | [https://netix-paie.vercel.app](https://netix-paie.vercel.app) | Hébergé et déployé automatiquement en production |
| **Base de Données (Supabase)** | PostgreSQL 15 + RLS + Auth | 11 tables relationnelles opérationnelles |
| **Moteur de Paie Certifié** | `lib/paieCalcul.ts` | 10 profils types Golden validés à 100% avec 0,00 DA d'écart |
| **Générateur PDF** | `@react-pdf/renderer` | Standard légal JORADP (Bulletins, attestations, ordres de mission) |

---

## 🗄️ 3. ARCHITECTURE DE LA BASE DE DONNÉES (SUPABASE POSTGRESQL)

La base Supabase actuelle comprend déjà **11 tables relationnelles complètes** :

### Table 1 : `salaries` (Référentiel Collaborateurs)
- `id` (int PK) : Identifiant unique.
- `nom_prenom` (varchar) : Nom et prénom complets.
- `matricule` (varchar unique) : Code interne (ex: M001, M002...).
- `fonction` (varchar) : Intitulé du poste.
- `type_contrat` (varchar) : CDI, CDD, CTA, etc.
- `salaire_base_theorique` (numeric) : Salaire de base conventionnel mensuel en DA.
- `date_embauche` (date) : Prise de fonction.
- `num_ss` (varchar) : Numéro d'immatriculation Sécurité Sociale (CNAS).
- `ccp_rib` (varchar) : Compte postal/bancaire pour le virement.
- `mode_paiement` (varchar) : Virement, Chèque, Espèces.
- `situation_familiale` (varchar) : Célibataire, Marié(e), Divorcé(e).
- `enfants_a_charge` (int) : Nombre d'enfants.
- `actif` (boolean) : Présent dans l'effectif ou sorti.

### Table 2 : `bulletins` (Historique & Clôtures Mensuelles de Paie)
- `id` (int PK)
- `salarie_id` (int FK -> salaries.id)
- `annee` (int), `mois` (int) : Contrainte UNIQUE (`salarie_id, annee, mois`).
- `salaire_base_theorique` (numeric)
- **Absences horaires (Loi 90-11)** : `maladie_h`, `mise_a_pied_h`, `accident_travail_h`, `retard_h`, `absence_irreguliere_h`.
- **Heures supplémentaires** : `heures_sup_1` (+50%), `heures_sup_2` (+75%), `heures_sup_3` (+100%).
- **Primes fixes & variables** : `icr`, `taux_iep` (ancienneté %), `taux_nuisance`, `taux_responsabilite`, `taux_disponibilite`, `taux_pri`, `taux_prc`, `panier_jours`, `panier_forfait_jour` (500 DA/j), `autre_prime_fixe`.
- **Retenues** : `cotis_mutuelle`, `autres_retenues`.
- `statut` (varchar) : `'Brouillon'`, `'Validé'`, `'Clôturé'`.
- `modifie_le` (timestamp).

### Table 3 : `rubriques_catalogue` (Les 402 Rubriques Officielles)
- `code` (varchar PK, ex: R280, R522) : Code nomenclature DLG/Officielle.
- `libelle` (varchar) : Désignation (ex: INDEMNITE DE NUISANCE).
- `type_valeur` (varchar) : `Gain (+)` ou `Retenue (-)`.
- `cotisable` (varchar) : `OUI` ou `NON` (impact assiette CNAS).
- `imposable` (varchar) : `OUI`, `NON` ou `IRG` (impact assiette Art. 104).

### Table 4 : `bulletin_rubriques` (Lignes Variables du Mois)
- `bulletin_id` (int FK), `rubrique_code` (varchar FK), `valeur_1` (numeric), `valeur_2` (numeric).

### Tables 5 & 6 : `contrats` & `documents_salaries`
- Gestion des contrats (CDI, CDD, avenants, périodes d'essai, dates d'échéance).
- Documents téléversés (CNI, diplômes, contrat signé, visite médicale).

### Tables 7, 8, 9 & 10 : `conges`, `missions`, `promotions`, `sanctions`, `avances_salaire`
- Congés annuels et maladies (statuts, décomptes).
- Ordres de mission avec calcul des frais de déplacement.
- Historique des promotions et des sanctions disciplinaires (Loi 90-11 Art. 73).
- Demandes d'avances sur salaire avec déduction automatique sur le prochain bulletin.

### Table 11 : `audit_logs` (Piste d'Audit Légale)
- Horodatage inaltérable de chaque modification de bulletin, avec `auteur_email`, `type_action`, `enregistrement_id` et `valeurs_apres`.

---

## ⚖️ 4. LE MOTEUR DE PAIE ALGÉRIEN (SANCTUAIRE LÉGAL STRICT)

Le moteur de calcul (`lib/paieCalcul.ts`) est rigoureusement conforme aux lois publiées au Journal Officiel algérien (JORADP) :

1. **Temps de Travail (Loi n°90-11)** :
   - Durée légale mensuelle : **173,33 heures** (40h/semaine).
   - Taux horaire de base = `Salaire de Base Théorique ÷ 173,33h`.
   - Déduction des absences sur la base réelle.
   - Majoration des Heures Supplémentaires : P1 (+50%), P2 (+75%), P3 (+100%).
2. **Sécurité Sociale (Loi n°83-11 & Décret n°06-373)** :
   - **CNAS Salariale (9 %)** à la charge du salarié.
   - **CNAS Patronale (26 %)** à la charge de l'employeur (versée avant le 15 du mois suivant).
   - **Exclusion d'assiette (Ordonnance n°95-01 Art. 1)** : La prime de panier et l'indemnité de transport sont représentatives de frais et formellement exclues de l'assiette de cotisation CNAS.
3. **Fiscalité Sociale IRG (CIDTA Art. 104 — LF 2022 à 2025)** :
   - Base imposable IRG = `Salaire BRUT Total − CNAS Salariale (9%)`. *(Le panier et le transport restent imposables à l'IRG car non exonérés à l'Art. 68)*.
   - Seuil d'exonération totale : Base IRG ≤ 30 000 DA → IRG = 0.
   - Barème progressif mensuel officiel en 6 tranches :
     - 0 à 20 000 DA : 0 %
     - 20 001 à 40 000 DA : 23 %
     - 40 001 à 80 000 DA : 27 %
     - 80 001 à 160 000 DA : 30 %
     - 160 001 à 320 000 DA : 33 %
     - Plus de 320 000 DA : 35 %
   - **Abattement légal de 40 % sur l'IRG brut** : Plancher de 1 000 DA/mois et Plafond de 1 500 DA/mois.
   - **Zone de lissage (30 001 à 42 500 DA)** : Formule officielle du 2e abattement dégressif : `IRG = IRG(1er abattement) × (93/61) − (81 213/41)`.
4. **Net à Payer** :
   - `Net = Brut − CNAS 9% − IRG Net − Autres retenues (Avances, Mutuelle)`.
   - Arrondi légal au Dinar entier le plus proche.

---

## 🎨 5. LA DEMANDE À GEMINI 4 ARGON (LIVRABLES ATTENDUS)

En tant que **Lead Product Designer**, nous te demandons de concevoir et structurer les 5 livrables suivants :

### Livrable A : L'Architecture d'Expérience (UX & Shell Global)
- Comment structurer la navigation globale (Sidebar / Command Deck / Raccourcis `Cmd+K`) pour un utilisateur qui gère 200 personnes ?
- Quels sont les modules principaux et comment s'articulent-ils entre la Paie, les Salariés, les Contrats et les Déclarations ?

### Livrable B : L'Expérience "Spreadsheet 2026" (Le Cœur Opérationnel)
- Comment concevoir l'écran idéal de saisie et de contrôle mensuel pour 200 collaborateurs ?
- Détaille l'interaction de la grille financière (colonnes fixes, colonnes éditables au clavier, colonnes calculées en direct, synthèse globale en pied de page, volet d'inspection latéral rétractable pour auditer un bulletin sans quitter le tableau).

### Livrable C : La Direction Artistique Fintech (Charte & Tokens)
- Définis la charte visuelle style **Ramp / Mercury** adaptée au B2B algérien : palette colorimétrique, typographie (pourquoi bannir les zéros barrés et comment sublimer les montants en DA), hiérarchie des surfaces, états actifs et micro-interactions.

### Livrable D : Le Cycle de Vie Mensuel de Paie (Workflow de Clôture)
- Comment concevoir le parcours de validation : Saisie des variables → Contrôle d'anomalies (alertes Loi 90-11) → Verrouillage & Clôture → Génération des virements bancaires/CCP et des bordereaux CNAS (9%/26%) et G50.

### Livrable E : La Feuille de Route d'Implémentation (Roadmap par Jalons)
- Un plan de développement ordonné étape par étape, avec les critères de succès pour chaque écran à coder.
