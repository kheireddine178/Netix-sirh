# NETIX SIRH — Vision & Cahier de Refonte

> **Document destiné à Antigravity (agent de développement).**
> Lis ce document en entier avant d'écrire la moindre ligne de code. Il fait foi sur tout le reste.
> Auteur : Responsable RH en charge de la digitalisation (Kharrouby Kheireddine).
> Contexte : SIRH algérien, Next.js + TypeScript, déployé sur Vercel (`netix-paie.vercel.app`).

---

## 0. Règle d'or

**Le moteur de paie est validé et est INTOUCHABLE.**

Les éléments suivants sont opérationnels et vérifiés par le métier. Ils ne doivent être ni réécrits, ni « optimisés », ni renommés, ni déplacés sans accord explicite :

- Rubriques de paie (gains, retenues, primes, indemnités)
- Cotisations CNAS (9 % salarié / 26 % patronal)
- Barème IRG et abattements
- Seuils d'exonération, SNMG (20 000 DA)
- Calcul Brut → Cotisable → Imposable → Net à payer

**Protocole de protection (à faire en PREMIER, avant toute refonte) :**

1. Identifier tous les fichiers de calcul (probablement dans `lib/`).
2. Créer un jeu de **tests « golden »** : 8 à 10 profils de salariés avec le Brut, les cotisations, l'IRG et le Net actuellement calculés. Ces valeurs deviennent la référence.
3. Ajouter un script `npm run test:paie` qui échoue si un seul chiffre change.
4. Lancer ce test après **chaque** phase de la refonte. Si un test casse, on annule la modification.
5. Aucun composant visuel ne doit contenir de logique de calcul. L'UI appelle le moteur, point.

---

## 1. Diagnostic de l'existant

### 1.1 Ce qui fonctionne (à conserver)

| Élément | Verdict |
|---|---|
| Moteur de paie (rubriques, CNAS, IRG) | ✅ Parfait, intouchable |
| Saisie mensuelle et saisie collective | ✅ À conserver, à redesigner |
| Bulletins PDF et virements | ✅ À conserver |
| Alertes RH (visites médicales, fins de CDD) | ✅ Bonne idée, à renforcer |
| Guide réglementaire loi 90-11 | ✅ Utile, à intégrer plus intelligemment |
| Portail salarié (`/portail`) | ✅ Concept à conserver |

### 1.2 Problèmes constatés

**Design et UX**

- **Couleurs multiples et incohérentes** : chaque module a sa propre couleur d'accent. Résultat : une interface « arc-en-ciel » sans identité.
- **Emojis utilisés comme icônes** (👥 ⚠️ 💰 ⚡ 📊) : rendu variable selon l'appareil, aspect amateur.
- **Navigation surchargée** : 13 entrées au même niveau (Accueil, Collaborateurs, Saisie mensuelle, Contrats & Docs, Congés & Absences, Missions & Ordres, Carrière & Discipline, Formations & Talent, États de Paie, Rubriques, Historique, Guide RH, Paramètres). Aucune hiérarchie.
- **Tableau de bord = grille de 8 tuiles** qui répète exactement le menu. Il n'apporte aucune information ni action.
- **Mention « Odoo 17/18 Enterprise Hub »** sur le dashboard : Netix n'est pas Odoo. Incohérence de marque, à supprimer.
- **Trop de « Ouvrir → » et de liens redondants** sur chaque tuile.
- **Thème sombre** présent mais probablement non maîtrisé : à refaire proprement avec des tokens ou à supprimer.

**Données et cohérence**

- Le dashboard affiche **3 collaborateurs mais 0 contrat** : les modules ne sont pas reliés entre eux.
- Collaborateur « Selim » sans nom de famille : formulaire de création insuffisamment contraignant.
- Aucun état vide pédagogique (« 0 CDI · 0 CDD » sans action proposée).

**Technique (dépôt GitHub)**

- `README.md` = template par défaut de `create-next-app`.
- `tsconfig.tsbuildinfo` versionné : fichier généré, à retirer et à ajouter au `.gitignore`.
- `ajouter_historique.ps1` : script ponctuel à la racine, à supprimer ou à déplacer dans `/scripts` documenté.
- `AGENTS.md` et `CLAUDE.md` coexistent : à fusionner en un seul fichier de règles pour agents.
- Aucun test automatisé visible, ce qui est risqué pour un outil de paie.

> ⚠️ **Note pour Antigravity** : avant de commencer, fais un **audit exhaustif de chaque route** (`/dashboard`, `/salaries`, `/saisie`, `/contrats`, `/conges`, `/missions`, `/carriere`, `/formations`, `/rapports`, `/rubriques`, `/historique`, `/guide`, `/parametres`, `/portail`). Pour chacune, note : fonctionne / partiel / cassé / inutile. Produis ce tableau dans `docs/AUDIT.md` avant toute modification.

---

## 2. Vision produit

### 2.1 En une phrase

> **Netix est le SIRH algérien le plus simple du marché : un seul outil, une seule couleur, un seul geste pour clôturer la paie du mois.**

### 2.2 Utilisateurs cibles

| Profil | Besoin principal |
|---|---|
| **Gestionnaire RH / Paie** (utilisateur principal) | Clôturer la paie vite, sans erreur, avec tous les documents |
| **Directeur / Gérant** | Voir la masse salariale et les alertes en 10 secondes |
| **Salarié** (portail) | Consulter son bulletin, poser un congé, télécharger une attestation |

### 2.3 Cible d'entreprise

PME algériennes de 5 à 200 salariés. Pas de jargon ERP, pas d'usine à gaz.

### 2.4 Principes directeurs

1. **Une action principale par écran.** Si tout est important, rien ne l'est.
2. **Pas de module vide.** Chaque écran doit fonctionner de bout en bout ou être retiré.
3. **Le cycle de paie guide l'utilisateur.** L'outil dit quoi faire ensuite.
4. **Conformité algérienne native** : loi 90-11, CNAS, CASNOS si applicable, IRG, SNMG, jours fériés légaux.
5. **Zéro décoration gratuite.** Pas de dégradés, pas d'emojis, pas d'animations inutiles.
6. **Français d'abord**, prévoir l'arabe (RTL) en phase ultérieure sans casser l'architecture.

---

## 3. Design System unique

### 3.1 Règle fondamentale : UNE couleur de marque

Supprimer **toutes** les couleurs d'accent par module. Tout le produit utilise la même palette.

**Couleur de marque** : indigo `#4F46E5` (déjà utilisé comme `theme-color` du site, on le conserve par cohérence).

### 3.2 Tokens de couleur (à définir dans `app/globals.css`)

```css
:root {
  /* Marque : UNE seule couleur */
  --brand-50:  #EEF2FF;
  --brand-100: #E0E7FF;
  --brand-500: #6366F1;
  --brand-600: #4F46E5;   /* principale : boutons, liens, état actif */
  --brand-700: #4338CA;   /* hover */

  /* Neutres : tout le reste de l'interface */
  --bg:          #F8FAFC;  /* fond de page */
  --surface:     #FFFFFF;  /* cartes, tableaux */
  --border:      #E2E8F0;
  --text:        #0F172A;
  --text-muted:  #64748B;

  /* Sémantiques : usage STRICT, uniquement pour un statut */
  --success: #16A34A;  /* validé, payé, conforme */
  --warning: #D97706;  /* à surveiller, échéance proche */
  --danger:  #DC2626;  /* erreur, retard, suppression */
}
```

**Règles d'usage**

- Un bouton principal par écran = `--brand-600`. Les autres boutons sont neutres (contour gris).
- Vert / orange / rouge **uniquement** pour exprimer un statut (badge, alerte). Jamais en décoration.
- Interdit : plus de 3 couleurs visibles par écran (hors statuts).
- Interdit : couleur différente par module, par carte ou par catégorie.
- Interdit : dégradés, ombres colorées, bordures colorées épaisses.
- Contraste texte/fond conforme WCAG AA (4,5:1 minimum).

### 3.3 Typographie

- Police : **Geist** (déjà chargée via `next/font`) ou Inter. Une seule famille.
- Échelle : 12 / 14 / 16 / 20 / 24 / 32 px. Corps de texte = 14 px dans les tableaux, 16 px ailleurs.
- Chiffres de paie : `font-variant-numeric: tabular-nums` obligatoire pour aligner les montants.
- Montants : format `75 253,00 DA` (espace fine comme séparateur de milliers, virgule décimale), aligné à droite.

### 3.4 Espacement, formes, ombres

- Grille d'espacement base 4 px (4, 8, 12, 16, 24, 32, 48).
- Rayon : 8 px (cartes, champs), 6 px (badges), 999 px (pastilles).
- Une seule ombre légère pour les cartes : `0 1px 2px rgba(15,23,42,.06)`. Pas d'autre.
- Largeur max du contenu : 1280 px.

### 3.5 Icônes

- **Supprimer tous les emojis de l'interface.**
- Utiliser **Lucide React** exclusivement, trait 1.5 px, taille 16 ou 20 px, couleur héritée du texte.
- Mapping de base : Collaborateurs = `Users`, Paie = `Wallet`, Contrats = `FileText`, Congés = `CalendarDays`, Missions = `Plane`, Carrière = `TrendingUp`, Formations = `GraduationCap`, États = `BarChart3`, Paramètres = `Settings`.

### 3.6 Composants de base (créer UNE bibliothèque dans `components/ui/`)

Tout l'écran se compose avec ces briques et rien d'autre :

`Button` (primary / secondary / ghost / danger), `Input`, `Select`, `DatePicker`, `Card`, `Badge` (success / warning / danger / neutral), `DataTable` (tri, filtre, pagination, export), `Modal`, `Drawer`, `Tabs`, `EmptyState`, `Toast`, `PageHeader`, `StatCard`, `Stepper`, `ConfirmDialog`.

Recommandation : **shadcn/ui + Tailwind** (le projet a déjà `postcss.config.mjs`, donc Tailwind est vraisemblablement présent). Ne pas réinventer.

### 3.7 Mode sombre

Deux options, choisir la plus simple :

- **Option A (recommandée pour la V1)** : supprimer le toggle. Un seul thème clair, parfaitement soigné.
- **Option B** : l'implémenter proprement via les mêmes tokens (`[data-theme="dark"]`), en redéfinissant uniquement les variables. Aucune couleur en dur dans les composants.

### 3.8 États obligatoires sur chaque écran

Chargement (skeleton), vide (`EmptyState` avec action), erreur (message clair + réessayer), succès (toast). Aucun écran ne reste blanc ou affiche « 0 » sans explication.

---

## 4. Architecture de l'information

### 4.1 Nouvelle navigation : de 13 entrées à 6

Menu latéral gauche, groupé, avec sections repliables. Mobile : barre du bas + menu burger.

```
NETIX
│
├─ Accueil                     (tableau de bord actionnable)
│
├─ Équipe
│   ├─ Collaborateurs          (annuaire + dossier complet)
│   └─ Contrats & Documents    (contrats, attestations, PV, avenants)
│
├─ Paie                        ⭐ cœur du produit
│   ├─ Clôture du mois         (assistant guidé, voir §5.2)
│   ├─ Saisie individuelle
│   ├─ Saisie collective
│   ├─ États & Déclarations    (journal, CNAS, IRG, virements, export compta)
│   └─ Rubriques               (paramétrage, accès restreint)
│
├─ Temps
│   ├─ Congés & Absences
│   └─ Missions
│
├─ Talents
│   ├─ Carrière & Discipline
│   └─ Formations & Évaluations
│
└─ (pied de menu)
    ├─ Guide RH                (référentiel loi 90-11)
    ├─ Paramètres              (entreprise, barèmes, utilisateurs, rôles)
    └─ Profil / Déconnexion
```

**Changements précis**

- « Historique » est **fusionné** : il devient un onglet « Historique » dans chaque dossier collaborateur, plus un journal d'audit dans Paramètres. Plus de page autonome.
- « Saisie mensuelle » + « Saisie collective » + « États » sont regroupés sous **Paie**.
- « Rubriques » passe sous Paie, visible uniquement du rôle Admin.
- Le **Guide RH** n'est plus une destination : il devient aussi une **aide contextuelle** (icône `?` à côté des champs concernés : congés, préavis, indemnités).

### 4.2 Structure de page standard

Chaque page suit exactement le même gabarit :

```
┌──────────────────────────────────────────────────────┐
│ Fil d'Ariane                                         │
│ Titre de page              [Action principale]       │
│ Sous-titre court                                     │
├──────────────────────────────────────────────────────┤
│ Filtres / onglets                                    │
├──────────────────────────────────────────────────────┤
│ Contenu (tableau, formulaire ou cartes)              │
└──────────────────────────────────────────────────────┘
```

Une seule action principale (bouton indigo) par page, en haut à droite.

---

## 5. Refonte des modules

### 5.1 Accueil : un tableau de bord qui sert à quelque chose

**Supprimer** : la grille de 8 tuiles « Applications & Modules » qui duplique le menu, et la mention « Odoo ».

**Nouveau contenu, de haut en bas :**

1. **Bandeau « Prochaine étape »** : une seule carte indigo qui dit quoi faire maintenant.
   Exemples : « Paie de [mois] : 0/3 bulletins saisis → Commencer », « Paie validée → Générer les virements ».
2. **4 indicateurs** (`StatCard`, neutres) : Effectif actif, Masse salariale brute du mois, Net à payer total, Charges patronales CNAS.
3. **« À traiter » (alertes)** : liste actionnable et triée par urgence, chaque ligne avec un bouton d'action direct.
   - Fins de CDD à 30 / 15 / 7 jours
   - Fins de période d'essai
   - Visites médicales périodiques à planifier (loi 90-11)
   - Demandes de congé en attente de validation
   - Dossiers incomplets (pièce manquante, RIB, N° CNAS, date de naissance)
   - Écarts de données (ex. collaborateur actif sans contrat)
4. **Évolution de la masse salariale** : un seul graphique linéaire sur 12 mois, couleur indigo.
5. **Activité récente** : 5 dernières actions (qui a fait quoi).

### 5.2 Paie : l'assistant de clôture (nouvelle fonctionnalité phare)

Le moteur de calcul ne change pas. On l'enveloppe dans un **parcours en 5 étapes** avec un `Stepper` :

| Étape | Contenu |
|---|---|
| **1. Préparer** | Choix du mois. Contrôles automatiques : dossiers incomplets, contrats expirés, congés non validés, nouveaux entrants/sortants. |
| **2. Saisir** | Variables du mois : primes, heures supplémentaires, absences, acomptes, avances. Import depuis les congés validés (déduction automatique). Option « reporter le mois précédent ». |
| **3. Contrôler** | Tableau récapitulatif avec écarts vs mois précédent (alerte si variation du net > 15 %). Détail du calcul visible par salarié (Brut → cotisations → IRG → Net). |
| **4. Valider** | Verrouillage de la période. Après validation : plus de modification sans « réouverture » tracée (qui, quand, pourquoi). |
| **5. Éditer** | Bulletins PDF (individuel ou lot), journal de paie, ordre de virement, bordereau CNAS, récapitulatif IRG, export comptable. |

Règles :
- Statut de période : `Brouillon → En contrôle → Validée → Clôturée`.
- Un mois clôturé est en lecture seule.
- Tous les montants sont stockés en **entiers ou décimaux précis** (pas de flottants JS pour l'argent : utiliser `decimal.js` ou des centimes en entier), **sans toucher aux résultats actuels** (cf. tests golden).

### 5.3 Collaborateurs : le dossier unique

Liste : tableau avec recherche, filtres (statut, service, type de contrat), export Excel.

Fiche collaborateur en **onglets** :

1. **Identité** : nom, prénom, date et lieu de naissance, N° sécurité sociale, adresse, situation familiale, enfants à charge (impact IRG), photo.
2. **Poste** : service, fonction, catégorie, échelon, date d'entrée, manager.
3. **Contrat** : type (CDI/CDD), dates, période d'essai, avenants, historique.
4. **Rémunération** : salaire de base, primes fixes, RIB, mode de paiement.
5. **Congés** : solde, historique, planning.
6. **Documents** : pièces d'identité, diplômes, attestations générées, visites médicales.
7. **Carrière & Discipline** : promotions, changements de salaire, sanctions.
8. **Historique** : journal des modifications.

**Validations obligatoires à la création** : nom ET prénom, date de naissance, date d'entrée, N° CNAS, RIB au format valide, salaire de base ≥ SNMG (avertissement bloquant sauf justification).

Création en **assistant multi-étapes** (pas un formulaire de 40 champs sur une page), avec enregistrement de brouillon.

### 5.4 Contrats & Documents

- Génération depuis des **modèles** modifiables : contrat CDI, contrat CDD, avenant, attestation de travail, attestation de salaire, certificat de travail, PV d'installation, convocation, avertissement, décision de sanction, solde de tout compte.
- Variables fusionnées automatiquement depuis le dossier collaborateur.
- Export PDF avec en-tête entreprise (logo, adresse, RC, NIF, NIS, N° CNAS employeur) configuré une seule fois dans Paramètres.
- Numérotation automatique et registre des documents émis.
- **Lien obligatoire avec le dossier** : un collaborateur actif sans contrat déclenche une alerte.

### 5.5 Congés & Absences

- Soldes calculés selon la loi 90-11 (2,5 jours ouvrables par mois de travail, plafond annuel légal), avec **vérification des règles dans le Guide avant implémentation**.
- Types : congé annuel, maladie, maternité, spécial (mariage, naissance, décès), sans solde, récupération, autorisation d'absence.
- Workflow : demande → validation manager → validation RH → impact automatique sur la paie.
- Calendrier d'équipe mensuel (qui est absent quand), avec détection de chevauchements.
- Jours fériés algériens paramétrables (les fêtes religieuses varient chaque année : prévoir une saisie annuelle).
- Les congés sans solde et absences non justifiées alimentent directement l'étape « Saisir » de la clôture de paie.

### 5.6 Missions

- Demande → validation → ordre de mission PDF → frais et indemnités → clôture.
- Indemnités de déplacement paramétrables par grille (pas de montants en dur).
- Rattachement à la paie du mois si indemnité imposable ou non.

### 5.7 Carrière & Discipline

Fusionner l'affichage en **frise chronologique par collaborateur** (promotions, changements d'échelon, sanctions, formations). Les sanctions suivent la procédure légale (avertissement, blâme, mise à pied…) avec génération du document correspondant. Accès restreint (rôles).

### 5.8 Formations & Évaluations

À garder simple en V1 :
- Catalogue de formations, plan annuel, inscriptions, présence, coût.
- Évaluation annuelle : une grille de critères paramétrable, une note, des commentaires, un objectif N+1.
- Si ce module ne peut pas être terminé proprement, **le masquer** plutôt que le laisser à moitié fonctionnel.

### 5.9 États & Déclarations

Ce module est la valeur finale pour la direction et l'administration :

- Journal de paie (mensuel, trimestriel, annuel)
- Récapitulatif des cotisations CNAS (bordereau)
- Récapitulatif IRG / état pour la déclaration fiscale
- Ordre de virement bancaire (export fichier par banque si possible)
- Export comptable (écritures de paie)
- Coût du personnel par service
- Tous exportables en **PDF et Excel**.

> Pour les formats officiels (DAS, G50, bordereaux), **ne pas inventer** de mise en page : vérifier avec le métier avant de générer un document présenté comme « officiel ».

### 5.10 Portail Salarié (`/portail`)

Mobile-first, très simple :
- Connexion sécurisée par salarié.
- Mes bulletins (téléchargement PDF), mon solde de congés, ma demande de congé, mes attestations (demande + téléchargement), mon dossier (consultation, demande de correction).
- Notifications (congé validé, bulletin disponible).

### 5.11 Paramètres

Onglets : **Entreprise** (identité, logo, numéros officiels), **Barèmes** (SNMG, CNAS, IRG : valeurs en lecture/modification contrôlée avec **date d'effet** et historique), **Organisation** (services, fonctions, catégories), **Jours fériés**, **Utilisateurs & rôles**, **Journal d'audit**, **Sauvegarde / Export**.

> Les barèmes doivent être **versionnés par date d'effet** : un changement de loi de finances ne doit jamais recalculer rétroactivement les mois déjà clôturés.

---

## 6. Rôles et sécurité

| Rôle | Droits |
|---|---|
| **Admin** | Tout, y compris Rubriques, Barèmes, Utilisateurs |
| **RH / Paie** | Collaborateurs, Paie, Contrats, Congés, États |
| **Manager** | Valide les congés/missions de son équipe, consulte son équipe |
| **Direction** | Lecture seule : dashboard, états, masse salariale |
| **Salarié** | Portail uniquement, ses propres données |

Exigences :
- Authentification réelle (pas d'accès libre à `/dashboard`).
- Les données de paie sont sensibles : contrôle d'accès **côté serveur**, jamais uniquement côté interface.
- Journal d'audit (qui a modifié quoi, quand) pour tout changement de salaire, de contrat, de période de paie.
- Aucune clé secrète dans le dépôt (`.env.local` ignoré, `.env.local.example` seul versionné).
- Sauvegarde automatique et export complet des données.

---

## 7. Modèle de données de référence

Relations clés à garantir (c'est ce qui élimine les incohérences type « 3 collaborateurs, 0 contrat ») :

```
Entreprise 1─n Service 1─n Collaborateur
Collaborateur 1─n Contrat
Collaborateur 1─n Congé / Absence
Collaborateur 1─n Mission
Collaborateur 1─n EvénementCarrière (promotion, sanction, changement salaire)
Collaborateur 1─n Document
Collaborateur 1─n Formation (inscription) / Evaluation
Période de paie 1─n BulletinDePaie 1─n LigneDeBulletin (rubrique)
Barème (CNAS / IRG / SNMG) : versionné par date d'effet
Utilisateur n─1 Rôle ; JournalAudit référence Utilisateur + entité modifiée
```

Règle : **un seul référentiel collaborateur**. Les autres modules lisent ce référentiel, ne le dupliquent jamais.

---

## 8. Nettoyage du projet

**Supprimer / corriger**

- [ ] `tsconfig.tsbuildinfo` : retirer du dépôt, ajouter au `.gitignore`
- [ ] `ajouter_historique.ps1` : supprimer ou déplacer dans `/scripts` avec documentation
- [ ] `AGENTS.md` + `CLAUDE.md` : fusionner en un `AGENTS.md` unique (règles de §0 et §3 incluses)
- [ ] `README.md` : remplacer le template par défaut (présentation, installation, variables d'environnement, commandes, architecture, règle sur le moteur de paie)
- [ ] Mention « Odoo 17/18 Enterprise Hub » : supprimer partout
- [ ] Tous les emojis dans l'UI
- [ ] Toutes les couleurs d'accent spécifiques à un module
- [ ] Pages, boutons et liens qui ne fonctionnent pas : **supprimer**, ne pas laisser « bientôt disponible »
- [ ] Code mort, composants dupliqués, styles inline, valeurs de couleur en dur (`#xxxxxx` hors tokens)
- [ ] Données de démonstration incohérentes (remplacer par un jeu de démo propre, activable/désactivable)

**Ajouter**

- [ ] Tests golden de la paie (§0)
- [ ] `docs/AUDIT.md`, `docs/DESIGN_SYSTEM.md`, `docs/CHANGELOG.md`
- [ ] Page 404 et page d'erreur propres
- [ ] Favicon et métadonnées cohérents
- [ ] Jeu de données de démonstration réaliste (8 à 10 salariés, services variés, cas limites : CDD, temps partiel, congé sans solde, salaire proche du SNMG)

---

## 9. Plan de réalisation par phases

> **Consigne à Antigravity : exécute UNE phase à la fois. À la fin de chaque phase : lance les tests de paie, lance le build, résume ce qui a changé, et attends ma validation avant de continuer.**

### Phase 0 : Sécurisation (aucun changement visuel)
1. Audit complet des routes → `docs/AUDIT.md`
2. Tests golden du moteur de paie
3. Nettoyage du dépôt (§8)
4. Fusion `AGENTS.md` / `CLAUDE.md`, nouveau `README.md`

**Critère de sortie** : `npm run test:paie` vert, `npm run build` sans erreur, tableau d'audit livré.

### Phase 1 : Design System
1. Tokens de couleur, typographie, espacement dans `globals.css`
2. Bibliothèque `components/ui/` complète (§3.6)
3. Suppression des emojis, installation de Lucide
4. Page de démonstration `/design` listant tous les composants (outil interne)

**Critère de sortie** : aucune couleur en dur dans l'application hors `globals.css`, un seul accent visible.

### Phase 2 : Coquille de l'application
1. Nouvelle navigation (§4.1), responsive
2. Gabarit de page standard (§4.2)
3. Authentification et rôles (§6)
4. Nouvel Accueil actionnable (§5.1)

**Critère de sortie** : 6 entrées de menu, navigation fluide sur mobile, dashboard sans doublon avec le menu.

### Phase 3 : Collaborateurs et Contrats
1. Liste + dossier à onglets (§5.3)
2. Création en assistant avec validations
3. Contrats et génération de documents (§5.4)
4. Alertes d'échéances reliées

**Critère de sortie** : impossible de créer un collaborateur incomplet ; chaque actif a un contrat ou une alerte.

### Phase 4 : Paie guidée (habillage, pas de recalcul)
1. Assistant de clôture en 5 étapes (§5.2)
2. Statuts et verrouillage de période
3. Saisie individuelle et collective redessinées
4. États & Déclarations (§5.9)

**Critère de sortie** : tests golden toujours verts, un mois complet clôturé de bout en bout avec tous les documents.

### Phase 5 : Temps et Talents
1. Congés (soldes, workflow, calendrier) reliés à la paie (§5.5)
2. Missions (§5.6)
3. Carrière & Discipline (§5.7)
4. Formations & Évaluations (§5.8) ou masquage si non finalisé

**Critère de sortie** : un congé sans solde validé apparaît automatiquement dans la saisie de paie.

### Phase 5 bis : Portail salarié
Selon §5.10.

### Phase 6 : Finitions et mise en production
1. Paramètres complets, barèmes versionnés (§5.11)
2. Journal d'audit
3. Accessibilité (clavier, contrastes, labels), performance (Lighthouse > 90)
4. Jeu de démo, 404, erreurs, états vides
5. Revue finale design : une couleur, zéro emoji, cohérence totale

---

## 10. Critères d'acceptation globaux (« prêt à l'emploi »)

Le nouveau Netix est accepté si **tous** les points suivants sont vrais :

- [ ] Les tests golden de paie passent à 100 % (aucun chiffre modifié)
- [ ] Une seule couleur de marque, trois couleurs de statut, zéro emoji
- [ ] 6 entrées de menu maximum au premier niveau
- [ ] Aucune page vide, cassée ou « à venir »
- [ ] Un gestionnaire RH novice clôture la paie d'un mois en moins de 15 minutes sans aide
- [ ] Un collaborateur peut être créé, contractualisé, payé, mis en congé, et sorti, sans quitter l'outil
- [ ] Toutes les données sont cohérentes entre modules (un seul référentiel)
- [ ] Un mois clôturé est verrouillé et tout changement est tracé
- [ ] L'interface est utilisable sur téléphone (portail surtout)
- [ ] Le build Vercel passe sans erreur ni avertissement bloquant
- [ ] Aucun secret dans le dépôt, accès protégé par authentification et rôles
- [ ] README et documentation à jour

---

## 11. Prompts prêts à coller dans Antigravity

### Prompt initial (à donner en premier)

```
Lis le fichier NETIX_VISION_REFONTE.md à la racine du projet en entier.
C'est le cahier de refonte de Netix SIRH. Règles absolues :
1. Le moteur de paie (rubriques, CNAS, IRG, calculs) est INTOUCHABLE.
2. Tu travailles UNE phase à la fois et tu t'arrêtes à la fin de chacune.
3. Tu commences par la Phase 0 uniquement : audit des routes dans docs/AUDIT.md,
   tests golden de la paie, nettoyage du dépôt.
4. Tu ne modifies aucune interface dans la Phase 0.
Quand la Phase 0 est terminée, donne-moi un résumé et attends ma validation.
```

### Prompt Phase 1 (Design System)

```
Phase 1 du fichier NETIX_VISION_REFONTE.md : Design System.
Implémente les tokens (§3.2), la typographie (§3.3), la bibliothèque components/ui (§3.6)
avec shadcn/ui et Tailwind, remplace tous les emojis par Lucide, supprime toutes les couleurs
d'accent par module. Une seule couleur de marque : indigo #4F46E5.
Crée une page /design qui présente tous les composants.
Vérifie avec npm run test:paie et npm run build. Ne touche pas à lib/ (moteur de paie).
Arrête-toi à la fin et résume.
```

### Prompt Phase 2 (Navigation et Accueil)

```
Phase 2 : refonds la navigation en 6 entrées groupées (§4.1), applique le gabarit de page (§4.2),
mets en place l'authentification et les rôles (§6), et reconstruis l'Accueil selon §5.1 :
bandeau « Prochaine étape », 4 indicateurs, liste « À traiter » actionnable, graphique masse salariale.
Supprime la grille de tuiles et la mention Odoo. Teste, build, résume, attends validation.
```

### Prompt Phase 4 (Paie guidée)

```
Phase 4 : construis l'assistant de clôture de paie en 5 étapes (§5.2) autour du moteur existant.
INTERDIT de modifier les formules de calcul. Ajoute les statuts de période (Brouillon, En contrôle,
Validée, Clôturée), le verrouillage et la réouverture tracée.
Les tests golden doivent rester verts. Fournis un scénario de test complet : clôturer un mois
avec 3 salariés et générer bulletins, journal, virement et bordereau CNAS.
```

### Prompt de contrôle qualité (à lancer à la fin de chaque phase)

```
Fais une revue de la phase terminée :
1. Liste toute couleur en dur ou tout emoji restant.
2. Liste toute page ou bouton non fonctionnel.
3. Lance npm run test:paie et npm run build, montre les résultats.
4. Liste les écarts avec les critères de sortie de la phase dans NETIX_VISION_REFONTE.md.
Ne corrige rien tant que je n'ai pas validé la liste.
```

---

## 12. Points à valider avec le métier avant de coder

Ces sujets demandent une décision de ma part (RH) et **ne doivent pas être devinés** par l'agent :

1. Formats exacts des documents officiels (bordereau CNAS, état IRG, DAS) à reproduire.
2. Règles de calcul des soldes de congés dans les cas particuliers (maternité, temps partiel, première année).
3. Grille des indemnités de mission.
4. Liste des modèles de documents RH à fournir et leur texte juridique.
5. Gestion éventuelle de CASNOS, heures supplémentaires majorées, travail de nuit, indemnités spécifiques.
6. Choix du thème sombre : supprimer (recommandé V1) ou implémenter.
7. Hébergement et sauvegarde des données de paie (localisation, conformité).

**Si une règle métier est ambiguë, Antigravity doit poser la question dans le résumé de phase au lieu de l'inventer.**

---

*Fin du document. Version 1.0.*
