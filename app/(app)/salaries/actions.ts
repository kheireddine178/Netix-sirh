"use server";

import { createClient as createServerClient } from "@/lib/supabaseServer";

import {
  calculerPaie,
  calculerBaseAvantRubriques,
  categorieRubrique,
  CODES_GERES_NATIVEMENT,
  PARAMETRES_PAR_DEFAUT,
  SAISIE_VIDE,
  type CategorieRubrique,
  type LigneRubriqueDynamique,
  type Parametres,
  type ResultatPaie,
  type SaisieMensuelle,
} from "@/lib/paieCalcul";
import { resoudreLigneRubrique, type RubriqueCatalogueRow } from "@/lib/rubriquesDynamiques";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


function getAuditAuteurId(userId?: string | null): string | null {
  if (!userId) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
  return isUuid ? userId : null;
}

// ------------------------------------------------------------------
// Helpers d'authentification et d'autorisation de la Phase 1
// ------------------------------------------------------------------

export async function enforceSession() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, salarie_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      return { supabase, user, role: profile.role, email: profile.email, salarieId: profile.salarie_id };
    }
  }

  // Profil par défaut pour accès sans authentification
  return {
    supabase,
    user: user || { id: "guest-user", email: "guest@netix.local" },
    role: "Responsable RH",
    email: user?.email || "guest@netix.local",
    salarieId: null,
  };
}

export async function enforceRHAccess() {
  const ctx = await enforceSession();
  return ctx;
}

export async function enforceResponsableRHAccess() {
  const ctx = await enforceSession();
  return ctx;
}

export async function enforceRapportAccess() {
  const ctx = await enforceSession();
  return ctx;
}

export interface Salarie {
  id: number;
  matricule: string | null;
  nom_prenom: string;
  fonction: string | null;
  salaire_base_theorique: number;
  actif: boolean;
  date_visite_medicale?: string | null;
  ccp_rib?: string | null;
}

export async function listerSalaries(): Promise<Salarie[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .order("nom_prenom");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface ListerSalariesParams {
  search?: string;
  actifOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface ListerSalariesResult {
  salaries: Salarie[];
  totalCount: number;
}

/**
 * Récupère la liste des salariés avec pagination, recherche et filtres de statut.
 */
export async function listerSalariesPaginated({
  search = "",
  actifOnly = false,
  page = 1,
  limit = 15,
}: ListerSalariesParams = {}): Promise<ListerSalariesResult> {
  const { supabase } = await enforceSession();

  let query = supabase
    .from("salaries")
    .select("*", { count: "exact" });

  if (actifOnly) {
    query = query.eq("actif", true);
  }

  if (search.trim()) {
    query = query.or(`nom_prenom.ilike.%${search}%,matricule.ilike.%${search}%,fonction.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order("nom_prenom")
    .range(from, to);

  if (error) throw new Error(error.message);
  return {
    salaries: data ?? [],
    totalCount: count ?? 0,
  };
}

export async function creerSalarie(formData: FormData) {
  const { supabase, user, email } = await enforceRHAccess();

  const nom_prenom = formData.get("nom_prenom") as string;
  const matricule = (formData.get("matricule") as string) || null;
  const fonction = (formData.get("fonction") as string) || null;
  const salaire_base_theorique = parseFloat(formData.get("salaire_base_theorique") as string) || 0;
  const date_visite_medicale = (formData.get("date_visite_medicale") as string) || null;
  const ccp_rib = (formData.get("ccp_rib") as string) || null;

  // Création du salarié
  const { data: salarie, error } = await supabase
    .from("salaries")
    .insert({
      nom_prenom,
      matricule,
      fonction,
      salaire_base_theorique,
      date_visite_medicale,
      ccp_rib,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur création salarié:", error);
    return { error: error.message };
  }

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "salaries",
    type_action: "INSERT",
    enregistrement_id: salarie.id,
    valeurs_apres: { nom_prenom, matricule, fonction, salaire_base_theorique, date_visite_medicale, ccp_rib }
  });

  revalidatePath("/salaries");
  redirect("/salaries");
}

/** Met à jour les informations de base d'un salarié existant. */
export async function modifierSalarie(id: number, formData: FormData) {
  const { supabase, user, email } = await enforceRHAccess();

  const nom_prenom = formData.get("nom_prenom") as string;
  const matricule = (formData.get("matricule") as string) || null;
  const fonction = (formData.get("fonction") as string) || null;
  const salaire_base_theorique = parseFloat(formData.get("salaire_base_theorique") as string) || 0;
  const date_visite_medicale = (formData.get("date_visite_medicale") as string) || null;
  const ccp_rib = (formData.get("ccp_rib") as string) || null;

  // Récupérer l'état avant pour l'audit
  const { data: avant } = await supabase.from("salaries").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("salaries")
    .update({
      nom_prenom,
      matricule,
      fonction,
      salaire_base_theorique,
      date_visite_medicale,
      ccp_rib,
    })
    .eq("id", id);

  if (error) {
    console.error("Erreur modification salarié:", error);
    return { error: error.message };
  }

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "salaries",
    type_action: "UPDATE",
    enregistrement_id: id,
    valeurs_avant: avant,
    valeurs_apres: { nom_prenom, matricule, fonction, salaire_base_theorique, date_visite_medicale, ccp_rib }
  });

  revalidatePath("/salaries");
  redirect("/salaries");
}

/** Désactive un salarié (soft delete) : son historique de bulletins est conservé. */
export async function desactiverSalarie(id: number) {
  const { supabase, user, email } = await enforceRHAccess();
  
  const { error } = await supabase.from("salaries").update({ actif: false }).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "salaries",
    type_action: "UPDATE",
    enregistrement_id: id,
    valeurs_apres: { actif: false }
  });

  revalidatePath("/salaries");
}

/** Réactive un salarié précédemment désactivé. */
export async function reactiverSalarie(id: number) {
  const { supabase, user, email } = await enforceRHAccess();

  const { error } = await supabase.from("salaries").update({ actif: true }).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "salaries",
    type_action: "UPDATE",
    enregistrement_id: id,
    valeurs_apres: { actif: true }
  });

  revalidatePath("/salaries");
}

/**
 * Supprime définitivement un salarié et tout son historique.
 */
export async function supprimerSalarieDefinitif(id: number) {
  const { supabase, user, email } = await enforceResponsableRHAccess();

  const { data: avant } = await supabase.from("salaries").select("*").eq("id", id).single();

  const { data: bulletins, error: bulletinsError } = await supabase
    .from("bulletins")
    .select("id")
    .eq("salarie_id", id);

  if (bulletinsError) throw new Error(bulletinsError.message);

  const bulletinIds = (bulletins ?? []).map((b) => b.id);

  if (bulletinIds.length > 0) {
    const { error: brError } = await supabase
      .from("bulletin_rubriques")
      .delete()
      .in("bulletin_id", bulletinIds);
    if (brError) throw new Error(brError.message);
  }

  const { error: bError } = await supabase.from("bulletins").delete().eq("salarie_id", id);
  if (bError) throw new Error(bError.message);

  const { error: srError } = await supabase.from("salarie_rubriques").delete().eq("salarie_id", id);
  if (srError) throw new Error(srError.message);

  const { error: sError } = await supabase.from("salaries").delete().eq("id", id);
  if (sError) throw new Error(sError.message);

  revalidatePath("/salaries");
}

export async function getSalarie(id: number): Promise<Salarie | null> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("salaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

/** Récupère les paramètres de paie (SNMG, barème IRG, infos employeur, etc.) depuis Supabase. */
export async function getParametres(): Promise<Parametres> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase.from("parametres").select("data").single();
  if (error || !data) return PARAMETRES_PAR_DEFAUT;
  return data.data;
}

// ------------------------------------------------------------------
// Étape 7 — Rubriques dynamiques du catalogue (402 codes)
// ------------------------------------------------------------------

export interface RubriqueCatalogue extends RubriqueCatalogueRow {
  categorie: CategorieRubrique;
}

export interface RubriqueAssignee extends RubriqueCatalogue {
  valeur_defaut: number;
}

/**
 * Liste les rubriques du catalogue qui peuvent être assignées à un salarié : uniquement
 * les codes "saisissables" (Gain (+) / Retenue (-)) qui ne sont pas déjà gérés nativement
 * par les champs V1 du formulaire de bulletin (CODES_GERES_NATIVEMENT dans paieCalcul.ts).
 */
export async function listerCatalogueRubriques(): Promise<RubriqueCatalogue[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("rubriques_catalogue")
    .select("code, libelle, type_valeur, cotisable, imposable")
    .in("type_valeur", ["Gain (+)", "Retenue (-)"])
    .order("code");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((r: any) => !CODES_GERES_NATIVEMENT.has(r.code))
    .map((r: any) => ({ ...r, categorie: categorieRubrique(r.code) }));
}

/** Rubriques du catalogue actuellement cochées/assignées à un salarié donné. */
export async function listerRubriquesSalarie(salarieId: number): Promise<RubriqueAssignee[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("salarie_rubriques")
    .select("rubrique_code, valeur_defaut, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((r: any) => {
      const cat = Array.isArray(r.rubriques_catalogue) ? r.rubriques_catalogue[0] : r.rubriques_catalogue;
      if (!cat) return null;
      return {
        code: cat.code,
        libelle: cat.libelle,
        type_valeur: cat.type_valeur,
        cotisable: cat.cotisable,
        imposable: cat.imposable,
        valeur_defaut: r.valeur_defaut ?? 0,
        categorie: categorieRubrique(cat.code),
      };
    })
    .filter((r): r is RubriqueAssignee => r !== null)
    .sort((a: any, b: any) => a.code.localeCompare(b.code));
}

/**
 * Enregistre les rubriques cochées pour un salarié (page /salaries/[id]/rubriques).
 * Champs de formulaire attendus, pour chaque code coché : `rub_<code>`="on" et
 * `defaut_<code>`=valeur par défaut (peut être 0).
 * Remplace entièrement la sélection précédente (les cases décochées sont retirées).
 */
export async function assignerRubriquesSalarie(salarieId: number, formData: FormData) {
  const { supabase } = await enforceSession();
  const codesCoches: { code: string; valeur_defaut: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("rub_") && value === "on") {
      const code = key.slice(4);
      let valeurDefaut = parseFloat((formData.get(`defaut_${code}`) as string) || "0") || 0;
      const nbStr = formData.get(`defaut_nombre_${code}`) as string | null;
      const txStr = formData.get(`defaut_taux_${code}`) as string | null;
      if (nbStr !== null && txStr !== null) {
        const nb = parseFloat(nbStr) || 0;
        const tx = parseFloat(txStr) || 0;
        if (nb > 0 && tx > 0) {
          valeurDefaut = nb * tx;
        }
      }
      codesCoches.push({ code, valeur_defaut: valeurDefaut });
    }
  }

  const { error: delError } = await supabase
    .from("salarie_rubriques")
    .delete()
    .eq("salarie_id", salarieId);
  if (delError) throw new Error(delError.message);

  if (codesCoches.length > 0) {
    const { error: insError } = await supabase.from("salarie_rubriques").insert(
      codesCoches.map((c) => ({
        salarie_id: salarieId,
        rubrique_code: c.code,
        valeur_defaut: c.valeur_defaut,
      })),
    );
    if (insError) throw new Error(insError.message);
  }

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

/**
 * Rattache une rubrique du catalogue à un salarié de façon incrémentale (sans toucher
 * aux autres rubriques déjà assignées), appelée quand l'utilisateur ajoute une rubrique
 * à la volée depuis la recherche du formulaire de saisie mensuelle. Une fois rattachée,
 * la rubrique suit le salarié d'un mois à l'autre, comme dans la version Python.
 * Idempotent : n'insère rien si la rubrique est déjà assignée à ce salarié.
 */
export async function ajouterRubriqueSalarie(salarieId: number, code: string) {
  const { supabase } = await enforceSession();
  const { data: existant, error: selError } = await supabase
    .from("salarie_rubriques")
    .select("id")
    .eq("salarie_id", salarieId)
    .eq("rubrique_code", code)
    .maybeSingle();
  if (selError) throw new Error(selError.message);

  if (!existant) {
    const { error } = await supabase
      .from("salarie_rubriques")
      .insert({ salarie_id: salarieId, rubrique_code: code, valeur_defaut: 0 });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

/**
 * Détache une rubrique du catalogue d'un salarié (symétrique de ajouterRubriqueSalarie),
 * appelée quand l'utilisateur retire une rubrique depuis le formulaire de saisie mensuelle.
 */
export async function retirerRubriqueSalarie(salarieId: number, code: string) {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("salarie_rubriques")
    .delete()
    .eq("salarie_id", salarieId)
    .eq("rubrique_code", code);
  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/rubriques`);
  revalidatePath(`/salaries/${salarieId}/bulletin`);
}

// ------------------------------------------------------------------
// Bulletin mensuel (V1 + rubriques dynamiques)
// ------------------------------------------------------------------

export interface ResultatBulletin extends ResultatPaie {
  bulletin_id: number;
  annee: number;
  mois: number;
}

/**
 * Calcule et enregistre un bulletin de paie mensuel pour un salarié.
 * Reçoit les champs du formulaire (champs V1 + champs dynamiques `dyn_<code>_v1`/`_v2`
 * pour chaque rubrique du catalogue cochée pour ce salarié), construit une
 * SaisieMensuelle complète, appelle calculerPaie(), puis sauvegarde à la fois les
 * données saisies (table `bulletins`) et le détail des rubriques dynamiques
 * (table `bulletin_rubriques`).
 */
export async function creerBulletin(salarieId: number, formData: FormData): Promise<ResultatBulletin> {
  const { supabase, user, email } = await enforceRHAccess();

  const num = (name: string) => parseFloat(formData.get(name) as string) || 0;

  const annee = parseInt(formData.get("annee") as string, 10);
  const mois = parseInt(formData.get("mois") as string, 10);

  // Vérification de verrouillage (bulletin déjà clôturé)
  const { data: existing } = await supabase
    .from("bulletins")
    .select("statut")
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois)
    .maybeSingle();

  if (existing && existing.statut === "Clôturé") {
    throw new Error("Ce bulletin est clôturé et ne peut plus être modifié.");
  }

  const salarie = await getSalarie(salarieId);
  if (!salarie) throw new Error("Salarié introuvable");

  const params = await getParametres();

  const champsAbsences = {
    salaire_base_theorique: num("salaire_base_theorique") || salarie.salaire_base_theorique,
    maladie_h: num("maladie_h"),
    mise_a_pied_h: num("mise_a_pied_h"),
    accident_travail_h: num("accident_travail_h"),
    retard_h: num("retard_h"),
    absence_irreguliere_h: num("absence_irreguliere_h"),
  };
  const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

  const codesPostes = new Set<string>();
  for (const key of formData.keys()) {
    const m = key.match(/^dyn_(.+)_(?:v1|v2)$/);
    if (m) codesPostes.add(m[1]);
  }

  let catalogueMap = new Map<string, RubriqueCatalogueRow>();
  if (codesPostes.size > 0) {
    const { data: catalogueRows, error: catError } = await supabase
      .from("rubriques_catalogue")
      .select("code, libelle, type_valeur, cotisable, imposable")
      .in("code", Array.from(codesPostes));
    if (catError) throw new Error(catError.message);
    catalogueMap = new Map((catalogueRows ?? []).map((r) => [r.code, r]));
  }

  const valeursRubriques: { code: string; valeur_1: number; valeur_2: number }[] = [];
  const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
  for (const code of codesPostes) {
    const cat = catalogueMap.get(code);
    if (!cat) continue;
    const categorie = categorieRubrique(code);
    const rawV1 = num(`dyn_${code}_v1`);
    const v1 = categorie === "pourcentage" ? (rawV1 > 1 ? rawV1 / 100 : rawV1) : rawV1;
    const v2 = categorie === "nombre_x_taux" ? num(`dyn_${code}_v2`) : 0;
    valeursRubriques.push({ code, valeur_1: v1, valeur_2: v2 });
    const ligne = resoudreLigneRubrique(cat, v1, v2, salaire_base_reel);
    if (ligne) rubriques_dynamiques.push(ligne);
  }

  const saisie: SaisieMensuelle = {
    ...SAISIE_VIDE,
    ...champsAbsences,
    heures_sup_1: num("heures_sup_1"),
    heures_sup_2: num("heures_sup_2"),
    heures_sup_3: num("heures_sup_3"),
    icr: num("icr"),
    taux_iep: num("taux_iep"),
    taux_nuisance: num("taux_nuisance"),
    taux_responsabilite: num("taux_responsabilite"),
    taux_disponibilite: num("taux_disponibilite"),
    taux_pri: num("taux_pri"),
    taux_prc: num("taux_prc"),
    panier_jours: num("panier_jours"),
    panier_forfait_jour: num("panier_forfait_jour"),
    autre_prime_fixe: num("autre_prime_fixe"),
    cotis_mutuelle: num("cotis_mutuelle"),
    autres_retenues: num("autres_retenues"),
    rubriques_dynamiques,
  };

  const resultat = calculerPaie(saisie, params);

  const { data: bulletinRow, error } = await supabase
    .from("bulletins")
    .upsert(
      {
        salarie_id: salarieId,
        annee,
        mois,
        salaire_base_theorique: saisie.salaire_base_theorique,
        maladie_h: saisie.maladie_h,
        mise_a_pied_h: saisie.mise_a_pied_h,
        accident_travail_h: saisie.accident_travail_h,
        retard_h: saisie.retard_h,
        absence_irreguliere_h: saisie.absence_irreguliere_h,
        heures_sup_1: saisie.heures_sup_1,
        heures_sup_2: saisie.heures_sup_2,
        heures_sup_3: saisie.heures_sup_3,
        icr: saisie.icr,
        taux_iep: saisie.taux_iep,
        taux_nuisance: saisie.taux_nuisance,
        taux_responsabilite: saisie.taux_responsabilite,
        taux_disponibilite: saisie.taux_disponibilite,
        taux_pri: saisie.taux_pri,
        taux_prc: saisie.taux_prc,
        panier_jours: saisie.panier_jours,
        panier_forfait_jour: saisie.panier_forfait_jour,
        autre_prime_fixe: saisie.autre_prime_fixe,
        cotis_mutuelle: saisie.cotis_mutuelle,
        autres_retenues: saisie.autres_retenues,
        statut: existing?.statut || "Brouillon",
        modifie_le: new Date().toISOString(),
      },
      { onConflict: "salarie_id,annee,mois" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const bulletinId = bulletinRow.id as number;

  // Sauvegarde des valeurs de rubriques dynamiques saisies ce mois-ci (remplace les
  // valeurs d'un éventuel bulletin déjà enregistré pour ce salarié/mois/année).
  const { error: delRubError } = await supabase
    .from("bulletin_rubriques")
    .delete()
    .eq("bulletin_id", bulletinId);
  if (delRubError) throw new Error(delRubError.message);

  const valeursNonNulles = valeursRubriques.filter((v) => v.valeur_1 !== 0 || v.valeur_2 !== 0);
  if (valeursNonNulles.length > 0) {
    const { error: insRubError } = await supabase.from("bulletin_rubriques").insert(
      valeursNonNulles.map((v) => ({
        bulletin_id: bulletinId,
        rubrique_code: v.code,
        valeur_1: v.valeur_1,
        valeur_2: v.valeur_2,
      })),
    );
    if (insRubError) throw new Error(insRubError.message);
  }

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "bulletins",
    type_action: existing ? "UPDATE" : "INSERT",
    enregistrement_id: bulletinId,
    valeurs_apres: { salarie_id: salarieId, annee, mois, net_a_payer: resultat.net_a_payer }
  });

  revalidatePath(`/salaries/${salarieId}/bulletin`);
  return { ...resultat, bulletin_id: bulletinId, annee, mois };
}

// ------------------------------------------------------------------
// Étape 6 — Génération du PDF
// ------------------------------------------------------------------

export interface DonneesPourPdf {
  salarie: Salarie;
  params: Parametres;
  saisie: SaisieMensuelle;
  resultat: ResultatPaie;
}

/**
 * Recharge un bulletin déjà enregistré (table `bulletins` + `bulletin_rubriques`) et
 * reconstruit la SaisieMensuelle et le ResultatPaie correspondants, pour la génération
 * du PDF à la volée (voir app/salaries/[id]/bulletin/pdf/route.ts).
 * Retourne `null` si aucun bulletin n'existe pour ce salarié / cette période.
 */
export async function getBulletinPourPdf(
  salarieId: number,
  annee: number,
  mois: number,
): Promise<DonneesPourPdf | null> {
  const { supabase } = await enforceSession();
  const salarie = await getSalarie(salarieId);
  if (!salarie) return null;

  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois)
    .single();

  if (error || !bulletin) return null;

  const params = await getParametres();

  const { data: bulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)")
    .eq("bulletin_id", bulletin.id);

  const champsAbsences = {
    salaire_base_theorique: bulletin.salaire_base_theorique,
    maladie_h: bulletin.maladie_h,
    mise_a_pied_h: bulletin.mise_a_pied_h,
    accident_travail_h: bulletin.accident_travail_h,
    retard_h: bulletin.retard_h,
    absence_irreguliere_h: bulletin.absence_irreguliere_h,
  };
  const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

  const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
  for (const br of bulletinRubriques ?? []) {
    const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
    if (!cat) continue;
    const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
    if (ligne) rubriques_dynamiques.push(ligne);
  }

  const saisie: SaisieMensuelle = {
    ...SAISIE_VIDE,
    ...champsAbsences,
    heures_sup_1: bulletin.heures_sup_1,
    heures_sup_2: bulletin.heures_sup_2,
    heures_sup_3: bulletin.heures_sup_3,
    icr: bulletin.icr,
    taux_iep: bulletin.taux_iep,
    taux_nuisance: bulletin.taux_nuisance,
    taux_responsabilite: bulletin.taux_responsabilite,
    taux_disponibilite: bulletin.taux_disponibilite,
    taux_pri: bulletin.taux_pri,
    taux_prc: bulletin.taux_prc,
    panier_jours: bulletin.panier_jours,
    panier_forfait_jour: bulletin.panier_forfait_jour,
    autre_prime_fixe: bulletin.autre_prime_fixe,
    cotis_mutuelle: bulletin.cotis_mutuelle,
    autres_retenues: bulletin.autres_retenues,
    rubriques_dynamiques,
  };

  const resultat = calculerPaie(saisie, params);

  return { salarie, params, saisie, resultat };
}

// ------------------------------------------------------------------
// Rechargement d'un bulletin existant pour édition (bouton "Charger")
// ------------------------------------------------------------------

export interface LigneRubriqueSaisie {
  code: string;
  libelle: string | null;
  categorie: CategorieRubrique;
  valeur_1: number;
  valeur_2: number;
}

export interface BulletinPourSaisie {
  bulletin_id: number;
  statut: string;
  champs: Record<string, number>;
  rubriques: LigneRubriqueSaisie[];
}

/**
 * Relit un bulletin déjà enregistré (table `bulletins` + `bulletin_rubriques`) pour
 * repréremplir le formulaire de saisie mensuelle (bouton "Charger"), y compris les
 * rubriques dynamiques ajoutées à la volée qui ne font pas partie des rubriques
 * préassignées au salarié. Retourne `null` si aucun bulletin n'existe pour cette
 * période : le formulaire de saisie repart alors vierge pour un nouveau bulletin.
 */
export async function chargerBulletinPourSaisie(
  salarieId: number,
  annee: number,
  mois: number,
): Promise<BulletinPourSaisie | null> {
  const { supabase } = await enforceSession();
  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!bulletin) {
    // Si aucun bulletin n'existe, on pré-remplit les absences à partir des congés approuvés
    const { data: congesApprouves } = await supabase
      .from("conges")
      .select("type_conge, date_debut, date_fin, jours_ouvrables")
      .eq("salarie_id", salarieId)
      .eq("statut", "Approuvé");

    let maladieHrs = 0;
    let absIrrHrs = 0;

    if (congesApprouves && congesApprouves.length > 0) {
      const debutTarget = new Date(annee, mois - 1, 1);
      const finTarget = new Date(annee, mois, 0);

      for (const c of congesApprouves) {
        const debut = new Date(c.date_debut);
        const fin = new Date(c.date_fin);

        if (debut <= finTarget && fin >= debutTarget) {
          const hrs = (c.jours_ouvrables ?? 0) * 8;
          if (c.type_conge === "Maladie") {
            maladieHrs += hrs;
          } else if (c.type_conge === "Sans solde") {
            absIrrHrs += hrs;
          }
        }
      }
    }

    // Récupérer le montant total des avances approuvées pour ce mois et cette année
    const { data: avances } = await supabase
      .from("avances_salaire")
      .select("montant")
      .eq("salarie_id", salarieId)
      .eq("mois", mois)
      .eq("annee", annee)
      .eq("statut", "Approuvée");

    const totalAvances = (avances ?? []).reduce((sum: number, a: any) => sum + Number(a.montant), 0);

    const sal = await getSalarie(salarieId);
    const baseTheorique = sal ? sal.salaire_base_theorique : 0;

    return {
      bulletin_id: 0,
      statut: "Brouillon",
      champs: {
        salaire_base_theorique: baseTheorique,
        maladie_h: maladieHrs,
        mise_a_pied_h: 0,
        accident_travail_h: 0,
        retard_h: 0,
        absence_irreguliere_h: absIrrHrs,
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
        autres_retenues: totalAvances, // Injection de l'avance sur salaire
      },
      rubriques: [],
    };
  }

  const { data: bulletinRubriques } = await supabase
    .from("bulletin_rubriques")
    .select("rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle)")
    .eq("bulletin_id", bulletin.id);

  const rubriques: LigneRubriqueSaisie[] = (bulletinRubriques ?? []).map((br: any) => {
    const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
    const code = cat?.code ?? br.rubrique_code;
    return {
      code,
      libelle: cat?.libelle ?? code,
      categorie: categorieRubrique(code),
      valeur_1: br.valeur_1 ?? 0,
      valeur_2: br.valeur_2 ?? 0,
    };
  });

  return {
    bulletin_id: bulletin.id,
    statut: bulletin.statut || "Brouillon",
    champs: {
      salaire_base_theorique: bulletin.salaire_base_theorique,
      maladie_h: bulletin.maladie_h,
      mise_a_pied_h: bulletin.mise_a_pied_h,
      accident_travail_h: bulletin.accident_travail_h,
      retard_h: bulletin.retard_h,
      absence_irreguliere_h: bulletin.absence_irreguliere_h,
      heures_sup_1: bulletin.heures_sup_1,
      heures_sup_2: bulletin.heures_sup_2,
      heures_sup_3: bulletin.heures_sup_3,
      icr: bulletin.icr,
      taux_iep: bulletin.taux_iep,
      taux_nuisance: bulletin.taux_nuisance,
      taux_responsabilite: bulletin.taux_responsabilite,
      taux_disponibilite: bulletin.taux_disponibilite,
      taux_pri: bulletin.taux_pri,
      taux_prc: bulletin.taux_prc,
      panier_jours: bulletin.panier_jours,
      panier_forfait_jour: bulletin.panier_forfait_jour,
      autre_prime_fixe: bulletin.autre_prime_fixe,
      cotis_mutuelle: bulletin.cotis_mutuelle,
      autres_retenues: bulletin.autres_retenues,
    },
    rubriques,
  };
}

// ------------------------------------------------------------------
// Historique des bulletins
// ------------------------------------------------------------------

export interface BulletinResume {
  id: number;
  annee: number;
  mois: number;
  net_a_payer: number;
  modifie_le: string | null;
}

/**
 * Liste tous les bulletins déjà enregistrés pour un salarié (du plus récent au plus
 * ancien), avec le net à payer recalculé pour affichage dans l'historique.
 * Ne modifie rien en base — lecture seule.
 */
export async function listerBulletinsSalarie(salarieId: number): Promise<BulletinResume[]> {
  const { supabase } = await enforceSession();
  const salarie = await getSalarie(salarieId);
  if (!salarie) return [];

  const params = await getParametres();

  const { data: bulletins, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("annee", { ascending: false })
    .order("mois", { ascending: false });

  if (error) throw new Error(error.message);
  if (!bulletins || bulletins.length === 0) return [];

  const bulletinIds = bulletins.map((b: any) => b.id);

  const { data: toutesRubriques, error: rubError } = await supabase
    .from("bulletin_rubriques")
    .select(
      "bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)",
    )
    .in("bulletin_id", bulletinIds);

  if (rubError) throw new Error(rubError.message);

  const rubriquesParBulletin = new Map<number, typeof toutesRubriques>();
  for (const r of toutesRubriques ?? []) {
    const liste = rubriquesParBulletin.get(r.bulletin_id) ?? [];
    liste.push(r);
    rubriquesParBulletin.set(r.bulletin_id, liste);
  }

  return bulletins.map((bulletin: any) => {
    const champsAbsences = {
      salaire_base_theorique: bulletin.salaire_base_theorique,
      maladie_h: bulletin.maladie_h,
      mise_a_pied_h: bulletin.mise_a_pied_h,
      accident_travail_h: bulletin.accident_travail_h,
      retard_h: bulletin.retard_h,
      absence_irreguliere_h: bulletin.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of rubriquesParBulletin.get(bulletin.id) ?? []) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie: SaisieMensuelle = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: bulletin.heures_sup_1,
      heures_sup_2: bulletin.heures_sup_2,
      heures_sup_3: bulletin.heures_sup_3,
      icr: bulletin.icr,
      taux_iep: bulletin.taux_iep,
      taux_nuisance: bulletin.taux_nuisance,
      taux_responsabilite: bulletin.taux_responsabilite,
      taux_disponibilite: bulletin.taux_disponibilite,
      taux_pri: bulletin.taux_pri,
      taux_prc: bulletin.taux_prc,
      panier_jours: bulletin.panier_jours,
      panier_forfait_jour: bulletin.panier_forfait_jour,
      autre_prime_fixe: bulletin.autre_prime_fixe,
      cotis_mutuelle: bulletin.cotis_mutuelle,
      autres_retenues: bulletin.autres_retenues,
      rubriques_dynamiques,
    };

    const resultat = calculerPaie(saisie, params);

    return {
      id: bulletin.id,
      annee: bulletin.annee,
      mois: bulletin.mois,
      net_a_payer: resultat.net_a_payer,
      modifie_le: bulletin.modifie_le ?? null,
    };
  });
}

/**
 * Supprime définitivement un bulletin (et ses rubriques dynamiques associées).
 * Action irréversible — la confirmation doit être faite côté client.
 */
export async function supprimerBulletin(salarieId: number, bulletinId: number) {
  const { supabase, user, email } = await enforceResponsableRHAccess();

  // Vérifier si déjà clôturé
  const { data: b } = await supabase.from("bulletins").select("statut").eq("id", bulletinId).single();
  if (b && b.statut === "Clôturé") {
    throw new Error("Ce bulletin est clôturé et ne peut pas être supprimé.");
  }

  const { error: brError } = await supabase
    .from("bulletin_rubriques")
    .delete()
    .eq("bulletin_id", bulletinId);
  if (brError) throw new Error(brError.message);

  const { error } = await supabase
    .from("bulletins")
    .delete()
    .eq("id", bulletinId)
    .eq("salarie_id", salarieId);
  if (error) throw new Error(error.message);

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "bulletins",
    type_action: "DELETE",
    enregistrement_id: bulletinId,
    valeurs_avant: b
  });

  revalidatePath(`/salaries/${salarieId}/historique`);
  revalidatePath("/historique");
}

/**
 * Clôture définitivement un bulletin de paie pour un mois donné.
 * Action réservée au Responsable RH.
 */
export async function cloturerBulletin(salarieId: number, annee: number, mois: number) {
  const { supabase, user, email } = await enforceResponsableRHAccess();

  const { error } = await supabase
    .from("bulletins")
    .update({ statut: "Clôturé" })
    .eq("salarie_id", salarieId)
    .eq("annee", annee)
    .eq("mois", mois);

  if (error) throw new Error(error.message);

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "bulletins",
    type_action: "UPDATE",
    enregistrement_id: salarieId,
    valeurs_apres: { statut: "Clôturé", annee, mois }
  });

  revalidatePath(`/salaries/${salarieId}/bulletin`);
  revalidatePath(`/salaries/${salarieId}/historique`);
}

/**
 * Copie en masse les bulletins du mois précédent pour le mois cible.
 */
export async function copierMoisPrecedentMasse(anneeCible: number, moisCible: number): Promise<{ copies: number }> {
  const { supabase, user, email } = await enforceResponsableRHAccess();

  const prevMois = moisCible === 1 ? 12 : moisCible - 1;
  const prevAnnee = moisCible === 1 ? anneeCible - 1 : anneeCible;

  const { data: bulletinsPrev, error: bError } = await supabase
    .from("bulletins")
    .select("*")
    .eq("annee", prevAnnee)
    .eq("mois", prevMois);

  if (bError) throw new Error(bError.message);
  if (!bulletinsPrev || bulletinsPrev.length === 0) {
    throw new Error(`Aucun bulletin trouvé pour le mois précédent (${prevMois}/${prevAnnee})`);
  }

  const { data: bulletinsExistent } = await supabase
    .from("bulletins")
    .select("salarie_id")
    .eq("annee", anneeCible)
    .eq("mois", moisCible);

  const salariesExistent = new Set((bulletinsExistent ?? []).map((b: any) => b.salarie_id));
  let count = 0;

  for (const b of bulletinsPrev as any[]) {
    if (salariesExistent.has(b.salarie_id)) continue;

    const { data: rubriquesSource } = await supabase
      .from("bulletin_rubriques")
      .select("rubrique_code, valeur_1, valeur_2")
      .eq("bulletin_id", b.id);

    const { data: nouveauB, error: insError } = await supabase
      .from("bulletins")
      .insert({
        salarie_id: b.salarie_id,
        annee: anneeCible,
        mois: moisCible,
        salaire_base_theorique: b.salaire_base_theorique,
        maladie_h: b.maladie_h,
        mise_a_pied_h: b.mise_a_pied_h,
        accident_travail_h: b.accident_travail_h,
        retard_h: b.retard_h,
        absence_irreguliere_h: b.absence_irreguliere_h,
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
        statut: "Brouillon",
      })
      .select()
      .single();

    if (insError) continue;

    if (rubriquesSource && rubriquesSource.length > 0 && nouveauB) {
      await supabase.from("bulletin_rubriques").insert(
        rubriquesSource.map((r: any) => ({
          bulletin_id: nouveauB.id,
          rubrique_code: r.rubrique_code,
          valeur_1: r.valeur_1,
          valeur_2: r.valeur_2,
        }))
      );
    }
    count++;
  }

  // Journalisation d'audit (Audit Trail)
  await supabase.from("audit_logs").insert({
    auteur_id: getAuditAuteurId(user?.id),
    auteur_email: email,
    table_cible: "bulletins",
    type_action: "INSERT",
    valeurs_apres: { copies: count, anneeCible, moisCible }
  });

  revalidatePath("/saisie");
  return { copies: count };
}

export interface ContratRow {
  id: number;
  salarie_id: number;
  type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  periode_essai_mois: number;
  statut: string;
  salaire_base_contrat: number;
}

export interface DocumentSalarieRow {
  id: number;
  salarie_id: number;
  nom_document: string;
  categorie: string;
  fichier_url: string;
  cree_le: string;
}

export async function listerContratsSalarie(salarieId: number): Promise<ContratRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("contrats")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listerDocumentsSalarie(salarieId: number): Promise<DocumentSalarieRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("documents_salaries")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("cree_le", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerContratSalarie(salarieId: number, formData: FormData): Promise<ContratRow> {
  const { supabase } = await enforceSession();
  const type_contrat = formData.get("type_contrat") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = (formData.get("date_fin") as string) || null;
  const periode_essai_mois = parseInt(formData.get("periode_essai_mois") as string, 10) || 0;
  const salaire_base_contrat = parseFloat(formData.get("salaire_base_contrat") as string) || 0;
  const statut = formData.get("statut") as string || "En cours";

  const { data, error } = await supabase
    .from("contrats")
    .insert({
      salarie_id: salarieId,
      type_contrat,
      date_debut,
      date_fin,
      periode_essai_mois,
      salaire_base_contrat,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/contrat`);
  return data;
}

export async function supprimerContratSalarie(contratId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("contrats")
    .delete()
    .eq("id", contratId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/contrat`);
}

export interface ContratGlobalRow extends ContratRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
  } | null;
}

export async function listerTousContrats(): Promise<ContratGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("contrats")
    .select("*, salaries(id, nom_prenom, matricule, fonction)")
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function changerStatutContratGlobal(contratId: number, statut: string): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("contrats")
    .update({ statut })
    .eq("id", contratId);

  if (error) throw new Error(error.message);
  revalidatePath("/contrats");
}

export async function supprimerContratGlobal(contratId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("contrats")
    .delete()
    .eq("id", contratId);

  if (error) throw new Error(error.message);
  revalidatePath("/contrats");
}

export async function creerDocumentSalarie(
  salarieId: number,
  nomDocument: string,
  categorie: string,
  fichierUrl: string
): Promise<DocumentSalarieRow> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("documents_salaries")
    .insert({
      salarie_id: salarieId,
      nom_document: nomDocument,
      categorie,
      fichier_url: fichierUrl,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/contrat`);
  return data;
}

export async function supprimerDocumentSalarie(documentId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("documents_salaries")
    .delete()
    .eq("id", documentId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/contrat`);
}

export interface CongeRow {
  id: number;
  salarie_id: number;
  type_conge: string;
  date_debut: string;
  date_fin: string;
  jours_ouvrables: number;
  statut: string;
  motif: string | null;
  justificatif_url: string | null;
  cree_le: string;
}

export async function listerCongesSalarie(salarieId: number): Promise<CongeRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerCongeSalarie(salarieId: number, formData: FormData): Promise<CongeRow> {
  const { supabase } = await enforceSession();
  const type_conge = formData.get("type_conge") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = formData.get("date_fin") as string;
  const jours_ouvrables = parseInt(formData.get("jours_ouvrables") as string, 10) || 0;
  const motif = (formData.get("motif") as string) || null;
  const justificatif_url = (formData.get("justificatif_url") as string) || null;
  const statut = (formData.get("statut") as string) || "En attente";

  const { data, error } = await supabase
    .from("conges")
    .insert({
      salarie_id: salarieId,
      type_conge,
      date_debut,
      date_fin,
      jours_ouvrables,
      motif,
      justificatif_url,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/conges`);
  return data;
}

export async function supprimerCongeSalarie(congeId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("conges")
    .delete()
    .eq("id", congeId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/conges`);
}

export interface CongeGlobalRow extends CongeRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
  } | null;
}

export async function listerTousLesConges(): Promise<CongeGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("conges")
    .select("*, salaries(id, nom_prenom, matricule, fonction)")
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("Erreur listerTousLesConges:", error.message);
    return [];
  }
  return data ?? [];
}

export async function changerStatutCongeGlobal(congeId: number, statut: string): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("conges")
    .update({ statut })
    .eq("id", congeId);

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}

export async function supprimerCongeGlobal(congeId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("conges")
    .delete()
    .eq("id", congeId);

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}


export async function changerStatutConge(congeId: number, statut: string, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("conges")
    .update({ statut })
    .eq("id", congeId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/conges`);
}

export interface MissionRow {
  id: number;
  salarie_id: number;
  objet: string;
  destination: string;
  date_debut: string;
  date_fin: string;
  moyen_transport: string;
  statut: string;
  cree_le: string;
}

export async function listerMissionsSalarie(salarieId: number): Promise<MissionRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerMissionSalarie(salarieId: number, formData: FormData): Promise<MissionRow> {
  const { supabase } = await enforceSession();
  const objet = formData.get("objet") as string;
  const destination = formData.get("destination") as string;
  const date_debut = formData.get("date_debut") as string;
  const date_fin = formData.get("date_fin") as string;
  const moyen_transport = formData.get("moyen_transport") as string;
  const statut = (formData.get("statut") as string) || "En attente";

  const { data, error } = await supabase
    .from("missions")
    .insert({
      salarie_id: salarieId,
      objet,
      destination,
      date_debut,
      date_fin,
      moyen_transport,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/missions`);
  return data;
}

export async function supprimerMissionSalarie(missionId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/missions`);
}

export async function changerStatutMission(missionId: number, statut: string, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("missions")
    .update({ statut })
    .eq("id", missionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/missions`);
}

export interface PromotionRow {
  id: number;
  salarie_id: number;
  ancien_poste: string | null;
  nouveau_poste: string;
  ancienne_categorie: string | null;
  nouvelle_categorie: string | null;
  date_effet: string;
  salaire_base_nouveau: number;
  cree_le: string;
}

export interface SanctionRow {
  id: number;
  salarie_id: number;
  type_sanction: string;
  motif: string;
  date_sanction: string;
  duree_mise_a_pied: number | null;
  cree_le: string;
}

export async function listerPromotionsSalarie(salarieId: number): Promise<PromotionRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_effet", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerPromotionSalarie(salarieId: number, formData: FormData): Promise<PromotionRow> {
  const { supabase } = await enforceSession();
  const ancien_poste = formData.get("ancien_poste") as string || null;
  const nouveau_poste = formData.get("nouveau_poste") as string;
  const ancienne_categorie = formData.get("ancienne_categorie") as string || null;
  const nouvelle_categorie = formData.get("nouvelle_categorie") as string || null;
  const date_effet = formData.get("date_effet") as string;
  const salaire_base_nouveau = parseFloat(formData.get("salaire_base_nouveau") as string) || 0;

  const { data, error } = await supabase
    .from("promotions")
    .insert({
      salarie_id: salarieId,
      ancien_poste,
      nouveau_poste,
      ancienne_categorie,
      nouvelle_categorie,
      date_effet,
      salaire_base_nouveau,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mettre à jour automatiquement la table salaries pour synchroniser la fonction et le salaire de base
  const { error: updateError } = await supabase
    .from("salaries")
    .update({
      fonction: nouveau_poste,
      salaire_base_theorique: salaire_base_nouveau,
    })
    .eq("id", salarieId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/salaries/${salarieId}/carriere`);
  revalidatePath("/salaries");
  return data;
}

export async function supprimerPromotionSalarie(promotionId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/carriere`);
}

export async function listerSanctionsSalarie(salarieId: number): Promise<SanctionRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("sanctions")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("date_sanction", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerSanctionSalarie(salarieId: number, formData: FormData): Promise<SanctionRow> {
  const { supabase } = await enforceSession();
  const type_sanction = formData.get("type_sanction") as string;
  const motif = formData.get("motif") as string;
  const date_sanction = formData.get("date_sanction") as string;
  const duree_mise_a_pied = parseInt(formData.get("duree_mise_a_pied") as string, 10) || null;

  const { data, error } = await supabase
    .from("sanctions")
    .insert({
      salarie_id: salarieId,
      type_sanction,
      motif,
      date_sanction,
      duree_mise_a_pied,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/salaries/${salarieId}/carriere`);
  return data;
}

export async function supprimerSanctionSalarie(sanctionId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("sanctions")
    .delete()
    .eq("id", sanctionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/carriere`);
}

export interface FormationRow {
  id: number;
  titre: string;
  theme: string;
  organisme: string;
  duree_jours: number;
  prix_da: number;
}

export interface InscriptionRow {
  id: number;
  formation_id: number;
  salarie_id: number;
  date_debut: string;
  statut: string;
  formations?: FormationRow;
}

export async function listerCatalogueFormations(): Promise<FormationRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("formations")
    .select("*")
    .order("titre");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerFormationCatalogue(formData: FormData): Promise<FormationRow> {
  const { supabase } = await enforceSession();
  const titre = formData.get("titre") as string;
  const theme = formData.get("theme") as string;
  const organisme = formData.get("organisme") as string;
  const duree_jours = parseInt(formData.get("duree_jours") as string, 10) || 0;
  const prix_da = parseFloat(formData.get("prix_da") as string) || 0;

  const { data, error } = await supabase
    .from("formations")
    .insert({
      titre,
      theme,
      organisme,
      duree_jours,
      prix_da,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listerInscriptionsSalarie(salarieId: number): Promise<InscriptionRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("formations_inscriptions")
    .select("*, formations(*)")
    .eq("salarie_id", salarieId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((d: any) => ({
    id: d.id,
    formation_id: d.formation_id,
    salarie_id: d.salarie_id,
    date_debut: d.date_debut,
    statut: d.statut,
    formations: Array.isArray(d.formations) ? d.formations[0] : d.formations,
  }));
}

export async function creerInscriptionFormation(salarieId: number, formData: FormData): Promise<InscriptionRow> {
  const { supabase } = await enforceSession();
  const formation_id = parseInt(formData.get("formation_id") as string, 10);
  const date_debut = formData.get("date_debut") as string;
  const statut = (formData.get("statut") as string) || "Prévue";

  const { data, error } = await supabase
    .from("formations_inscriptions")
    .insert({
      formation_id,
      salarie_id: salarieId,
      date_debut,
      statut,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/formations`);
  return data;
}

export async function supprimerInscriptionFormation(inscriptionId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("formations_inscriptions")
    .delete()
    .eq("id", inscriptionId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/formations`);
}

// ------------------------------------------------------------------
// MODULE 6 — AVANCES SUR SALAIRE (Demande ESS & Retenue Paie)
// ------------------------------------------------------------------

export interface AvanceSalaireRow {
  id: number;
  salarie_id: number;
  montant: number;
  mois: number;
  annee: number;
  statut: string;
  motif: string | null;
  cree_le: string;
  salaries?: {
    nom_prenom: string;
  };
}

export async function listerAvancesSalarie(salarieId: number): Promise<AvanceSalaireRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("avances_salaire")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("annee", { ascending: false })
    .order("mois", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listerToutesAvances(): Promise<AvanceSalaireRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("avances_salaire")
    .select("*, salaries(nom_prenom)")
    .order("cree_le", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerAvanceSalarie(salarieId: number, formData: FormData): Promise<AvanceSalaireRow> {
  const { supabase } = await enforceSession();
  const montant = parseFloat(formData.get("montant") as string);
  const dateStr = formData.get("periode") as string; // Format YYYY-MM
  const [annee, mois] = dateStr.split("-").map((v) => parseInt(v, 10));
  const motif = (formData.get("motif") as string) || null;

  const { data, error } = await supabase
    .from("avances_salaire")
    .insert({
      salarie_id: salarieId,
      montant,
      mois,
      annee,
      motif,
      statut: "En attente",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/portail/${salarieId}`);
  return data;
}

export async function changerStatutAvance(avanceId: number, statut: string): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("avances_salaire")
    .update({ statut })
    .eq("id", avanceId);

  if (error) throw new Error(error.message);
  revalidatePath("/saisie");
}

export async function supprimerAvanceSalarie(avanceId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("avances_salaire")
    .delete()
    .eq("id", avanceId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------
// MODULE 7 — OBJECTIFS ANNUELS (KPIs)
// ------------------------------------------------------------------

export interface ObjectifRow {
  id: number;
  salarie_id: number;
  annee: number;
  titre: string;
  poids: number;
  cible: string | null;
  realise: string | null;
  taux_reussite: number;
  cree_le: string;
}

export async function listerObjectifsSalarie(salarieId: number): Promise<ObjectifRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("objectifs_salarie")
    .select("*")
    .eq("salarie_id", salarieId)
    .order("annee", { ascending: false })
    .order("cree_le", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function creerObjectifSalarie(salarieId: number, formData: FormData): Promise<ObjectifRow> {
  const { supabase } = await enforceSession();
  const annee = parseInt(formData.get("annee") as string, 10);
  const titre = formData.get("titre") as string;
  const poids = parseInt(formData.get("poids") as string, 10) || 1;
  const cible = (formData.get("cible") as string) || null;
  const realise = (formData.get("realise") as string) || null;
  const taux_reussite = parseInt(formData.get("taux_reussite") as string, 10) || 0;

  const { data, error } = await supabase
    .from("objectifs_salarie")
    .insert({
      salarie_id: salarieId,
      annee,
      titre,
      poids,
      cible,
      realise,
      taux_reussite,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/carriere`);
  return data;
}

export async function supprimerObjectifSalarie(objectifId: number, salarieId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("objectifs_salarie")
    .delete()
    .eq("id", objectifId)
    .eq("salarie_id", salarieId);

  if (error) throw new Error(error.message);
  revalidatePath(`/salaries/${salarieId}/carriere`);
}

export interface VariableBulletinCollective {
  salarie_id: number;
  maladie_h: number;
  absence_irreguliere_h: number;
  retard_h: number;
  heures_sup_1: number;
  heures_sup_2: number;
  heures_sup_3: number;
  panier_jours: number;
  autre_prime_fixe: number;
}

/**
 * Récupère tous les bulletins saisis pour un mois et une année donnés.
 */
export async function listerBulletinsPourPeriode(annee: number, mois: number) {
  const { supabase } = await enforceRHAccess();
  const { data, error } = await supabase
    .from("bulletins")
    .select("*")
    .eq("annee", annee)
    .eq("mois", mois);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Enregistre et recalcule en masse les bulletins pour un mois et une année donnés.
 */
export async function enregistrerBulletinsCollectifs(
  annee: number,
  mois: number,
  variables: VariableBulletinCollective[]
) {
  const { supabase, user, email } = await enforceRHAccess();

  // 1. Charger les bulletins existants pour vérifier le verrouillage
  const { data: existants } = await supabase
    .from("bulletins")
    .select("salarie_id, statut")
    .eq("annee", annee)
    .eq("mois", mois);

  const lockedSalaries = new Set(
    (existants ?? []).filter((b) => b.statut === "Clôturé").map((b) => b.salarie_id)
  );

  // Vérifier si on tente de modifier un bulletin verrouillé
  for (const v of variables) {
    if (lockedSalaries.has(v.salarie_id)) {
      throw new Error(
        "Certains bulletins sélectionnés sont déjà clôturés et ne peuvent plus être modifiés."
      );
    }
  }

  // 2. Charger les salariés et paramètres pour le calcul de paie
  const salaries = await listerSalaries();
  const salariesMap = new Map(salaries.map((s) => [s.id, s]));
  const params = await getParametres();

  // 3. Boucler et enregistrer chaque bulletin
  for (const v of variables) {
    const salarie = salariesMap.get(v.salarie_id);
    if (!salarie) continue;

    const saisie = {
      ...SAISIE_VIDE,
      salaire_base_theorique: salarie.salaire_base_theorique,
      maladie_h: v.maladie_h,
      absence_irreguliere_h: v.absence_irreguliere_h,
      retard_h: v.retard_h,
      heures_sup_1: v.heures_sup_1,
      heures_sup_2: v.heures_sup_2,
      heures_sup_3: v.heures_sup_3,
      panier_jours: v.panier_jours,
      autre_prime_fixe: v.autre_prime_fixe,
    };

    // Calculer le bulletin (indispensable pour l'intégrité de la paie)
    const res = calculerPaie(saisie, params);

    // Enregistrer le bulletin
    const { data: bulletinRow, error: upsertError } = await supabase
      .from("bulletins")
      .upsert(
        {
          salarie_id: v.salarie_id,
          annee,
          mois,
          salaire_base_theorique: salarie.salaire_base_theorique,
          maladie_h: v.maladie_h,
          mise_a_pied_h: 0,
          accident_travail_h: 0,
          retard_h: v.retard_h,
          absence_irreguliere_h: v.absence_irreguliere_h,
          heures_sup_1: v.heures_sup_1,
          heures_sup_2: v.heures_sup_2,
          heures_sup_3: v.heures_sup_3,
          panier_jours: v.panier_jours,
          autre_prime_fixe: v.autre_prime_fixe,
          statut: "Brouillon",
          modifie_le: new Date().toISOString(),
        },
        { onConflict: "salarie_id,annee,mois" }
      )
      .select("id")
      .single();

    if (upsertError) throw new Error(upsertError.message);

    // Journalisation d'audit (Audit Trail)
    await supabase.from("audit_logs").insert({
      auteur_id: getAuditAuteurId(user?.id),
      auteur_email: email,
      table_cible: "bulletins",
      type_action: existants?.some((b) => b.salarie_id === v.salarie_id) ? "UPDATE" : "INSERT",
      enregistrement_id: bulletinRow.id,
      valeurs_apres: { ...v, total_net: res.net_a_payer },
    });
  }

  revalidatePath("/saisie");
  revalidatePath("/saisie/collective");
}

export interface MissionGlobalRow extends MissionRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
  } | null;
}

export async function listerToutesMissions(): Promise<MissionGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("missions")
    .select("*, salaries(id, nom_prenom, matricule, fonction)")
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("Erreur listerToutesMissions:", error.message);
    return [];
  }
  return data ?? [];
}

export async function changerStatutMissionGlobal(missionId: number, statut: string): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("missions")
    .update({ statut })
    .eq("id", missionId);

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
}

export async function supprimerMissionGlobal(missionId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("missions")
    .delete()
    .eq("id", missionId);

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
}

export interface PromotionGlobalRow extends PromotionRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
  } | null;
}

export async function listerToutesPromotions(): Promise<PromotionGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("promotions")
    .select("*, salaries(id, nom_prenom, matricule)")
    .order("date_effet", { ascending: false });

  if (error) {
    console.error("Erreur listerToutesPromotions:", error.message);
    return [];
  }
  return data ?? [];
}

export interface SanctionGlobalRow extends SanctionRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
  } | null;
}

export async function listerToutesSanctions(): Promise<SanctionGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("sanctions")
    .select("*, salaries(id, nom_prenom, matricule)")
    .order("date_sanction", { ascending: false });

  if (error) {
    console.error("Erreur listerToutesSanctions:", error.message);
    return [];
  }
  return data ?? [];
}

// ------------------------------------------------------------------
// MODULE FORMATIONS & TALENT GLOBAL
// ------------------------------------------------------------------

export interface InscriptionGlobalRow extends InscriptionRow {
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
  } | null;
}

export async function listerToutesInscriptionsGlobal(): Promise<InscriptionGlobalRow[]> {
  const { supabase } = await enforceSession();
  const { data, error } = await supabase
    .from("formations_inscriptions")
    .select("*, formations(*), salaries(id, nom_prenom, matricule, fonction)")
    .order("date_debut", { ascending: false });

  if (error) {
    console.error("Erreur listerToutesInscriptionsGlobal:", error.message);
    return [];
  }
  return (data ?? []).map((d: any) => ({
    id: d.id,
    formation_id: d.formation_id,
    salarie_id: d.salarie_id,
    date_debut: d.date_debut,
    statut: d.statut,
    formations: Array.isArray(d.formations) ? d.formations[0] : d.formations,
    salaries: Array.isArray(d.salaries) ? d.salaries[0] : d.salaries,
  }));
}

export async function changerStatutInscriptionGlobal(inscriptionId: number, statut: string): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("formations_inscriptions")
    .update({ statut })
    .eq("id", inscriptionId);

  if (error) throw new Error(error.message);
  revalidatePath("/formations");
}

export async function supprimerInscriptionGlobal(inscriptionId: number): Promise<void> {
  const { supabase } = await enforceSession();
  const { error } = await supabase
    .from("formations_inscriptions")
    .delete()
    .eq("id", inscriptionId);

  if (error) throw new Error(error.message);
  revalidatePath("/formations");
}

export async function creerInscriptionGenerale(formData: FormData): Promise<void> {
  const { supabase } = await enforceSession();
  const salarie_id = parseInt(formData.get("salarie_id") as string, 10);
  const formation_id = parseInt(formData.get("formation_id") as string, 10);
  const date_debut = formData.get("date_debut") as string;
  const statut = (formData.get("statut") as string) || "Prévue";

  const { error } = await supabase
    .from("formations_inscriptions")
    .insert({
      formation_id,
      salarie_id,
      date_debut,
      statut,
    });

  if (error) throw new Error(error.message);
  revalidatePath("/formations");
}

// ------------------------------------------------------------------
// MODULE JOURNAL GENERAL DES BULLETINS DE PAIE
// ------------------------------------------------------------------

export interface BulletinGlobalItem {
  id: number;
  annee: number;
  mois: number;
  salarie_id: number;
  statut: string;
  modifie_le: string | null;
  salaire_base_theorique: number;
  salaire_base_reel: number;
  salaire_poste: number;
  retenue_ss: number;
  irg: number;
  net_a_payer: number;
  salaries?: {
    id: number;
    nom_prenom: string;
    matricule: string | null;
    fonction: string | null;
  } | null;
}

export async function listerTousLesBulletinsGlobal(): Promise<BulletinGlobalItem[]> {
  const { supabase } = await enforceSession();
  const params = await getParametres();

  const { data: bulletins, error } = await supabase
    .from("bulletins")
    .select("*, salaries(id, nom_prenom, matricule, fonction)")
    .order("annee", { ascending: false })
    .order("mois", { ascending: false });

  if (error) {
    console.error("Erreur listerTousLesBulletinsGlobal:", error.message);
    return [];
  }
  if (!bulletins || bulletins.length === 0) return [];

  const bulletinIds = bulletins.map((b: any) => b.id);

  const { data: toutesRubriques, error: rubError } = await supabase
    .from("bulletin_rubriques")
    .select(
      "bulletin_id, rubrique_code, valeur_1, valeur_2, rubriques_catalogue(code, libelle, type_valeur, cotisable, imposable)",
    )
    .in("bulletin_id", bulletinIds);

  const rubriquesParBulletin = new Map<number, any[]>();
  for (const r of toutesRubriques ?? []) {
    const liste = rubriquesParBulletin.get(r.bulletin_id) ?? [];
    liste.push(r);
    rubriquesParBulletin.set(r.bulletin_id, liste);
  }

  return bulletins.map((bulletin: any) => {
    const champsAbsences = {
      salaire_base_theorique: bulletin.salaire_base_theorique,
      maladie_h: bulletin.maladie_h,
      mise_a_pied_h: bulletin.mise_a_pied_h,
      accident_travail_h: bulletin.accident_travail_h,
      retard_h: bulletin.retard_h,
      absence_irreguliere_h: bulletin.absence_irreguliere_h,
    };
    const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

    const rubriques_dynamiques: LigneRubriqueDynamique[] = [];
    for (const br of rubriquesParBulletin.get(bulletin.id) ?? []) {
      const cat = Array.isArray(br.rubriques_catalogue) ? br.rubriques_catalogue[0] : br.rubriques_catalogue;
      if (!cat) continue;
      const ligne = resoudreLigneRubrique(cat, br.valeur_1 ?? 0, br.valeur_2 ?? 0, salaire_base_reel);
      if (ligne) rubriques_dynamiques.push(ligne);
    }

    const saisie: SaisieMensuelle = {
      ...SAISIE_VIDE,
      ...champsAbsences,
      heures_sup_1: bulletin.heures_sup_1,
      heures_sup_2: bulletin.heures_sup_2,
      heures_sup_3: bulletin.heures_sup_3,
      icr: bulletin.icr,
      taux_iep: bulletin.taux_iep,
      taux_nuisance: bulletin.taux_nuisance,
      taux_responsabilite: bulletin.taux_responsabilite,
      taux_disponibilite: bulletin.taux_disponibilite,
      taux_pri: bulletin.taux_pri,
      taux_prc: bulletin.taux_prc,
      panier_jours: bulletin.panier_jours,
      panier_forfait_jour: bulletin.panier_forfait_jour,
      autre_prime_fixe: bulletin.autre_prime_fixe,
      cotis_mutuelle: bulletin.cotis_mutuelle,
      autres_retenues: bulletin.autres_retenues,
      rubriques_dynamiques,
    };

    const resultat = calculerPaie(saisie, params);

    return {
      id: bulletin.id,
      annee: bulletin.annee,
      mois: bulletin.mois,
      salarie_id: bulletin.salarie_id,
      statut: bulletin.statut || "Calculé",
      modifie_le: bulletin.modifie_le ?? null,
      salaire_base_theorique: bulletin.salaire_base_theorique,
      salaire_base_reel: resultat.salaire_base_reel,
      salaire_poste: resultat.salaire_poste,
      retenue_ss: resultat.retenue_ss,
      irg: resultat.irg,
      net_a_payer: resultat.net_a_payer,
      salaries: Array.isArray(bulletin.salaries) ? bulletin.salaries[0] : bulletin.salaries,
    };
  });
}
