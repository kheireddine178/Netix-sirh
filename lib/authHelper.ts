import { createClient } from "./supabaseServer";

export async function checkPortalAccess(salarieId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non autorisé. Veuillez vous connecter.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, salarie_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profil introuvable.");
  }

  // Vérification stricte : un salarié ne peut voir que son propre portail
  if (profile.role === "Salarie" && profile.salarie_id !== salarieId) {
    throw new Error("Accès 403 interdit. Vous ne pouvez consulter que votre propre profil.");
  }

  return { user, profile };
}

export async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non autorisé. Veuillez vous connecter.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, salarie_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profil introuvable.");
  }

  // Vérification stricte : le rôle salarié est interdit d'accès à l'administration
  if (profile.role === "Salarie") {
    throw new Error("Accès 403 interdit. Réservé aux administrateurs.");
  }

  return { user, profile };
}

