/**
 * Résolution des rubriques dynamiques du catalogue (402 codes, étape 7).
 *
 * Traduit une ligne du catalogue `rubriques_catalogue` (colonnes texte, en français,
 * telles qu'importées depuis Rubriques_DLG.xlsx) + une valeur saisie en un objet
 * `LigneRubriqueDynamique` consommé par `calculerPaie()` dans lib/paieCalcul.ts.
 *
 * Valeurs réellement présentes dans le catalogue (vérifiées sur le fichier source) :
 *   - cotisable  : "OUI" | "non" | null
 *   - imposable  : "Imp. IRG" | "Imp. 10%" | "non" | null
 *   - type_valeur (pour les codes saisissables) : "Gain (+)" | "Retenue (-)"
 */

import {
  categorieRubrique,
  type CategorieRubrique,
  type LigneRubriqueDynamique,
} from "./paieCalcul";

export interface RubriqueCatalogueRow {
  code: string;
  libelle: string | null;
  type_valeur: string | null;
  cotisable: string | null;
  imposable: string | null;
}

export function estCotisableCnas(catalogue: Pick<RubriqueCatalogueRow, "cotisable">): boolean {
  if (typeof catalogue.cotisable === "boolean") return catalogue.cotisable;
  return (catalogue.cotisable || "").toString().trim().toUpperCase() === "OUI";
}

export function imposabiliteRubrique(
  catalogue: Pick<RubriqueCatalogueRow, "imposable">,
): "irg" | "dix_pct" | "non_imposable" {
  if (typeof catalogue.imposable === "boolean") return catalogue.imposable ? "irg" : "non_imposable";
  const v = (catalogue.imposable || "").toString().trim().toLowerCase();
  if (v.includes("irg")) return "irg";
  if (v.includes("10")) return "dix_pct";
  return "non_imposable";
}

/**
 * Construit une LigneRubriqueDynamique à partir d'une ligne de catalogue et des valeurs
 * saisies (valeur_1 / valeur_2 — cf. table `bulletin_rubriques`), selon sa catégorie
 * (categorieRubrique() dans paieCalcul.ts) :
 *   - pourcentage     : montant = base x valeur_1 (valeur_1 est une fraction, ex 0.05 = 5%)
 *   - nombre_x_taux   : montant = valeur_1 (nombre) x valeur_2 (taux/forfait unitaire)
 *   - montant_fixe    : montant = valeur_1 (DA saisis directement)
 *   - regularisation  : montant = |valeur_1|, signe déterminant gain (+) ou retenue (-)
 *
 * `base` : montant de référence pour la catégorie "pourcentage" — le salaire de base réel
 * du mois par défaut (cf. calculerBaseAvantRubriques() dans paieCalcul.ts).
 *
 * Retourne `null` si le montant résultant est nul (rubrique non saisie ce mois-ci) :
 * elle est alors simplement omise du calcul, comme dans la version Python d'origine.
 */
export function resoudreLigneRubrique(
  catalogue: RubriqueCatalogueRow,
  valeur1: number,
  valeur2: number,
  base: number,
): LigneRubriqueDynamique | null {
  const categorie: CategorieRubrique = categorieRubrique(catalogue.code);
  let montant: number;
  let typeValeur: "Gain (+)" | "Retenue (-)";

  const libelle = catalogue.libelle || "";
  
  if (libelle.includes("R-")) {
    typeValeur = "Retenue (-)";
  } else if (libelle.includes("R+")) {
    typeValeur = "Gain (+)";
  } else if (categorie === "regularisation") {
    // Comportement hérité pour les codes régul si aucun suffixe explicite n'est présent
    typeValeur = valeur1 < 0 ? "Retenue (-)" : "Gain (+)";
  } else {
    typeValeur = catalogue.type_valeur === "Retenue (-)" ? "Retenue (-)" : "Gain (+)";
  }

  if (categorie === "regularisation") {
    montant = Math.abs(valeur1);
  } else {
    if (categorie === "pourcentage") {
      const tauxFraction = Math.abs(valeur1) > 1 ? valeur1 / 100 : valeur1;
      montant = base * tauxFraction;
    } else if (categorie === "nombre_x_taux") {
      montant = valeur1 * valeur2;
    } else {
      // montant_fixe
      montant = valeur1;
    }
  }

  if (!montant) return null;
  
  montant = Math.abs(montant);

  return {
    code: catalogue.code,
    libelle: catalogue.libelle || catalogue.code,
    montant,
    type_valeur: typeValeur,
    cotisable_cnas: estCotisableCnas(catalogue),
    imposable: imposabiliteRubrique(catalogue),
  };
}
