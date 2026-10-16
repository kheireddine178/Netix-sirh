/**
 * NETIX SIRH 2.0 — MOTEUR DE PAIE ALGÉRIENNE OFFICIEL (SANCTUAIRE LÉGAL)
 * 
 * Fichier autonome, synchrone et zéro-dépendance.
 * Conforme Loi 90-11 (Relations de travail), Loi 83-11 (Assurances sociales),
 * Ordonnance 95-01 (Assiette CNAS), et Barème Officiel DGI 2022 (CIDTA Art. 104).
 */

// ============================================================================
// 1. CONSTANTES LÉGALES & PARAMÈTRES RÉGLEMENTAIRES
// ============================================================================

/** Volume mensuel horaire légal en Algérie (40h/semaine * 52 / 12) */
export const BASE_HORAIRE_LEGALE = 173.33;

/** Jours ouvrables mensuels standards pour la proratisation du panier */
export const JOURS_OUVRABLES_STANDARD = 22;

/** Taux de cotisation CNAS salariale déduite du bulletin (9%) */
export const TAUX_CNAS_SALARIAL = 0.09;

/** Taux de cotisation CNAS patronale à la charge de l'employeur (25%) */
export const TAUX_CNAS_PATRONAL = 0.25;

/** Quote-part Fonds des Œuvres Sociales versée via la DAC (0,5%) */
export const TAUX_CNAS_OEUVRES_SOCIALES = 0.005;

/** Total de l'enveloppe globale DAC CNAS (34,5%) */
export const TAUX_CNAS_TOTAL_DAC = 0.345;

/** Seuil mensuel d'exonération totale de l'IRG */
export const SEUIL_EXONERATION_IRG = 30000;

/** Tranches progressives mensuelles de l'IRG (CIDTA Art. 104 / LF 2022) */
export const TRANCHES_IRG_2022: ReadonlyArray<{
  readonly min: number;
  readonly max: number;
  readonly taux: number;
}> = [
  { min: 0, max: 20000, taux: 0.0 },
  { min: 20000, max: 40000, taux: 0.23 },
  { min: 40000, max: 80000, taux: 0.27 },
  { min: 80000, max: 160000, taux: 0.30 },
  { min: 160000, max: 320000, taux: 0.33 },
  { min: 320000, max: Infinity, taux: 0.35 },
];

export type RegimeIRG = 'general' | 'particulier';

// ============================================================================
// 2. UTILITAIRES D'ARRONDI & FORMATAGE
// ============================================================================

/** Arrondi au centime exact (2 décimales) pour montants monétaires */
export function round2(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/** Arrondi au dixième (1 décimale) réglementaire DGI pour l'IRG */
export function round1(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

// ============================================================================
// 3. BASE HORAIRE, ABSENCES ET HEURES SUPPLÉMENTAIRES (LOI 90-11)
// ============================================================================

/**
 * Calcule le taux horaire légal basé sur 173,33h
 */
export function calculerTauxHoraire(salaireBase: number): number {
  if (salaireBase <= 0) return 0;
  return salaireBase / BASE_HORAIRE_LEGALE;
}

/**
 * Calcule la retenue sur salaire de base pour absence
 */
export function calculerRetenueAbsence(heuresAbsence: number, salaireBase: number): number {
  if (heuresAbsence <= 0 || salaireBase <= 0) return 0;
  const tauxHoraire = calculerTauxHoraire(salaireBase);
  return round2(heuresAbsence * tauxHoraire);
}

/**
 * Calcule les majorations pour heures supplémentaires
 * - HS 50% (P1)  : taux horaire x 1,50
 * - HS 75% (P2)  : taux horaire x 1,75
 * - HS 100% (P3) : taux horaire x 2,00
 */
export function calculerHeuresSupplementaires(
  tauxHoraire: number,
  hs50: number = 0,
  hs75: number = 0,
  hs100: number = 0
): {
  montantHs50: number;
  montantHs75: number;
  montantHs100: number;
  totalHeuresSup: number;
} {
  const montantHs50 = round2(Math.max(0, hs50) * tauxHoraire * 1.5);
  const montantHs75 = round2(Math.max(0, hs75) * tauxHoraire * 1.75);
  const montantHs100 = round2(Math.max(0, hs100) * tauxHoraire * 2.0);
  const totalHeuresSup = round2(montantHs50 + montantHs75 + montantHs100);

  return { montantHs50, montantHs75, montantHs100, totalHeuresSup };
}

// ============================================================================
// 4. PRORATISATION AUTOMATIQUE DU TRANSPORT ET DU PANIER (RÈGLE ENTREPRISE)
// ============================================================================

/**
 * Calcule l'indemnité de transport proratisée sur le volume horaire légal de 173,33h
 * Transport = round2( T_forfait * (173,33 - Heures_Absence) / 173,33 )
 */
export function calculerTransportProratise(
  forfaitTransport: number,
  heuresAbsence: number = 0
): number {
  if (forfaitTransport <= 0) return 0;
  const heuresTravaillees = Math.max(0, BASE_HORAIRE_LEGALE - Math.max(0, heuresAbsence));
  return round2(forfaitTransport * (heuresTravaillees / BASE_HORAIRE_LEGALE));
}

/**
 * Calcule la prime de panier proratisée sur 22 jours ouvrables
 * - Jours absence équivalents = Heures absence / (173,33 / 22)
 * - Jours travaillés = max(0, 22 - Jours absence équivalents)
 * - Panier = round2( Jours travaillés * Taux unitaire panier )
 */
export function calculerPanierProratise(
  tauxUnitairePanier: number,
  heuresAbsence: number = 0,
  joursOuvrablesBase: number = JOURS_OUVRABLES_STANDARD
): {
  joursTravaillesPanier: number;
  montantPanier: number;
} {
  if (tauxUnitairePanier <= 0) {
    return { joursTravaillesPanier: 0, montantPanier: 0 };
  }
  const heuresParJour = BASE_HORAIRE_LEGALE / joursOuvrablesBase;
  const joursAbsenceEquiv = Math.max(0, heuresAbsence) / heuresParJour;
  const joursTravaillesPanier = Math.max(0, joursOuvrablesBase - joursAbsenceEquiv);
  const montantPanier = round2(joursTravaillesPanier * tauxUnitairePanier);

  return {
    joursTravaillesPanier: round2(joursTravaillesPanier),
    montantPanier,
  };
}

// ============================================================================
// 5. ASSIETTE CNAS & VENTILATION 34,5% (LOI 83-11 & ORDONNANCE 95-01)
// ============================================================================

export interface CotisationsCNAS {
  salaireDePoste: number;
  cnasSalariale: number;
  cnasPatronale: number;
  cnasOeuvresSociales: number;
  totalDAC: number;
}

/**
 * Calcule l'assiette cotisable CNAS (Salaire de Poste) et la décomposition officielle à 34,5%
 * Note légale : Panier et Transport sont EXCLUS de l'assiette CNAS (Ord. 95-01 Art. 1)
 */
export function calculerCotisationsCNAS(
  salaireBase: number,
  retenueAbsence: number,
  totalHeuresSup: number,
  totalPrimesCotisables: number = 0
): CotisationsCNAS {
  const baseReelle = Math.max(0, salaireBase - retenueAbsence);
  const salaireDePoste = round2(baseReelle + totalHeuresSup + Math.max(0, totalPrimesCotisables));

  const cnasSalariale = round2(salaireDePoste * TAUX_CNAS_SALARIAL);
  const cnasPatronale = round2(salaireDePoste * TAUX_CNAS_PATRONAL);
  const cnasOeuvresSociales = round2(salaireDePoste * TAUX_CNAS_OEUVRES_SOCIALES);
  const totalDAC = round2(cnasSalariale + cnasPatronale + cnasOeuvresSociales);

  return {
    salaireDePoste,
    cnasSalariale,
    cnasPatronale,
    cnasOeuvresSociales,
    totalDAC,
  };
}

// ============================================================================
// 6. ALGORITHME EXACT DE L'IRG SALAIRES (CIDTA ART. 104 & BAREME DGI 2022)
// ============================================================================

export interface DetailCalculIRG {
  baseBrute: number;
  rTronque: number;
  irgBrut: number;
  abattement40: number;
  i1: number;
  irgFinal: number;
  irgRetenu: number;
  regime: RegimeIRG;
}

/**
 * Reproduit à la décimale exacte le barème officiel de la Direction Générale des Impôts (DGI 2022).
 * Formule analytique exacte avec abattement dégressif 137/51 (général) ou 93/61 (particulier).
 * 
 * @param baseIrg Montant brut de l'assiette imposable
 * @param regime 'general' (défaut) ou 'particulier' (handicapé, moudjahid, grand invalide, retraité)
 */
export function calculerIRGDGI(
  baseIrg: number,
  regime: RegimeIRG = 'general'
): DetailCalculIRG {
  if (baseIrg <= 0) {
    return {
      baseBrute: 0,
      rTronque: 0,
      irgBrut: 0,
      abattement40: 0,
      i1: 0,
      irgFinal: 0,
      irgRetenu: 0,
      regime,
    };
  }

  // 1. Troncature réglementaire DGI à la dizaine inférieure
  const rTronque = Math.floor(baseIrg / 10) * 10;

  // 2. Seuil d'exonération totale (R <= 30 000 DA)
  if (rTronque <= SEUIL_EXONERATION_IRG) {
    return {
      baseBrute: baseIrg,
      rTronque,
      irgBrut: 0,
      abattement40: 0,
      i1: 0,
      irgFinal: 0,
      irgRetenu: 0,
      regime,
    };
  }

  // 3. Étape A — Calcul progressif par tranches sur R tronqué
  let irgBrut = 0;
  for (const tranche of TRANCHES_IRG_2022) {
    if (rTronque > tranche.min) {
      const assietteTranche = Math.min(rTronque, tranche.max) - tranche.min;
      irgBrut += assietteTranche * tranche.taux;
    }
  }

  // 4. Étape B — 1er Abattement légal de 40% (plafonné entre 1 000 DA et 1 500 DA)
  const abattementBrut = irgBrut * 0.40;
  const abattement40 = Math.min(1500, Math.max(1000, abattementBrut));
  const i1 = Math.max(0, irgBrut - abattement40);

  // 5. Étape C — 2e Abattement Dégressif
  let irgFinal = i1;
  if (regime === 'general') {
    if (rTronque > 30000 && rTronque < 35000) {
      irgFinal = (i1 * 137 / 51) - (27925 / 8);
    }
  } else {
    // Cas Particulier (Handicapé, Moudjahid, Grand Invalide, etc.)
    if (rTronque > 30000 && rTronque < 42500) {
      irgFinal = (i1 * 93 / 61) - (81213 / 41);
    }
  }

  // Protection contre valeurs négatives
  if (irgFinal < 0) {
    irgFinal = 0;
  }

  // 6. Étape D — Règle officielle d'arrondi DGI au dixième de dinar (,X0)
  const irgRetenu = round1(irgFinal);

  return {
    baseBrute: baseIrg,
    rTronque,
    irgBrut: round2(irgBrut),
    abattement40: round2(abattement40),
    i1: round2(i1),
    irgFinal,
    irgRetenu,
    regime,
  };
}

// ============================================================================
// 7. MOTEUR DE BULLETIN COMPLET & SALAIRE NET À PAYER
// ============================================================================

export interface SaisieLignePaie {
  salaireBase: number;
  heuresAbsence?: number;
  hs50?: number;
  hs75?: number;
  hs100?: number;
  primesCotisables?: number; // IEP, PRI, Nuisance, etc.
  forfaitTransport?: number; // Montant mensuel standard avant absence
  transportForce?: number; // Valeur manuelle pour forcer
  tauxUnitairePanier?: number; // Par jour ouvrable (ex: 300 DA)
  panierForce?: number; // Montant manuel pour forcer
  primesNonCotisablesImposables?: number; // Autres primes imposables hors transport/panier
  primesNonCotisablesNonImposables?: number; // Allocations familiales, etc.
  avancesAcomptes?: number;
  autresRetenues?: number; // Sanctions, prêts, etc.
  regimeIrg?: RegimeIRG;
}

export interface ResultatBulletinPaie {
  salaireBase: number;
  tauxHoraire: number;
  heuresAbsence: number;
  heuresTravaillees: number;
  retenueAbsence: number;
  
  // Heures supplémentaires
  montantHs50: number;
  montantHs75: number;
  montantHs100: number;
  totalHeuresSup: number;

  // Assiette cotisable et CNAS
  primesCotisables: number;
  salaireDePoste: number;
  cnasSalariale: number;
  cnasPatronale: number;
  cnasOeuvresSociales: number;
  totalDAC: number;

  // Primes et indemnités
  montantTransport: number;
  montantPanier: number;
  joursTravaillesPanier: number;
  primesNonCotisablesImposables: number;
  primesNonCotisablesNonImposables: number;
  salaireBrutTotal: number;

  // IRG
  baseIrg: number;
  rTronqueIrg: number;
  irgRetenu: number;
  regimeIrg: RegimeIRG;
  detailIrg: DetailCalculIRG;

  // Retenues & Net
  avancesAcomptes: number;
  autresRetenues: number;
  totalRetenues: number;
  netAPayer: number;

  // Coût total employeur
  coutTotalEmployeur: number;
}

/**
 * Calcule l'intégralité d'un bulletin de paie algérien selon toutes les règles légales et entreprise
 */
export function calculerBulletinComplet(saisie: SaisieLignePaie): ResultatBulletinPaie {
  const salaireBase = Math.max(0, saisie.salaireBase || 0);
  const heuresAbsence = Math.max(0, saisie.heuresAbsence || 0);
  const tauxHoraire = calculerTauxHoraire(salaireBase);
  const heuresTravaillees = Math.max(0, round2(BASE_HORAIRE_LEGALE - heuresAbsence));
  const retenueAbsence = calculerRetenueAbsence(heuresAbsence, salaireBase);

  // Heures supplémentaires
  const hs = calculerHeuresSupplementaires(
    tauxHoraire,
    saisie.hs50 || 0,
    saisie.hs75 || 0,
    saisie.hs100 || 0
  );

  const primesCotisables = Math.max(0, saisie.primesCotisables || 0);

  // Cotisations CNAS
  const cnas = calculerCotisationsCNAS(
    salaireBase,
    retenueAbsence,
    hs.totalHeuresSup,
    primesCotisables
  );

  // Transport & Panier (proratisés ou forcés)
  let montantTransport = 0;
  if (saisie.transportForce !== undefined && saisie.transportForce !== null) {
    montantTransport = Math.max(0, saisie.transportForce);
  } else if (saisie.forfaitTransport) {
    montantTransport = calculerTransportProratise(saisie.forfaitTransport, heuresAbsence);
  }

  let montantPanier = 0;
  let joursTravaillesPanier = 0;
  if (saisie.panierForce !== undefined && saisie.panierForce !== null) {
    montantPanier = Math.max(0, saisie.panierForce);
    joursTravaillesPanier = saisie.tauxUnitairePanier && saisie.tauxUnitairePanier > 0
      ? round2(montantPanier / saisie.tauxUnitairePanier)
      : JOURS_OUVRABLES_STANDARD;
  } else if (saisie.tauxUnitairePanier) {
    const resPanier = calculerPanierProratise(saisie.tauxUnitairePanier, heuresAbsence);
    montantPanier = resPanier.montantPanier;
    joursTravaillesPanier = resPanier.joursTravaillesPanier;
  }

  const primesNonCotisablesImposables = Math.max(0, saisie.primesNonCotisablesImposables || 0);
  const primesNonCotisablesNonImposables = Math.max(0, saisie.primesNonCotisablesNonImposables || 0);

  // Salaire Brut Total
  const salaireBrutTotal = round2(
    cnas.salaireDePoste +
    montantPanier +
    montantTransport +
    primesNonCotisablesImposables +
    primesNonCotisablesNonImposables
  );

  // Assiette IRG : (Salaire de Poste - CNAS 9%) + Panier + Transport + Autres Primes Non Cotisables Imposables
  const baseIrg = round2(
    (cnas.salaireDePoste - cnas.cnasSalariale) +
    montantPanier +
    montantTransport +
    primesNonCotisablesImposables
  );

  // Calcul IRG officiel DGI 2022
  const regimeIrg = saisie.regimeIrg || 'general';
  const detailIrg = calculerIRGDGI(baseIrg, regimeIrg);
  const irgRetenu = detailIrg.irgRetenu;

  // Retenues
  const avancesAcomptes = Math.max(0, saisie.avancesAcomptes || 0);
  const autresRetenues = Math.max(0, saisie.autresRetenues || 0);
  const totalRetenues = round2(cnas.cnasSalariale + irgRetenu + avancesAcomptes + autresRetenues);

  // Net à Payer (conservé au centime exact ,XX DA)
  const netAPayer = round2(salaireBrutTotal - totalRetenues);

  // Coût total employeur
  const coutTotalEmployeur = round2(
    salaireBrutTotal + cnas.cnasPatronale + cnas.cnasOeuvresSociales
  );

  return {
    salaireBase,
    tauxHoraire: round2(tauxHoraire),
    heuresAbsence,
    heuresTravaillees,
    retenueAbsence,

    montantHs50: hs.montantHs50,
    montantHs75: hs.montantHs75,
    montantHs100: hs.montantHs100,
    totalHeuresSup: hs.totalHeuresSup,

    primesCotisables,
    salaireDePoste: cnas.salaireDePoste,
    cnasSalariale: cnas.cnasSalariale,
    cnasPatronale: cnas.cnasPatronale,
    cnasOeuvresSociales: cnas.cnasOeuvresSociales,
    totalDAC: cnas.totalDAC,

    montantTransport,
    montantPanier,
    joursTravaillesPanier,
    primesNonCotisablesImposables,
    primesNonCotisablesNonImposables,
    salaireBrutTotal,

    baseIrg,
    rTronqueIrg: detailIrg.rTronque,
    irgRetenu,
    regimeIrg,
    detailIrg,

    avancesAcomptes,
    autresRetenues,
    totalRetenues,
    netAPayer,

    coutTotalEmployeur,
  };
}
