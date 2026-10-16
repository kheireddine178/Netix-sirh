# MISSION PRODUCT & ENGINEERING : NETIX SIRH 2.0 (STANDARD FINTECH HAUT DE GAMME)

> **INSTRUCTION SYSTÈME CRITIQUE POUR ANTIGRAVITY (GEMINI FLASH / AGENT DE CODE) :**
> Tu es le Principal Software Architect & Lead Product Designer de **Netix SIRH 2.0** (standards esthétiques et d'interaction de **Ramp, Mercury, Stripe et Linear**).
> Le propriétaire de ce projet est un **Chef de Service RH & Expert Paie Algérienne**. Il maîtrise parfaitement le droit social algérien. Ton rôle est de traduire son expertise métier en une architecture logicielle irréprochable, ultra-rapide et visuellement sublime, **sans jamais casser ni altérer ses règles de calcul légales**.
> Lis ce document intégralement avant toute modification de code. Respecte chaque règle, chaque formule mathématique et chaque étape dans l'ordre strict.

---

## 1. VISION PRODUIT & CONTEXTE MÉTIER

* **Utilisateur Cible :** Chef de service RH & Paie en Algérie pilotant 200 collaborateurs (CDI, CDD, cadres, maîtrise, exécution).
* **Le Némésis à remplacer :** DLG PC PAIE (logiciel des années 1990 sous Windows XP/7).
* **Pourquoi DLG survit encore :** Sa rapidité de saisie au pavé numérique.
* **Pourquoi DLG doit mourir :** 400 codes cryptiques à apprendre par cœur, fenêtres modales grises bloquantes, aucune vue d'ensemble, zéro tableau de bord exécutif pour la Direction Générale.
* **La Promesse Netix SIRH 2.0 :**
  1. **Esthétique "Fintech Haut de Gamme" (Ramp / Mercury) :** Surfaces albâtre chaudes, bordures de `1px` ultra-fines, typographie de précision avec chiffres tabulaires alignés au centime près, zéro bruit visuel.
  2. **Interaction "Spreadsheet 2026" (Linear / Airtable) :** Une grille financière haute vélocité navigable **100 % au clavier** (Flèches, `Tab`, `Entrée`, `Espace`) pour traiter les 200 salariés sur un seul écran, avec recalcul instantané (`0 ms`) côté client et tiroir d'inspection latéral coulissant (`Barre d'Espace`).

---

## 2. LE SANCTUAIRE LÉGAL DE PAIE ALGÉRIENNE (RÈGLES ABSOLUES & INVIOLABLES)

⚠️ **RÈGLE D'OR POUR L'AGENT :** Toute la logique mathématique ci-dessous DOIT être isolée dans un fichier pur et synchrone `src/lib/payroll-engine.ts` (Zéro dépendance React, Zéro appel Supabase à l'intérieur). Tu ne dois JAMAIS modifier ces formules lors d'un changement d'interface (UI).

### 2.1. Base Horaire Légale & Proratisation des Absences (Loi 90-11)
* **Volume horaire mensuel légal :** $173,33\text{ heures}$ (soit $40\text{h/semaine} \times 52 \div 12$).
* **Jours ouvrables mensuels standards :** $22\text{ jours}$ (ou $26\text{ jours}$ selon régime, configurable, par défaut $22\text{ jours}$ pour le panier).
* **Taux Horaire de Base :**
  $$\text{Taux Horaire} = \frac{\text{Salaire de Base}}{173,33}$$
* **Heures Travaillées du Mois :**
  $$\text{Heures Travaillées} = \max(0, 173,33 - \text{Heures d'Absence})$$
* **Retenue Absence sur Salaire de Base :**
  $$\text{Retenue Absence} = \text{Heures d'Absence} \times \text{Taux Horaire}$$
* **Heures Supplémentaires (Loi 90-11) :**
  * $\text{HS 50\% (P1)} = \text{Heures}_{50} \times \text{Taux Horaire} \times 1,50$
  * $\text{HS 75\% (P2)} = \text{Heures}_{75} \times \text{Taux Horaire} \times 1,75$
  * $\text{HS 100\% (P3)} = \text{Heures}_{100} \times \text{Taux Horaire} \times 2,00$

### 2.2. Proratisation Automatique du Transport et du Panier selon l'Absence
Conformément à la règle métier stricte de l'entreprise :
1. **Indemnité de Transport (Proratisée sur base $173,33\text{h}$) :**
   Si le forfait transport mensuel sans absence est $T_{\text{forfait}}$ (ex: $2\,500\text{ DA}$ pour $173,33\text{h}$) :
   $$\text{Transport Calculé} = \text{ round2}\left( T_{\text{forfait}} \times \frac{173,33 - \text{Heures d'Absence}}{173,33} \right)$$
2. **Prime de Panier (Proratisée sur base $22\text{ jours ouvrables}$) :**
   Un mois complet sans absence donne droit à $22\text{ paniers}$. Chaque journée d'absence ($\approx 7,88\text{h}$ ou saisie en jours) réduit le nombre de paniers :
   $$\text{Jours d'Absence Équivalents} = \frac{\text{Heures d'Absence}}{173,33 / 22}$$
   $$\text{Jours Travaillés Panier} = \max(0, 22 - \text{Jours d'Absence Équivalents})$$
   $$\text{Panier Calculé} = \text{ round2}\left( \text{Jours Travaillés Panier} \times \text{Taux Unitaire Panier} \right)$$
   *(Note UI : L'utilisateur peut toujours forcer manuellement le nombre de paniers ou le montant dans la grille s'il y a un cas particulier).*

### 2.3. Assiette CNAS & Ventilation Officielle à 34,5 % (Loi 83-11 & Décret Exécutif)
* **Exclusion Légale (Ordonnance 95-01 Art. 1) :** Les primes de **Panier** et de **Transport** sont **EXCLUES** de l'assiette de cotisation CNAS (drapeau `cotisable_cnas = false`), mais sont **INCLUSES** dans l'assiette imposable IRG (`imposable_irg = true`). Les prestations familiales et frais de mission sont exclus des deux.
* **Salaire de Poste (Assiette Soumise à Cotisation CNAS) :**
  $$\text{Salaire de Poste} = (\text{Salaire de Base} - \text{Retenue Absence}) + \text{Heures Sup} + \sum \text{Primes Cotisables (IEP, PRI, Nuisance...)}$$
* **Ventilation des Taux CNAS (Total Global = 34,5 %) :**
  1. **Retenue CNAS Salariale (9 %) — Déduite du bulletin du salarié :**
     $$\text{CNAS Salariale} = \text{round2}(\text{Salaire de Poste} \times 0,09)$$
  2. **Part Patronale CNAS (25 %) — Charge Employeur :**
     $$\text{CNAS Patronale} = \text{round2}(\text{Salaire de Poste} \times 0,25)$$
  3. **Quote-part Fonds des Œuvres Sociales CNAS (0,5 %) — Charge Employeur :**
     $$\text{CNAS Œuvres Sociales} = \text{round2}(\text{Salaire de Poste} \times 0,005)$$
  4. **Total Enveloppe DAC CNAS (34,5 %) :**
     $$\text{Total DAC CNAS} = \text{CNAS Salariale (9\%)} + \text{CNAS Patronale (25\%)} + \text{Œuvres Sociales (0,5\%)}$$

### 2.4. Algorithme Exact de l'IRG Salaires (CIDTA Art. 104 & Table Officielle DGI 2022)
Le moteur doit reproduire **à la décimale exacte** le barème officiel `TABLE_IRG_2022.pdf` de la Direction Générale des Impôts (DGI) :

1. **Calcul du Salaire Brut Imposable (Base IRG Brute) :**
   $$\text{Base IRG} = (\text{Salaire de Poste} - \text{CNAS Salariale } 9\%) + \text{Panier} + \text{Transport} + \sum \text{Autres Primes Imposables Non-Cotisables}$$
2. **Troncature Réglementaire à la Dizaine Inférieure ($R$) :**
   Le barème DGI s'applique par paliers de $10\text{ DA}$. Toute base imposable est tronquée à la dizaine inférieure :
   $$R = \lfloor \text{Base IRG} \div 10 \rfloor \times 10$$
3. **Seuil d'Exonération Totale :**
   Si $R \le 30\,000\text{ DA} \implies \text{IRG Retenu} = \mathbf{0,00\text{ DA}}$.
4. **Étape A — Calcul de l'IRG Brut par Tranches Progressifs (sur $R$) :**
   * De $0$ à $20\,000\text{ DA}$ : $0\%$
   * De $20\,001$ à $40\,000\text{ DA}$ : $23\%$
   * De $40\,001$ à $80\,000\text{ DA}$ : $27\%$
   * De $80\,001$ à $160\,000\text{ DA}$ : $30\%$
   * De $160\,001$ à $320\,000\text{ DA}$ : $33\%$
   * Au-delà de $320\,000\text{ DA}$ : $35\%$
5. **Étape B — Application du 1er Abattement Légal de 40 % ($I_1$) :**
   $$\text{Abattement}_{40\%} = \min\left(1\,500, \max\left(1\,000, \text{IRG}_{\text{Brut}} \times 0,40\right)\right)$$
   $$I_1 = \max\left(0, \text{IRG}_{\text{Brut}} - \text{Abattement}_{40\%}\right)$$
6. **Étape C — Application du 2e Abattement Dégressif (Loi de Finances / Table DGI) :**
   * **Cas Général (Salarié standard) :**
     * Si $30\,000 < R < 35\,000\text{ DA}$ :
       $$\text{IRG}_{\text{Final}} = \left(I_1 \times \frac{137}{51}\right) - \frac{27\,925}{8}$$
     * Si $R \ge 35\,000\text{ DA}$ :
       $$\text{IRG}_{\text{Final}} = I_1$$
   * **Cas Particulier (Travailleur Handicapé, Moudjahid, Grand Invalide, Retraité) :**
     * Si $30\,000 < R < 42\,500\text{ DA}$ :
       $$\text{IRG}_{\text{Final}} = \left(I_1 \times \frac{93}{61}\right) - \frac{81\,213}{41}$$
     * Si $R \ge 42\,500\text{ DA}$ :
       $$\text{IRG}_{\text{Final}} = I_1$$
7. **Étape D — Règle d'Arrondi Officielle DGI (Au dixième de dinar `,X0`) :**
   Conformément au document officiel `TABLE_IRG_2022.pdf`, l'IRG mensuel retenu est arrondi au **dixième de dinar le plus proche** (1 chiffre après la virgule suivi d'un zéro) :
   $$\text{IRG Retenu} = \frac{\text{Math.round}(\text{IRG}_{\text{Final}} \times 10)}{10}$$
   *Tests de contrôle obligatoires issus du PDF DGI :*
   * $R = 30\,000,00\text{ DA} \implies \text{IRG Général} = \mathbf{0,00\text{ DA}}$ | $\text{IRG Particulier} = \mathbf{0,00\text{ DA}}$.
   * $R = 30\,010,00\text{ DA} \implies \text{IRG Général} = \mathbf{7,70\text{ DA}}$ ($\text{Net après IRG} = 30\,002,30$) | $\text{IRG Particulier} = \mathbf{4,70\text{ DA}}$.
   * $R = 30\,870,00\text{ DA} \implies \text{IRG Général} = \mathbf{538,90\text{ DA}}$ | $\text{IRG Particulier} = \mathbf{306,20\text{ DA}}$.
   * $R = 35\,000,00\text{ DA} \implies \text{IRG Général} = \mathbf{2\,070,00\text{ DA}}$ | $\text{IRG Particulier} = \mathbf{1\,175,10\text{ DA}}$.
   * $R = 42\,500,00\text{ DA} \implies \text{IRG Général} = \mathbf{3\,775,00\text{ DA}}$ | $\text{IRG Particulier} = \mathbf{3\,775,00\text{ DA}}$.

### 2.5. Calcul du Salaire Net à Payer
$$\text{Salaire Brut Total} = \text{Salaire de Poste} + \text{Panier} + \text{Transport} + \text{Primes Non-Cotisables} + \text{Allocations Familiales}$$
$$\text{Total Retenues} = \text{CNAS Salariale (9\%)} + \text{IRG Retenu} + \text{Avances \& Acomptes} + \text{Retenues Sanctions}$$
$$\text{NET À PAYER} = \text{round2}(\text{Salaire Brut Total} - \text{Total Retenues})$$
*(Le Net à Payer est conservé au centime exact `,XX DA`, exactement comme dans la colonne `Mensuel NET` de la table officielle DGI).*

---

## 3. CHARTE VISUELLE & DESIGN SYSTEM ("FINTECH ALABASTER")

Interdiction formelle d'utiliser un style "SaaS générique" (ombres portées floues, dégradés violets/bleus, grosses bordures arrondies `rounded-2xl`, texte centré dans les tableaux).

### 3.1. Tokens de Couleurs (Tailwind CSS v4 — `globals.css`)
* **Fond Global (`--bg-canvas`) :** `#F8F7F4` (Pierre chaude / Albâtre très doux pour l'application et la barre latérale).
* **Surface Grille & Cartes (`--bg-surface`) :** `#FFFFFF` (Blanc pur uniquement pour les zones de travail actives).
* **En-têtes & Cellules Calculées (`--bg-subtle`) :** `#F2F0EC` (Gris-sable très léger indiquant visuellement qu'une colonne est calculée automatiquement et non modifiable).
* **Ligne Survolée / Active (`--bg-row-hover`) :** `#F1F5F9` / Sélectionnée : `#EEF2FF`.
* **Bordures Hairline (`--border-subtle`) :** `#E6E4DD` (`1px solid` partout, net et précis).
* **Bordure Focus Clavier (`--border-focus`) :** `#0D3B2E` (`1.5px solid` avec `ring-2 ring-[#0D3B2E]/15`).
* **Texte Primaire (`--text-primary`) :** `#111315` (Noir carbone profond).
* **Texte Secondaire (`--text-secondary`) :** `#5A6065` (En-têtes de colonnes, labels).
* **Texte Muet (`--text-muted`) :** `#94A3B8` (Unités `DA`, `h`, et tirets de valeur nulle `—`).
* **Accent Primaire Fintech (`--accent-primary`) :** `#0D3B2E` (Vert Émeraude Institutionnel profond pour les boutons d'action principaux et validations).
* **Statuts Sémantiques :**
  * Succès / Validé : Texte `#065F46`, Fond `#D1FAE5`, Bordure `#A7F3D0`.
  * Alerte / Écart : Texte `#92400E`, Fond `#FEF3C7`, Bordure `#FDE68A`.
  * Danger / Infraction Loi 90-11 : Texte `#991B1B`, Fond `#FEE2E2`, Bordure `#FECACA`.

### 3.2. Discipline Typographique & Chiffres Tabulaires
1. **Polices :** `Inter` (ou `Plus Jakarta Sans`) pour l'interface ; `Geist Mono` (ou `JetBrains Mono` sans zéro barré) pour les montants, matricules et heures.
2. **Classe Utilitaire Obligatoire `.num-fintech` :**
   Tous les montants en Dinars (`DA`), pourcentages, matricules (`M001`) et volumes horaires (`173,33h`) DOIVENT utiliser :
   ```css
   .num-fintech {
     font-variant-numeric: tabular-nums lining-nums;
     font-feature-settings: "tnum" 1, "lnum" 1, "zero" 0;
     text-align: right;
     letter-spacing: -0.015em;
   }