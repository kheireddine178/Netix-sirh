"use server";

import { getParametres, Salarie, enforceRapportAccess } from "../salaries/actions";
import {
  calculerPaie,
  calculerBaseAvantRubriques,
  SAISIE_VIDE,
  type LigneRubriqueDynamique,
} from "@/lib/paieCalcul";
import { resoudreLigneRubrique } from "@/lib/rubriquesDynamiques";

export interface LigneCentralisateur {
  code: string;
  libelle: string;
  n_base: number;
  gain: number;
  retenue: number;
  eff: number;
}

export interface ChargePatronaleCentralise {
  code: string;
  libelle: string;
  n_base: number;
  taux: number;
  montant: number;
  eff: number;
}

export interface RecapCentralisateur {
  lignes: LigneCentralisateur[];
  chargesPatronales: ChargePatronaleCentralise[];
  totalGains: number;
  totalRetenues: number;
  netAPayer: number;
  masseSalariale: number;
  nombreSalaries: number;
}

export interface LigneNominative {
  matricule: string | null;
  nom_prenom: string;
  fonction: string | null;
  valeur: number;
}

/**
 * Génère le centralisateur général pour un mois et une année donnés.
 * Récupère tous les bulletins et leurs rubriques, effectue le calcul consolidé
 * et agrège les résultats par code de rubrique.
 */
export async function getCentralisateur(annee: number, mois: number): Promise<RecapCentralisateur> {
  const { supabase } = await enforceRapportAccess();

  const { data: bulletins, error: bError } = await supabase
    .from("bulletins")
    .select("*, salaries(*)")
    .eq("annee", annee)
    .eq("mois", mois);

  if (bError) throw new Error(bError.message);
  if (!bulletins || bulletins.length === 0) {
    return {
      lignes: [],
      chargesPatronales: [],
      totalGains: 0,
      totalRetenues: 0,
      netAPayer: 0,
      masseSalariale: 0,
      nombreSalaries: 0,
    };
  }

  const bulletinIds = bulletins.map((b: any) => b.id);
  const { data: allBulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .in("bulletin_id", bulletinIds);

  const params = await getParametres();
  
  // Agrégateurs de rubriques
  const mapRubriques = new Map<string, { base: number; gain: number; retenue: number; eff: Set<number> }>();
  const addLigneVal = (code: string, base: number, gain: number, retenue: number, salarieId: number) => {
    if (!mapRubriques.has(code)) {
      mapRubriques.set(code, { base: 0, gain: 0, retenue: 0, eff: new Set() });
    }
    const item = mapRubriques.get(code)!;
    item.base += base;
    item.gain += gain;
    item.retenue += retenue;
    item.eff.add(salarieId);
  };

  let totalGainsGlobaux = 0;
  let totalRetenuesGlobaux = 0;
  let totalNetAPayerGlobal = 0;
  let totalBaseCnasGlobal = 0;

  for (const b of bulletins) {
    const salarie = b.salaries;
    if (!salarie) continue;

    const champsAbsences = {
      salaire_base_theorique: b.salaire_base_theorique,
      maladie_h: b.maladie_h,
      mise_a_pied_h: b.mise_a_pied_h,
      accident_travail_h: b.accident_travail_h,
      retard_h: b.retard_h,
      absence_irreguliere_h: b.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    // Charger les rubriques dynamiques de ce bulletin
    const bRubriques = (allBulletinRubriques ?? []).filter((br) => br.bulletin_id === b.id);
    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of bRubriques) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: b.heures_sup_1,
      heures_sup_2: b.heures_sup_2,
      heures_sup_3: b.heures_sup_3,
      icr: b.icr,
      taux_iep: b.taux_iep,
      taux_nuisance: b.taux_nuisance,
      taux_responsabilite: b.taux_responsabilite,
      taux_disponibilite: b.taux_disponibilite,
      taux_pri: b.taux_pri,
      taux_prc: b.taux_prc,
      panier_jours: b.panier_jours,
      panier_forfait_jour: b.panier_forfait_jour,
      autre_prime_fixe: b.autre_prime_fixe,
      cotis_mutuelle: b.cotis_mutuelle,
      autres_retenues: b.autres_retenues,
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, params);
    
    // Agrégation des rubriques natives
    addLigneVal("R030", res.salaire_base_reel, res.salaire_base_reel, 0, salarie.id);
    if (res.total_heures_sup_da > 0) {
      addLigneVal("R120", res.total_heures_sup_da, res.total_heures_sup_da, 0, salarie.id);
    }
    if (saisie.icr > 0) {
      addLigneVal("R100", saisie.icr, saisie.icr, 0, salarie.id);
    }
    if (res.prime_iep > 0) {
      addLigneVal("R110", res.prime_iep, res.prime_iep, 0, salarie.id);
    }
    if (res.prime_nuisance > 0) {
      addLigneVal("R200", res.prime_nuisance, res.prime_nuisance, 0, salarie.id);
    }
    if (res.prime_responsabilite > 0) {
      addLigneVal("R201", res.prime_responsabilite, res.prime_responsabilite, 0, salarie.id);
    }
    if (res.prime_disponibilite > 0) {
      addLigneVal("R202", res.prime_disponibilite, res.prime_disponibilite, 0, salarie.id);
    }
    if (res.prime_pri > 0) {
      addLigneVal("R203", res.prime_pri, res.prime_pri, 0, salarie.id);
    }
    if (res.prime_prc > 0) {
      addLigneVal("R204", res.prime_prc, res.prime_prc, 0, salarie.id);
    }
    if (saisie.panier_jours > 0) {
      addLigneVal("R250", saisie.panier_jours * saisie.panier_forfait_jour, saisie.panier_jours * saisie.panier_forfait_jour, 0, salarie.id);
    }
    if (saisie.autre_prime_fixe > 0) {
      addLigneVal("R260", saisie.autre_prime_fixe, saisie.autre_prime_fixe, 0, salarie.id);
    }

    // Agrégation des rubriques dynamiques
    for (const d of res.detail_rubriques) {
      if (d.sens === "gain") {
        addLigneVal(d.code, d.montant, d.montant, 0, salarie.id);
      } else if (d.sens === "retenue") {
        addLigneVal(d.code, d.montant, 0, d.montant, salarie.id);
      }
    }

    // Retenues obligatoires
    addLigneVal("R950", res.base_cnas, 0, res.retenue_cnas, salarie.id);
    if (res.retenue_irg_nette > 0) {
      addLigneVal("R980", res.base_imposable_irg, 0, res.retenue_irg_nette, salarie.id);
    }
    if (res.retenue_10pct > 0) {
      addLigneVal("R985", res.base_imposable_10pct, 0, res.retenue_10pct, salarie.id);
    }
    if (saisie.cotis_mutuelle > 0) {
      addLigneVal("R995", 0, 0, saisie.cotis_mutuelle, salarie.id);
    }
    if (saisie.autres_retenues > 0) {
      addLigneVal("R999", 0, 0, saisie.autres_retenues, salarie.id);
    }

    totalGainsGlobaux += res.total_gains;
    totalRetenuesGlobaux += res.total_retenues;
    totalNetAPayerGlobal += res.net_a_payer;
    totalBaseCnasGlobal += res.base_cnas;
  }

  // Libellés par défaut des codes
  const LIBELLES_NATIONAUX: Record<string, string> = {
    R030: "Salaire de base",
    R120: "Heures supplémentaires",
    R100: "I.C.R",
    R110: "I.E.P",
    R200: "Indemnité de nuisance",
    R201: "Prime de responsabilité",
    R202: "Prime de disponibilité",
    R203: "P.R.I",
    R204: "P.R.C",
    R250: "Panier",
    R260: "Autre prime",
    R950: "Retenue sécurité sociale (CNAS)",
    R980: "Retenue IRG",
    R985: "Retenue forfaitaire 10%",
    R995: "Cotisation mutuelle",
    R999: "Autres retenues",
  };

  // Récupérer le catalogue pour les libellés des rubriques dynamiques
  const codesAValider = Array.from(mapRubriques.keys()).filter((c) => !LIBELLES_NATIONAUX[c]);
  let catalogueLibelles: Record<string, string> = {};
  if (codesAValider.length > 0) {
    const { data: catRows } = await supabase
      .from("rubriques_catalogue")
      .select("code, libelle")
      .in("code", codesAValider);
    catalogueLibelles = Object.fromEntries((catRows ?? []).map((r) => [r.code, r.libelle ?? r.code]));
  }

  const lignes: LigneCentralisateur[] = [];
  for (const [code, val] of mapRubriques.entries()) {
    lignes.push({
      code,
      libelle: LIBELLES_NATIONAUX[code] || catalogueLibelles[code] || code,
      n_base: val.base,
      gain: val.gain,
      retenue: val.retenue,
      eff: val.eff.size,
    });
  }

  // Trier numériquement par code de rubrique
  lignes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  // Charges Patronales
  const cnasPatronaleVal = totalBaseCnasGlobal * params.taux_cnas_employeur;
  const fondSocialVal = totalGainsGlobaux * 0.02; // Fond social employeur 2% standard
  const chargesPatronales: ChargePatronaleCentralise[] = [
    {
      code: "R810",
      libelle: "CNAS 26% (Patronale)",
      n_base: totalBaseCnasGlobal,
      taux: params.taux_cnas_employeur * 100,
      montant: cnasPatronaleVal,
      eff: bulletins.length,
    },
    {
      code: "R822",
      libelle: "FOND SOCIAL 2% (Patronale)",
      n_base: totalGainsGlobaux,
      taux: 2.0,
      montant: fondSocialVal,
      eff: bulletins.length,
    },
  ];

  const totalChargesPatronales = cnasPatronaleVal + fondSocialVal;

  return {
    lignes,
    chargesPatronales,
    totalGains: totalGainsGlobaux,
    totalRetenues: totalRetenuesGlobaux,
    netAPayer: totalNetAPayerGlobal,
    masseSalariale: totalGainsGlobaux + totalChargesPatronales,
    nombreSalaries: bulletins.length,
  };
}

/**
 * Récupère l'état nominatif des salariés pour un mois, une année et une rubrique donnés.
 * Retourne la liste des employés ayant un montant non nul pour cette rubrique.
 */
export async function getEtatNominatifRubrique(
  annee: number,
  mois: number,
  rubriqueCode: string,
): Promise<LigneNominative[]> {
  const { supabase } = await enforceRapportAccess();

  const { data: bulletins, error: bError } = await supabase
    .from("bulletins")
    .select("*, salaries(*)")
    .eq("annee", annee)
    .eq("mois", mois);

  if (bError) throw new Error(bError.message);
  if (!bulletins || bulletins.length === 0) return [];

  const bulletinIds = bulletins.map((b: any) => b.id);
  const { data: allBulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .in("bulletin_id", bulletinIds);

  const params = await getParametres();
  const lignesNominatives: LigneNominative[] = [];

  for (const b of bulletins) {
    const salarie = b.salaries;
    if (!salarie) continue;

    const champsAbsences = {
      salaire_base_theorique: b.salaire_base_theorique,
      maladie_h: b.maladie_h,
      mise_a_pied_h: b.mise_a_pied_h,
      accident_travail_h: b.accident_travail_h,
      retard_h: b.retard_h,
      absence_irreguliere_h: b.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    const bRubriques = (allBulletinRubriques ?? []).filter((br) => br.bulletin_id === b.id);
    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of bRubriques) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: b.heures_sup_1,
      heures_sup_2: b.heures_sup_2,
      heures_sup_3: b.heures_sup_3,
      icr: b.icr,
      taux_iep: b.taux_iep,
      taux_nuisance: b.taux_nuisance,
      taux_responsabilite: b.taux_responsabilite,
      taux_disponibilite: b.taux_disponibilite,
      taux_pri: b.taux_pri,
      taux_prc: b.taux_prc,
      panier_jours: b.panier_jours,
      panier_forfait_jour: b.panier_forfait_jour,
      autre_prime_fixe: b.autre_prime_fixe,
      cotis_mutuelle: b.cotis_mutuelle,
      autres_retenues: b.autres_retenues,
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, params);
    
    // Déterminer la valeur pour le code demandé
    let valeur = 0;

    if (rubriqueCode === "R030") valeur = res.salaire_base_reel;
    else if (rubriqueCode === "R120") valeur = res.total_heures_sup_da;
    else if (rubriqueCode === "R100") valeur = saisie.icr;
    else if (rubriqueCode === "R110") valeur = res.prime_iep;
    else if (rubriqueCode === "R200") valeur = res.prime_nuisance;
    else if (rubriqueCode === "R201") valeur = res.prime_responsabilite;
    else if (rubriqueCode === "R202") valeur = res.prime_disponibilite;
    else if (rubriqueCode === "R203") valeur = res.prime_pri;
    else if (rubriqueCode === "R204") valeur = res.prime_prc;
    else if (rubriqueCode === "R250") valeur = saisie.panier_jours * saisie.panier_forfait_jour;
    else if (rubriqueCode === "R260") valeur = saisie.autre_prime_fixe;
    else if (rubriqueCode === "R950") valeur = res.retenue_cnas;
    else if (rubriqueCode === "R980") valeur = res.retenue_irg_nette;
    else if (rubriqueCode === "R985") valeur = res.retenue_10pct;
    else if (rubriqueCode === "R995") valeur = saisie.cotis_mutuelle;
    else if (rubriqueCode === "R999") valeur = saisie.autres_retenues;
    else {
      // Rechercher dans les rubriques dynamiques
      const dyn = res.detail_rubriques.find((d) => d.code === rubriqueCode);
      if (dyn) valeur = dyn.montant;
    }

    if (valeur > 0) {
      lignesNominatives.push({
        matricule: salarie.matricule,
        nom_prenom: salarie.nom_prenom,
        fonction: salarie.fonction,
        valeur,
      });
    }
  }

  // Trier par nom de salarié
  lignesNominatives.sort((a, b) => a.nom_prenom.localeCompare(b.nom_prenom));
  return lignesNominatives;
}

export interface LigneVirement {
  salarie_id: number;
  matricule: string | null;
  nom_prenom: string;
  ccp_rib: string | null;
  net_a_payer: number;
}

/**
 * Récupère les données nécessaires pour générer les fichiers de virements bancaires (RIB / CCP)
 * pour un mois et une année donnés.
 */
export async function getVirementData(annee: number, mois: number): Promise<LigneVirement[]> {
  const { supabase } = await enforceRapportAccess();

  const { data: bulletins, error: bError } = await supabase
    .from("bulletins")
    .select("*, salaries(*)")
    .eq("annee", annee)
    .eq("mois", mois);

  if (bError) throw new Error(bError.message);
  if (!bulletins || bulletins.length === 0) return [];

  const params = await getParametres();
  const list: LigneVirement[] = [];

  // Charger toutes les rubriques en une fois pour la performance
  const bulletinIds = bulletins.map((b) => b.id);
  const { data: allBulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .in("bulletin_id", bulletinIds);

  for (const b of bulletins) {
    const salarie = b.salaries;
    if (!salarie) continue;

    const champsAbsences = {
      salaire_base_theorique: b.salaire_base_theorique,
      maladie_h: b.maladie_h,
      mise_a_pied_h: b.mise_a_pied_h,
      accident_travail_h: b.accident_travail_h,
      retard_h: b.retard_h,
      absence_irreguliere_h: b.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    // Dynamic rubrics from loaded list
    const bRubriques = (allBulletinRubriques ?? []).filter((br) => br.bulletin_id === b.id);
    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of bRubriques) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: b.heures_sup_1,
      heures_sup_2: b.heures_sup_2,
      heures_sup_3: b.heures_sup_3,
      icr: b.icr,
      taux_iep: b.taux_iep,
      taux_nuisance: b.taux_nuisance,
      taux_responsabilite: b.taux_responsabilite,
      taux_disponibilite: b.taux_disponibilite,
      taux_pri: b.taux_pri,
      taux_prc: b.taux_prc,
      panier_jours: b.panier_jours,
      panier_forfait_jour: b.panier_forfait_jour,
      autre_prime_fixe: b.autre_prime_fixe,
      cotis_mutuelle: b.cotis_mutuelle,
      autres_retenues: b.autres_retenues,
      rubriques_dynamiques,
    };

    const res = calculerPaie(saisie, params);
    list.push({
      salarie_id: salarie.id,
      matricule: salarie.matricule,
      nom_prenom: salarie.nom_prenom,
      ccp_rib: salarie.ccp_rib || null,
      net_a_payer: res.net_a_payer,
    });
  }

  // Sort by employee name
  list.sort((a, b) => a.nom_prenom.localeCompare(b.nom_prenom));
  return list;
}
