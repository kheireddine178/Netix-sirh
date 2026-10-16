/**
 * Conversion d'un montant en Dinars Algériens (DA) en toutes lettres
 * Règle officielle pour les bulletins de paie et ordres de virement algériens.
 */

const UNITES = [
  "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"
];

const DIZAINES = [
  "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"
];

function convertMoinsDeCent(n: number): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;

  if (d === 7) {
    if (u === 1) return "soixante-et-onze";
    return `soixante-${UNITES[10 + u]}`;
  }

  if (d === 8) {
    if (u === 0) return "quatre-vingts";
    return `quatre-vingt-${UNITES[u]}`;
  }

  if (d === 9) {
    return `quatre-vingt-${UNITES[10 + u]}`;
  }

  if (u === 0) return DIZAINES[d];
  if (u === 1) return `${DIZAINES[d]}-et-un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}

function convertCentaines(n: number): string {
  if (n < 100) return convertMoinsDeCent(n);
  const c = Math.floor(n / 100);
  const r = n % 100;

  let prefix = "";
  if (c === 1) {
    prefix = "cent";
  } else {
    prefix = `${UNITES[c]} cent`;
    if (r === 0) prefix += "s";
  }

  if (r === 0) return prefix;
  return `${prefix} ${convertMoinsDeCent(r)}`;
}

function convertNombreEntier(n: number): string {
  if (n === 0) return "zéro";

  const millions = Math.floor(n / 1000000);
  const resteMillions = n % 1000000;
  const milliers = Math.floor(resteMillions / 1000);
  const unites = resteMillions % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push("un million");
    } else {
      parts.push(`${convertCentaines(millions)} millions`);
    }
  }

  if (milliers > 0) {
    if (milliers === 1) {
      parts.push("mille");
    } else {
      parts.push(`${convertCentaines(milliers)} mille`);
    }
  }

  if (unites > 0) {
    parts.push(convertCentaines(unites));
  }

  return parts.join(" ");
}

/**
 * Convertit un montant monétaire en toutes lettres en Dinars Algériens
 * Ex: 48222.30 -> "quarante-huit mille deux cent vingt-deux dinars algériens et trente centimes"
 */
export function montantEnLettresDA(montant: number): string {
  if (isNaN(montant) || !isFinite(montant)) return "zéro dinar algérien";

  const arrondi = Math.round(montant * 100) / 100;
  const dinars = Math.floor(arrondi);
  const centimes = Math.round((arrondi - dinars) * 100);

  const texteDinars = convertNombreEntier(dinars);
  const plurielDinar = dinars > 1 ? "dinars" : "dinar";

  let resultat = `${texteDinars} ${plurielDinar} algériens`;

  if (centimes > 0) {
    const texteCentimes = convertNombreEntier(centimes);
    const plurielCentime = centimes > 1 ? "centimes" : "centime";
    resultat += ` et ${texteCentimes} ${plurielCentime}`;
  }

  // Première lettre en majuscule
  return resultat.charAt(0).toUpperCase() + resultat.slice(1);
}
