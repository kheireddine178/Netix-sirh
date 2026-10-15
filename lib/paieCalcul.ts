/**
 * Module de calcul de paie algérienne — portage TypeScript de paie_calcul.py
 *
 * Cascade de calcul (identique à la version Python d'origine) :
 *   1. Salaire de base réel = taux horaire x heures travaillées
 *   2. Heures supplémentaires (3 paliers de majoration) sur le taux horaire
 *   3. Primes en % calculées sur le salaire de base RÉEL
 *   4. Total des gains = salaire de base réel + heures sup + ICR + primes % + panier + prime fixe
 *   5. Base CNAS = total gains - panier (hors assiette cotisable)
 *   6. Retenue CNAS salariale = base CNAS x taux CNAS salarié (9%)
 *   7. Base imposable IRG = total gains - retenue CNAS salariale
 *   8. IRG brut = barème progressif par tranches mensuelles
 *   9. Abattement IRG = 40% x IRG brut, plafonné entre min et max
 *   10. Retenue IRG nette = IRG brut - abattement (jamais négative)
 *   11. Total retenues = CNAS + IRG net + cotis. mutuelle + autres retenues
 *   12. Net à payer = total gains - total retenues
 *   13. Coût total employeur = total gains + (base CNAS x taux CNAS patronal 26%)
 */

import { irgNetZoneTransition } from "./baremeIrgTransition";

// ------------------------------------------------------------------
// Classification des rubriques dynamiques (catalogue Hydrocanal, 402 lignes)
// ------------------------------------------------------------------

export const CODES_GERES_NATIVEMENT = new Set([
  "R001", "R005", "R006", "R010", "R015", "R020", "R024", "R026",
  "R030", "M030", "T030",
  "R112", "R122", "R125", "X112", "X122", "X125",
  "R061", "R065", "R066", "R067", "R068", "R069", "R070", "R071", "R072",
  "R200", "R201",
  "R500", "R504", "B504", "X504",
  "R510", "P510",
  "R515", "P515",
  "R646", "B646",
  "R650", "R651", "R652", "R655", "R656",
  "R660", "T660", "M660", "R665",
  "R763", "R765", "R767", "R770",
  "R790", "R791", "I791",
  "R798",
  "R800", "R801", "R802", "R804", "R805", "R806", "R807",
  "R810", "R811", "R812", "R813", "R815", "R819", "R822", "R824",
  "R900", "R910", "R911", "R912", "R913",
]);

// Catégorie A : % d'une base (base_code = null => salaire de base réel standard)
export const RUBRIQUES_POURCENTAGE: Record<string, string | null> = {
  R274: null, R276: null, R278: null, R280: null, R282: null,
  R286: null, R288: null, R290: null, R292: null, R294: null,
  R296: null, R298: null, R300: null, R302: null, R304: null,
  R306: null, R307: null, R318: null, R320: null,
  R722: "salaire_base_plus_sujetion", // base = R030 + R252
  P318: null, P320: null,
};

// Catégorie B : nombre x taux/forfait unitaire
export const RUBRIQUES_NOMBRE_X_TAUX = new Set([
  "R522", "R523", "R524", "R525", "R526", "R528", "R543", "R545",
]);

// Catégorie C, proratisées selon les heures d'absence (comme le salaire de base)
export const RUBRIQUES_MONTANT_FIXE_PRORATISE = new Set([
  "R252", "R254", "R256", "R257", "R258", "R259", "R260", "R262", "R264",
]);

export type CategorieRubrique =
  | "pourcentage"
  | "nombre_x_taux"
  | "montant_fixe"
  | "regularisation";

/** Détermine la catégorie de saisie pour un code du catalogue (R*, M* ou T*). */
export function categorieRubrique(code: string): CategorieRubrique {
  if (code.startsWith("M") || code.startsWith("T")) return "regularisation";
  if (code in RUBRIQUES_POURCENTAGE) return "pourcentage";
  if (RUBRIQUES_NOMBRE_X_TAUX.has(code)) return "nombre_x_taux";
  return "montant_fixe";
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface Parametres {
  snmg: number;
  duree_legale_mensuelle: number;
  taux_cnas_salarie: number;
  taux_cnas_employeur: number;

  majoration_hs_1: number;
  majoration_hs_2: number;
  majoration_hs_3: number;

  /** [tranche_de, tranche_a | null, taux][] */
  bareme_irg: [number, number | null, number][];

  seuil_exoneration_irg: number;
  taux_abattement_irg: number;
  abattement_irg_min: number;
  abattement_irg_max: number;

  // Informations employeur, utilisées sur le bulletin PDF (étape 6). Optionnelles :
  // si absentes des paramètres Supabase, le PDF affiche des espaces réservés neutres.
  employeur_nom?: string;
  employeur_adresse?: string;
  employeur_nif?: string;
  employeur_nis?: string;
  employeur_affiliation_cnas?: string;
}

export const PARAMETRES_PAR_DEFAUT: Parametres = {
  snmg: 24000.0,
  duree_legale_mensuelle: 173.33,
  taux_cnas_salarie: 0.09,
  taux_cnas_employeur: 0.26,
  majoration_hs_1: 1.5,
  majoration_hs_2: 1.75,
  majoration_hs_3: 2.0,
  bareme_irg: [
    [0, 20000, 0.0],
    [20000, 40000, 0.23],
    [40000, 80000, 0.27],
    [80000, 160000, 0.3],
    [160000, 320000, 0.33],
    [320000, null, 0.35],
  ],
  seuil_exoneration_irg: 30000.0,
  taux_abattement_irg: 0.4,
  abattement_irg_min: 1000.0,
  abattement_irg_max: 1500.0,
};

export interface LigneRubriqueDynamique {
  code: string;
  libelle: string;
  montant: number; // toujours positif (que ce soit un gain ou une retenue)
  type_valeur: "Gain (+)" | "Retenue (-)";
  cotisable_cnas: boolean;
  imposable: "irg" | "dix_pct" | "non_imposable";
}

export interface SaisieMensuelle {
  salaire_base_theorique: number;

  maladie_h: number;
  mise_a_pied_h: number;
  accident_travail_h: number;
  retard_h: number;
  absence_irreguliere_h: number;

  heures_sup_1: number;
  heures_sup_2: number;
  heures_sup_3: number;

  icr: number;
  taux_iep: number;
  taux_nuisance: number;
  taux_responsabilite: number;
  taux_disponibilite: number;
  taux_pri: number;
  taux_prc: number;
  panier_jours: number;
  panier_forfait_jour: number;
  autre_prime_fixe: number;

  cotis_mutuelle: number;
  autres_retenues: number;

  rubriques_dynamiques: LigneRubriqueDynamique[];
}

export const SAISIE_VIDE: SaisieMensuelle = {
  salaire_base_theorique: 0,
  maladie_h: 0,
  mise_a_pied_h: 0,
  accident_travail_h: 0,
  retard_h: 0,
  absence_irreguliere_h: 0,
  heures_sup_1: 0,
  heures_sup_2: 0,
  heures_sup_3: 0,
  icr: 0,
  taux_iep: 0,
  taux_nuisance: 0,
  taux_responsabilite: 0,
  taux_disponibilite: 0,
  taux_pri: 0,
  taux_prc: 0,
  panier_jours: 0,
  panier_forfait_jour: 0,
  autre_prime_fixe: 0,
  cotis_mutuelle: 0,
  autres_retenues: 0,
  rubriques_dynamiques: [],
};

export interface DetailRubrique {
  code: string;
  libelle: string;
  montant: number;
  sens: "gain" | "retenue";
}

export interface ResultatPaie {
  total_heures_absence: number;
  heures_travaillees: number;
  taux_horaire: number;
  salaire_base_reel: number;
  total_heures_sup_da: number;
  prime_iep: number;
  prime_nuisance: number;
  prime_responsabilite: number;
  prime_disponibilite: number;
  prime_pri: number;
  prime_prc: number;
  total_rubriques_gains_da: number;
  total_rubriques_retenues_da: number;
  total_gains: number;
  base_cnas: number;
  retenue_cnas: number;
  base_imposable_irg: number;
  base_imposable_10pct: number;
  retenue_10pct: number;
  irg_brut: number;
  abattement_irg: number;
  retenue_irg_nette: number;
  total_retenues: number;
  net_a_payer: number;
  cout_total_employeur: number;
  detail_rubriques: DetailRubrique[];
}

// ------------------------------------------------------------------
// Calcul
// ------------------------------------------------------------------

/**
 * Calcule le salaire de base réel (après déduction des absences), le taux horaire et les
 * heures travaillées — reprend exactement les étapes 1 de calculerPaie() ci-dessous, en
 * lecture seule (aucune modification de la logique de calcul existante). Utile pour établir
 * la "base" des rubriques dynamiques de catégorie "pourcentage" (étape 7) AVANT l'appel
 * complet à calculerPaie(), puisque leur montant doit être injecté dans
 * saisie.rubriques_dynamiques en amont.
 */
export function calculerBaseAvantRubriques(
  saisie: Pick<
    SaisieMensuelle,
    "salaire_base_theorique" | "maladie_h" | "mise_a_pied_h" | "accident_travail_h" | "retard_h" | "absence_irreguliere_h"
  >,
  params: Parametres,
): { heures_travaillees: number; taux_horaire: number; salaire_base_reel: number } {
  const total_heures_absence =
    saisie.maladie_h + saisie.mise_a_pied_h + saisie.accident_travail_h
    + saisie.retard_h + saisie.absence_irreguliere_h;

  const heures_travaillees = Math.max(params.duree_legale_mensuelle - total_heures_absence, 0.0);
  const taux_horaire = params.duree_legale_mensuelle
    ? saisie.salaire_base_theorique / params.duree_legale_mensuelle
    : 0.0;
  const salaire_base_reel = taux_horaire * heures_travaillees;

  return { heures_travaillees, taux_horaire, salaire_base_reel };
}

/** IRG brut par tranches mensuelles. 0 si la base est sous le seuil d'exonération. */
export function calculerIrgBrut(baseImposable: number, params: Parametres): number {
  if (baseImposable <= params.seuil_exoneration_irg) return 0.0;

  let irg = 0.0;
  for (const [trancheDe, trancheA, taux] of params.bareme_irg) {
    let montantDansTranche: number;
    if (trancheA === null) {
      montantDansTranche = Math.max(0.0, baseImposable - trancheDe);
    } else {
      montantDansTranche = Math.max(0.0, Math.min(baseImposable, trancheA) - trancheDe);
    }
    irg += montantDansTranche * taux;
  }
  return irg;
}

export function calculerPaie(saisie: SaisieMensuelle, params: Parametres): ResultatPaie {
  // 1. Absences -> salaire de base réel
  const total_heures_absence =
    saisie.maladie_h + saisie.mise_a_pied_h + saisie.accident_travail_h
    + saisie.retard_h + saisie.absence_irreguliere_h;

  const heures_travaillees = Math.max(params.duree_legale_mensuelle - total_heures_absence, 0.0);
  const taux_horaire = params.duree_legale_mensuelle
    ? saisie.salaire_base_theorique / params.duree_legale_mensuelle
    : 0.0;
  const salaire_base_reel = taux_horaire * heures_travaillees;

  // 2. Heures supplémentaires
  const total_heures_sup_da =
    saisie.heures_sup_1 * taux_horaire * params.majoration_hs_1
    + saisie.heures_sup_2 * taux_horaire * params.majoration_hs_2
    + saisie.heures_sup_3 * taux_horaire * params.majoration_hs_3;

  // 3. Primes historiques V1 (% du salaire de base réel) + panier + fixes
  const panier = saisie.panier_jours * saisie.panier_forfait_jour;
  // Arrondi à 2 décimales de chaque prime en %, AVANT sommation, pour que le
  // total corresponde exactement à la somme des lignes affichées sur le
  // bulletin (comme sur un bulletin réel/papier). En cas d'égalité exacte à
  // 0,005 (ex: 25253 x 2,5% = 631,325), on arrondit vers le BAS (631,32),
  // conformément à un bulletin réel constaté (I.E.P = 631,32, pas 631,33).
  // Le epsilon (1e-9) compense le bruit de virgule flottante : un calcul
  // mathématiquement exact comme 25253 x 0,025 peut être stocké en mémoire
  // sous la forme 631,3250000000002 (au lieu de 631,325 pile), ce qui
  // fausserait la détection de l'égalité exacte sans cette tolérance.
  const arrondi2 = (v: number) => Math.ceil(v * 100 - 0.5 - 1e-9) / 100;

  const prime_iep = arrondi2(salaire_base_reel * saisie.taux_iep);
  const prime_nuisance = arrondi2(salaire_base_reel * saisie.taux_nuisance);
  const prime_responsabilite = arrondi2(salaire_base_reel * saisie.taux_responsabilite);
  const prime_disponibilite = arrondi2(salaire_base_reel * saisie.taux_disponibilite);
  const prime_pri = arrondi2(salaire_base_reel * saisie.taux_pri);
  const prime_prc = arrondi2(salaire_base_reel * saisie.taux_prc);

  const total_primes_v1 =
    saisie.icr
    + prime_iep
    + prime_nuisance
    + prime_responsabilite
    + prime_disponibilite
    + prime_pri
    + prime_prc
    + panier
    + saisie.autre_prime_fixe;

  // Les éléments V1 cotisables CNAS sont tout sauf le panier (Ord. n°95-01, Art. 1)
  const total_primes_v1_cotisable = total_primes_v1 - panier;
  // CORRECTION : le panier est NON cotisable CNAS mais IMPOSABLE IRG (CIDTA Art. 68)
  const total_primes_v1_imposable_irg = total_primes_v1; // panier inclus → imposable IRG

  // 4. Rubriques dynamiques du catalogue Hydrocanal
  let total_rub_gains = 0.0;
  let total_rub_retenues = 0.0;
  let rub_gains_cotisables = 0.0;
  let rub_gains_imposable_irg = 0.0;
  let rub_gains_imposable_10pct = 0.0;
  const detail_rubriques: DetailRubrique[] = [];

  for (const lr of saisie.rubriques_dynamiques) {
    const montant = lr.montant || 0.0;
    if (montant === 0) continue;

    if (lr.type_valeur === "Retenue (-)") {
      total_rub_retenues += montant;
      detail_rubriques.push({ code: lr.code, libelle: lr.libelle, montant, sens: "retenue" });
    } else {
      total_rub_gains += montant;
      if (lr.cotisable_cnas) {
        rub_gains_cotisables += montant;
      }
      if (lr.imposable === "irg") {
        rub_gains_imposable_irg += montant;
      } else if (lr.imposable === "dix_pct") {
        rub_gains_imposable_10pct += montant;
      }
      detail_rubriques.push({ code: lr.code, libelle: lr.libelle, montant, sens: "gain" });
    }
  }

  // 5. Total des gains
  const total_gains = salaire_base_reel + total_heures_sup_da + total_primes_v1 + total_rub_gains;

  // 6. Base CNAS
  const base_cnas =
    salaire_base_reel + total_heures_sup_da + total_primes_v1_cotisable + rub_gains_cotisables;
  const retenue_cnas = base_cnas * params.taux_cnas_salarie;

  // 7. Base imposable à 10% forfaitaire
  const base_imposable_10pct = rub_gains_imposable_10pct;
  const retenue_10pct = base_imposable_10pct * 0.1;

  // 8. Base imposable IRG
  const base_brute_irg =
    salaire_base_reel + total_heures_sup_da + total_primes_v1_imposable_irg + rub_gains_imposable_irg;
  const base_imposable_irg = Math.max(base_brute_irg - retenue_cnas, 0.0);

  // 9, 10, 11. IRG
  // Règle officielle : la base imposable IRG est arrondie à la dizaine de DA
  // INFÉRIEURE avant application du barème (ex: 51 325,70 -> 51 320). Vérifié
  // sur un bulletin réel où l'écart avec le calcul en continu était de 1,54 DA
  // exactement égal à la fraction de dizaine tronquée x le taux marginal.
  const base_irg_arrondie = Math.floor(base_imposable_irg / 10) * 10;
  const irg_brut = calculerIrgBrut(base_irg_arrondie, params);

  // Zone de lissage officielle (loi de finances 2022) : entre le seuil
  // d'exonération (normalement 30000) et 35000 DA de base imposable, l'IRG
  // net ne suit pas la formule standard (barème - abattement 40%) mais un
  // barème de transition publié par la DGI (voir lib/baremeIrgTransition.ts).
  // Au-delà de 35000, la formule standard est exacte.
  let abattement_irg: number;
  let retenue_irg_nette: number;

  if (
    irg_brut > 0 &&
    base_irg_arrondie > params.seuil_exoneration_irg &&
    base_irg_arrondie < 35000
  ) {
    retenue_irg_nette = irgNetZoneTransition(base_irg_arrondie);
    abattement_irg = Math.max(irg_brut - retenue_irg_nette, 0.0);
  } else {
    abattement_irg =
      irg_brut === 0
        ? 0.0
        : Math.min(
            Math.max(irg_brut * params.taux_abattement_irg, params.abattement_irg_min),
            params.abattement_irg_max,
          );
    retenue_irg_nette = Math.max(irg_brut - abattement_irg, 0.0);
  }

  // Art. 126 CIDTA : "le montant de la retenue à la source est arrondi à la
  // dizaine de Dinars la plus voisine, les fractions inférieures à 5 [centimes]
  // étant négligées et les fractions égales ou supérieures à 5 [centimes]
  // entraînant une perception [au dizaine supérieure]". Exemples officiels :
  // 325,21 -> 325,20 ; 325,55 -> 325,60 ; 325,77 -> 325,80.
  retenue_irg_nette = Math.round(retenue_irg_nette * 10) / 10;

  // 12, 13, 14.
  const total_retenues =
    retenue_cnas + retenue_irg_nette + retenue_10pct
    + saisie.cotis_mutuelle + saisie.autres_retenues + total_rub_retenues;
  const net_a_payer = total_gains - total_retenues;
  const cout_total_employeur = total_gains + base_cnas * params.taux_cnas_employeur;

  return {
    total_heures_absence,
    heures_travaillees,
    taux_horaire,
    salaire_base_reel,
    total_heures_sup_da,
    prime_iep,
    prime_nuisance,
    prime_responsabilite,
    prime_disponibilite,
    prime_pri,
    prime_prc,
    total_rubriques_gains_da: total_rub_gains,
    total_rubriques_retenues_da: total_rub_retenues,
    total_gains,
    base_cnas,
    retenue_cnas,
    base_imposable_irg,
    base_imposable_10pct,
    retenue_10pct,
    irg_brut,
    abattement_irg,
    retenue_irg_nette,
    total_retenues,
    net_a_payer,
    cout_total_employeur,
    detail_rubriques,
  };
}
