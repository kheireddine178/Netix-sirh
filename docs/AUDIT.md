# NETIX SIRH — Audit Exhaustif des Routes (Phase 0)

> **Document de référence établi conformément à la section 1 et 9 du document `NETIX_VISION_REFONTE.md`.**  
> Date : Octobre 2026 — Version 1.0  
> Statut : Phase 0 — Sécurisation & Diagnostic initial

---

## 1. Synthèse de l'audit

L'audit a passé au crible l'ensemble des 26 routes et sous-routes de Netix SIRH.

- **Points forts avérés** : Le moteur de paie algérien (`lib/paieCalcul.ts`), la gestion des rubriques catalogue, le calcul en cascade (Brut → CNAS 9% → IRG barème 2024 → Net à payer) et l'édition des bulletins PDF sont totalement opérationnels et conformes à la loi 90-11 et au CIDTA.
- **Faiblesses majeures** :
  1. **Fragmentation de l'information** : 13 entrées de menu de premier niveau sans regroupement logique (ex. Saisie, Historique, Rapports et Rubriques éclatés alors qu'ils relèvent tous du cycle de paie).
  2. **Incohérences de données entre modules** : Les collaborateurs existent sans obligation de contrat initial (ex. 3 collaborateurs et 0 contrat au dashboard).
  3. **Manque d'actionnabilité du tableau de bord** : Présence de tuiles d'applications redondantes avec le menu latéral au lieu d'un bandeau de pilotage et d'alertes directes.
  4. **Pollution visuelle (historique)** : Emojis dans l'UI et couleurs d'accent disparates à unifier sous une seule marque (Indigo `#4F46E5`).

---

## 2. Tableau Exhaustif des Routes

| Route | Rôle & Fonctionnalité | Statut Actuel | Problèmes constatés | Action Cible (Phases 1 à 6) |
| :--- | :--- | :---: | :--- | :--- |
| `/` | Landing page vitrine & présentation produit | **Fonctionne** | Couleurs et liens à aligner sur la marque unique Indigo `#4F46E5`. | Conserver, nettoyer les styles, relier au portail et à l'authentification. |
| `/dashboard` | Tableau de bord RH & accueil général | **Partiel** | Duplique le menu latéral, mention Odoo à retirer, manque d'un bandeau "Prochaine étape" et d'un graphique de masse salariale. | **Phase 2** : Reconstruire selon §5.1 (Bandeau action, 4 stats neutres, liste "À traiter", graphique 12 mois). |
| `/salaries` | Annuaire des collaborateurs (Kanban / Liste) | **Fonctionne** | Formulaire de création pas assez contraignant (cas du collaborateur sans nom de famille). | **Phase 3** : Assurer un tableau standard avec recherche, filtre service/contrat et export. |
| `/salaries/nouveau` | Assistant de création d'un salarié | **Partiel** | Formulaire direct sans étapes, validations manquantes (ex. date de naissance, RIB, CNAS). | **Phase 3** : Transformer en assistant guidé multi-étapes avec validations strictes. |
| `/salaries/[id]` | Dossier collaborateur (vue d'ensemble & onglets) | **Fonctionne** | Données dispersées sur plusieurs sous-pages autonomes. | **Phase 3** : Centraliser en un dossier complet à 8 onglets unifiés (§5.3). |
| `/salaries/[id]/modifier` | Modification de la fiche collaborateur | **Fonctionne** | Formulaire monolithique. | Intégrer directement dans les onglets du dossier collaborateur. |
| `/salaries/[id]/contrat` | Gestion du contrat et génération PV/Attestation | **Fonctionne** | Manque de modèles de documents modifiables (§5.4). | **Phase 3** : Enrichir avec le générateur de documents légaux et registre d'émission. |
| `/salaries/[id]/conges` | Soldes et historique individuel des congés | **Fonctionne** | Compteurs de congés isolés du calendrier d'équipe. | **Phase 5** : Relier au workflow global et injecter automatiquement les sans-solde en paie. |
| `/salaries/[id]/missions` | Missions et ordres de mission individuels | **Fonctionne** | Barème d'indemnité non paramétrable. | **Phase 5** : Grille paramétrable d'indemnités de déplacement. |
| `/salaries/[id]/carriere` | Historique de carrière, échelons et sanctions | **Fonctionne** | Interface fragmentée. | **Phase 5** : Présenter sous forme de frise chronologique unifiée. |
| `/salaries/[id]/formations` | Inscriptions aux formations professionnelles | **Partiel** | Peu de données, module minimaliste. | **Phase 5** : Compléter ou masquer si non finalisé pour la V1 (§5.8). |
| `/salaries/[id]/historique` | Anciens bulletins de paie PDF du collaborateur | **Fonctionne** | Page autonome redondante. | **Phase 3** : Intégrer comme simple onglet "Bulletins" du dossier collaborateur. |
| `/salaries/[id]/rubriques` | Assignation des rubriques dynamiques individuelles | **Fonctionne** | Doit être réservé aux utilisateurs ayant le rôle Admin/RH. | Conserver sous contrôle d'accès dans le dossier rémunération. |
| `/salaries/[id]/bulletin/explication` | Décomposition pédagogique du calcul de paie | **Fonctionne** | Outil d'explication très utile pour le gestionnaire RH. | Conserver comme modal ou tiroir contextuel lors du contrôle du bulletin. |
| `/saisie` | Saisie mensuelle des variables de paie | **Fonctionne** | Processus linéaire de clôture absent. | **Phase 4** : Intégrer dans l'assistant de clôture en 5 étapes (§5.2). |
| `/saisie/collective` | Grille de saisie matricielle en masse | **Fonctionne** | Efficace pour les primes collectives. | Conserver comme sous-vue de la saisie mensuelle. |
| `/saisie/avances` | Gestion des acomptes et avances sur salaire | **Fonctionne** | Non synchronisé automatiquement avec la saisie. | **Phase 4** : Imputation automatique dans les retenues du mois en cours. |
| `/contrats` | Hub global des contrats & alertes CDD | **Fonctionne** | Déconnecté de la création des salariés. | **Phase 3** : Regrouper sous le menu Équipe > Contrats & Documents. |
| `/conges` | Hub global des congés, demandes et soldes | **Fonctionne** | Absence de calendrier visuel d'équipe. | **Phase 5** : Ajouter le calendrier d'absences mensuel et gestion des jours fériés. |
| `/missions` | Hub global des ordres de mission | **Fonctionne** | Génération PDF opérationnelle. | **Phase 5** : Regrouper sous Temps > Missions. |
| `/carriere` | Hub global carrière et discipline | **Fonctionne** | Visibilité trop large (données disciplinaires sensibles). | **Phase 5** : Protéger par rôles (Admin/RH uniquement). |
| `/formations` | Hub formations et évaluations de talents | **Partiel** | Évaluations annuelles basiques. | **Phase 5** : Finaliser le plan annuel ou masquer pour la V1. |
| `/rapports` | Centralisateur, état nominatif, G50, virements | **Fonctionne** | Éclaté hors du menu Paie. | **Phase 4** : Regrouper sous Paie > États & Déclarations. |
| `/rubriques` | Catalogue national des 402 rubriques Hydrocanal | **Fonctionne** | Accessible à tous les utilisateurs. | **Phase 4** : Déplacer sous Paie > Rubriques (accès Admin strict). |
| `/historique` | Journal global des bulletins émis | **Inutile** | Fait doublon avec États de Paie et les dossiers individuels. | **Phase 2** : Fusionner dans États & Déclarations et Journal d'audit (§4.1). |
| `/guide` | Référentiel complet Droit du Travail (Loi 90-11) | **Fonctionne** | Isolé dans un écran séparé. | Conserver en pied de menu ET ajouter des aides contextuelles `(?)` dans les formulaires. |
| `/parametres` | Configuration entreprise, barèmes légaux, SNMG | **Fonctionne** | Barèmes non versionnés par date d'effet. | **Phase 6** : Versionner les barèmes légaux avec date d'effet pour éviter les recalculs rétroactifs. |
| `/portail` | Portail employé en libre-service | **Partiel** | Manque d'authentification robuste par salarié. | **Phase 5 bis** : Sécuriser la connexion individuelle mobile-first. |

---

## 3. Plan de migration vers la navigation à 6 entrées

Conformément à la section 4.1 du document de refonte :

```
NETIX
├── 1. Accueil                  (/dashboard - restructuré en centre de pilotage)
├── 2. Équipe                   (/salaries, /contrats)
├── 3. Paie                     (/paie/cloture, /saisie, /saisie/collective, /rapports, /rubriques)
├── 4. Temps                    (/conges, /missions)
├── 5. Talents                  (/carriere, /formations)
└── (Pied de menu)              (/guide, /parametres, /profil)
```

Toutes les routes existantes restent pleinement fonctionnelles en arrière-plan pendant la transition par phases.
