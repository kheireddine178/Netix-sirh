"use server";

import { createClient } from "@/lib/supabaseServer";
import { PARAMETRES_PAR_DEFAUT, type Parametres } from "@/lib/paieCalcul";
import { revalidatePath } from "next/cache";

export async function getParametresComplets(): Promise<Parametres> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("parametres").select("data").eq("id", 1).single();
  if (error || !data) return PARAMETRES_PAR_DEFAUT;
  return data.data as Parametres;
}

/** Lit le barème IRG envoyé sous forme de JSON (un seul champ caché du formulaire). */
function parseBareme(raw: string): [number, number | null, number][] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return PARAMETRES_PAR_DEFAUT.bareme_irg;
    return parsed.map((t: [number | string, number | string | null, number | string]) => [
      Number(t[0]) || 0,
      t[1] === null || t[1] === "" || t[1] === undefined ? null : Number(t[1]),
      Number(t[2]) || 0,
    ]);
  } catch {
    return PARAMETRES_PAR_DEFAUT.bareme_irg;
  }
}

export async function updateParametres(formData: FormData) {
  const supabase = await createClient();
  const payload: Parametres = {
    employeur_nom: (formData.get("employeur_nom") as string) || "",
    employeur_adresse: (formData.get("employeur_adresse") as string) || "",
    employeur_nif: (formData.get("employeur_nif") as string) || "",
    employeur_nis: (formData.get("employeur_nis") as string) || "",
    employeur_affiliation_cnas: (formData.get("employeur_affiliation_cnas") as string) || "",

    snmg: parseFloat(formData.get("snmg") as string) || 0,
    duree_legale_mensuelle: parseFloat(formData.get("duree_legale_mensuelle") as string) || 0,
    // Champs saisis en % dans le formulaire (ex: "9" pour 9%), convertis en fraction (0.09)
    // avant stockage — le moteur de calcul (lib/paieCalcul.ts) continue de recevoir des fractions.
    taux_cnas_salarie: (parseFloat(formData.get("taux_cnas_salarie_pct") as string) || 0) / 100,
    taux_cnas_employeur: (parseFloat(formData.get("taux_cnas_employeur_pct") as string) || 0) / 100,

    majoration_hs_1: parseFloat(formData.get("majoration_hs_1") as string) || 0,
    majoration_hs_2: parseFloat(formData.get("majoration_hs_2") as string) || 0,
    majoration_hs_3: parseFloat(formData.get("majoration_hs_3") as string) || 0,

    bareme_irg: parseBareme(formData.get("bareme_irg_json") as string),

    seuil_exoneration_irg: parseFloat(formData.get("seuil_exoneration_irg") as string) || 0,
    taux_abattement_irg: (parseFloat(formData.get("taux_abattement_irg_pct") as string) || 0) / 100,
    abattement_irg_min: parseFloat(formData.get("abattement_irg_min") as string) || 0,
    abattement_irg_max: parseFloat(formData.get("abattement_irg_max") as string) || 0,
  };

  const { error } = await supabase.from("parametres").upsert({ id: 1, data: payload });
  if (error) throw new Error(error.message);

  revalidatePath("/parametres");
  return payload;
}

export async function reinitialiserParametres(): Promise<Parametres> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("parametres")
    .upsert({ id: 1, data: PARAMETRES_PAR_DEFAUT });
  if (error) throw new Error(error.message);

  revalidatePath("/parametres");
  return PARAMETRES_PAR_DEFAUT;
}
