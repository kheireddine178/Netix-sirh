/**
 * Netix SIRH — Utilitaires UI & Formatage
 * Règle : Ce fichier ne contient aucune logique de calcul de paie.
 */

export function cn(...classes: any[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formatage des montants monétaires en Dinars Algériens (DA)
 * Conforme au cahier des charges (§3.3) :
 * - Format : "75 253,00 DA" (espace comme séparateur de milliers, virgule décimale)
 * - Doit être affiché avec font-variant-numeric: tabular-nums
 */
export function formatDA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0,00 DA";
  }
  const fixed = Math.abs(amount).toFixed(2);
  const parts = fixed.split(".");
  const intWithSpaces = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = amount < 0 ? "-" : "";
  return `${sign}${intWithSpaces},${parts[1]} DA`;
}

/**
 * Formatage des dates au format standard français (JJ/MM/AAAA)
 */
export function formatDateFR(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
