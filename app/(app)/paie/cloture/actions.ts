"use server";

import { enforceRHAccess, listerSalaries } from "../../salaries/actions";
import { revalidatePath } from "next/cache";

export type StatutPeriode = "Brouillon" | "En contrôle" | "Validée" | "Clôturée";

export async function getPeriodeStatut(annee: number, mois: number): Promise<StatutPeriode> {
  const { supabase } = await enforceRHAccess();

  const { data: bulletins, error } = await supabase
    .from("bulletins")
    .select("statut")
    .eq("annee", annee)
    .eq("mois", mois);

  if (error || !bulletins || bulletins.length === 0) {
    return "Brouillon";
  }

  const statuts = bulletins.map((b) => b.statut);
  
  if (statuts.every((s) => s === "Clôturée")) return "Clôturée";
  if (statuts.every((s) => s === "Validée" || s === "Clôturée")) return "Validée";
  if (statuts.some((s) => s === "En contrôle")) return "En contrôle";
  
  return "Brouillon";
}

export async function setPeriodeStatut(annee: number, mois: number, nouveauStatut: StatutPeriode) {
  const { supabase, user, email } = await enforceRHAccess();

  // On met à jour le statut de tous les bulletins de la période
  const { error } = await supabase
    .from("bulletins")
    .update({ statut: nouveauStatut })
    .eq("annee", annee)
    .eq("mois", mois);

  if (error) {
    throw new Error(error.message);
  }

  // Trace d'audit
  await supabase.from("audit_logs").insert({
    auteur_id: user?.id,
    auteur_email: email,
    table_cible: "bulletins",
    type_action: "UPDATE_STATUS",
    enregistrement_id: null,
    valeurs_apres: { annee, mois, statut: nouveauStatut }
  });

  revalidatePath("/paie/cloture");
}

export async function preparerMois(annee: number, mois: number) {
  const { supabase } = await enforceRHAccess();
  // Vérifier s'il y a des bulletins, sinon initialiser
  const { data: existants } = await supabase
    .from("bulletins")
    .select("id")
    .eq("annee", annee)
    .eq("mois", mois)
    .limit(1);

  if (!existants || existants.length === 0) {
    // La préparation pourrait par exemple créer des bulletins "Brouillon"
    // avec salaire de base pour tous les actifs
    // (Non implémenté ici car creerBulletin gère l'upsert)
  }
}
