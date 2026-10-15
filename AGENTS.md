# NETIX SIRH — Règles d'Ingénierie pour Agents IA

Ce fichier unifié remplace et fusionne les anciennes instructions (`CLAUDE.md`, etc.). Il s'impose à tout agent intervenant sur le dépôt `netix-paie`.

---

## 0. Règle d'or absolue : Moteur de Paie INTOUCHABLE

Le moteur de calcul de la paie algérienne (`lib/paieCalcul.ts`, `lib/baremeIrgTransition.ts`, `lib/rubriquesDynamiques.ts`) est vérifié et validé par le métier.

- **INTERDICTION** : Ne modifier aucune formule, aucun barème, aucun taux CNAS (9%/26%) ni seuil d'exonération IRG sans accord écrit.
- **TESTS GOLDEN OBLIGATOIRES** : Après chaque modification du code, exécuter :
  ```bash
  npm run test:paie
  ```
  Si un seul chiffre diverge de plus de 0.01 DA par rapport aux 10 profils de référence, la modification doit être annulée immédiatement.
- **SÉPARATION STRICTE** : Aucun composant d'interface utilisateur (UI) ne doit calculer de montant financier en interne. L'UI se contente d'appeler les fonctions du moteur dans `lib/`.

---

## 1. Principes de Design System (Conformité NETIX_VISION_REFONTE.md)

1. **UNE SEULE COULEUR DE MARQUE** :
   - Marque principale : **Indigo `#4F46E5`** (`--brand-600`), hover `#4338CA`.
   - Interdit d'attribuer une couleur d'accent différente par module.
2. **ZÉRO EMOJI DANS L'UI** :
   - Utiliser exclusivement les icônes vectorielles **Lucide React** (trait 1.5px, couleur héritée).
   - Aucun emoji (💰, 👥, ⚠️, 📊, ⚡, etc.) ne doit être utilisé comme élément de navigation ou d'action.
3. **COULEURS SÉMANTIQUES STRICTES** :
   - Vert (`--success: #16A34A`), Orange (`--warning: #D97706`), Rouge (`--danger: #DC2626`) uniquement pour exprimer un état ou un badge de statut. Jamais comme décoration.
4. **HIÉRARCHIE D'ACTION** :
   - Un seul bouton d'action principale par écran (`.btn-primary`). Tous les boutons secondaires sont neutres avec contour gris subtil (`.btn-secondary`).

---

## 2. Découpage par phases & Workflow

Tout développement doit être mené **une phase à la fois** selon le plan de `NETIX_VISION_REFONTE.md` :
1. **Phase 0** : Sécurisation (audit `docs/AUDIT.md`, tests golden, nettoyage dépôt). Aucun changement visuel.
2. **Phase 1** : Design System (tokens `globals.css`, composants `components/ui/`, Lucide, page `/design`).
3. **Phase 2** : Coquille de l'application (navigation 6 entrées, gabarit standard, Accueil actionnable).
4. **Phase 3** : Collaborateurs et Contrats (dossier unifié, validations strictes, documents légaux).
5. **Phase 4** : Paie guidée (assistant de clôture en 5 étapes, statuts de période, états & déclarations).
6. **Phase 5** : Temps et Talents (congés, missions, carrière).
7. **Phase 6** : Finitions et mise en production.

> **Règle de fin de phase** : Lancer `npm run test:paie`, vérifier `git status`, pousser sur GitHub, vérifier le statut Vercel (`state: success`), et attendre la validation de l'utilisateur avant d'entamer la phase suivante.

---

## 3. Spécificités Next.js 16 & TypeScript

- Next.js 16 App Router avec Server Components par défaut.
- Server Actions pour les mutations avec `revalidatePath` ciblé.
- Pas de flottants imprécis pour la monnaie : formatage tabular-nums systématique.
