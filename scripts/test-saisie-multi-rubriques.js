/**
 * Test de validation de la saisie de paie avec plusieurs rubriques
 * Simule exactement les données transmises par le formulaire /saisie
 */
const path = require("path");
let jitiFactory;
try {
  jitiFactory = require("jiti");
} catch {
  jitiFactory = require(path.resolve(__dirname, "../../sirh-app/node_modules/jiti"));
}
const jiti = jitiFactory(__filename);

const { 
  calculerPaie, 
  calculerBaseAvantRubriques, 
  categorieRubrique,
  PARAMETRES_PAR_DEFAUT, 
  SAISIE_VIDE 
} = jiti(path.resolve(__dirname, "../lib/paieCalcul.ts"));
const { 
  resoudreLigneRubrique, 
} = jiti(path.resolve(__dirname, "../lib/rubriquesDynamiques.ts"));

console.log("================================================================================");
console.log("       TEST VALIDATION SAISIE PAIE MULTI-RUBRIQUES (NETIX SIRH)                 ");
console.log("================================================================================");

// Simulation d'un salarié avec salaire de base 50 000 DA
const salaire_base = 50000;
const champsAbsences = {
  salaire_base_theorique: salaire_base,
  maladie_h: 0,
  mise_a_pied_h: 0,
  accident_travail_h: 0,
  retard_h: 0,
  absence_irreguliere_h: 0,
};

const params = PARAMETRES_PAR_DEFAUT;
const { salaire_base_reel } = calculerBaseAvantRubriques(champsAbsences, params);

// Multi-rubriques testées :
// 1. R280 : Indemnité de nuisance (Pourcentage 6% -> 3 000 DA, cotisable, imposable)
// 2. R522 : Panier (Nombre x taux : 22j x 500 DA = 11 000 DA, non cotisable, imposable)
// 3. R264 : I.C.R (Montant fixe : 3 000 DA, cotisable, imposable)
// 4. R726 : Cotisation Mutuelle (Retenue fixe : 500 DA, retenue)
// 5. R318 : P.R.I (Pourcentage 10% -> 5 000 DA, cotisable, imposable)
// 6. R320 : P.R.C (Pourcentage 30% -> 15 000 DA, cotisable, imposable)
const catalogueRubriques = [
  { code: "R280", libelle: "INDEMNITE DE NUISANCE", type_valeur: "Gain (+)", cotisable: true, imposable: "irg" },
  { code: "R522", libelle: "PANIER", type_valeur: "Gain (+)", cotisable: false, imposable: "irg" },
  { code: "R264", libelle: "I.C.R", type_valeur: "Gain (+)", cotisable: true, imposable: "irg" },
  { code: "R726", libelle: "COTISATION MUTUELLE", type_valeur: "Retenue (-)", cotisable: false, imposable: "non_imposable" },
  { code: "R318", libelle: "P.R.I", type_valeur: "Gain (+)", cotisable: true, imposable: "irg" },
  { code: "R320", libelle: "P.R.C", type_valeur: "Gain (+)", cotisable: true, imposable: "irg" },
];

// Saisie utilisateur dans le formulaire (UI)
const saisieUtilisateur = [
  { code: "R280", valeur_1: 6, valeur_2: 0 },       // Saisi 6 dans le champ %
  { code: "R522", valeur_1: 22, valeur_2: 500 },    // Saisi 22 jours et 500 DA
  { code: "R264", valeur_1: 3000, valeur_2: 0 },    // Saisi 3000 DA
  { code: "R726", valeur_1: 500, valeur_2: 0 },     // Saisi 500 DA (Retenue)
  { code: "R318", valeur_1: 10, valeur_2: 0 },      // Saisi 10 dans le champ %
  { code: "R320", valeur_1: 30, valeur_2: 0 },      // Saisi 30 dans le champ %
];

console.log("\n1. Résolution des lignes multi-rubriques :");
const rubriques_dynamiques = [];

for (const s of saisieUtilisateur) {
  const cat = catalogueRubriques.find(c => c.code === s.code);
  const categorie = categorieRubrique(s.code);
  const rawV1 = s.valeur_1;
  const v1 = categorie === "pourcentage" ? (rawV1 > 1 ? rawV1 / 100 : rawV1) : rawV1;
  const v2 = categorie === "nombre_x_taux" ? s.valeur_2 : 0;
  
  const ligne = resoudreLigneRubrique(cat, v1, v2, salaire_base_reel);
  if (ligne) {
    rubriques_dynamiques.push(ligne);
    console.log(`  ✓ Rubrique [${ligne.code}] ${ligne.libelle.padEnd(25)} : ${ligne.type_valeur === "Retenue (-)" ? "-" : "+"}${ligne.montant.toFixed(2)} DA (${ligne.type_valeur})`);
  }
}

// Vérifications des montants individuels
const r280 = rubriques_dynamiques.find(r => r.code === "R280");
const r522 = rubriques_dynamiques.find(r => r.code === "R522");
const r264 = rubriques_dynamiques.find(r => r.code === "R264");
const r726 = rubriques_dynamiques.find(r => r.code === "R726");
const r318 = rubriques_dynamiques.find(r => r.code === "R318");
const r320 = rubriques_dynamiques.find(r => r.code === "R320");

if (Math.abs(r280.montant - 3000) > 0.01) throw new Error("Erreur R280 6%: attendu 3000 DA, reçu " + r280.montant);
if (Math.abs(r522.montant - 11000) > 0.01) throw new Error("Erreur R522: attendu 11000 DA, reçu " + r522.montant);
if (Math.abs(r264.montant - 3000) > 0.01) throw new Error("Erreur R264: attendu 3000 DA, reçu " + r264.montant);
if (Math.abs(r726.montant - 500) > 0.01) throw new Error("Erreur R726: attendu 500 DA, reçu " + r726.montant);
if (Math.abs(r318.montant - 5000) > 0.01) throw new Error("Erreur R318 10%: attendu 5000 DA, reçu " + r318.montant);
if (Math.abs(r320.montant - 15000) > 0.01) throw new Error("Erreur R320 30%: attendu 15000 DA, reçu " + r320.montant);

console.log("\n2. Calcul du bulletin complet avec le moteur de paie :");
const saisie = {
  ...SAISIE_VIDE,
  ...champsAbsences,
  rubriques_dynamiques,
};

const resultat = calculerPaie(saisie, params);

console.log(`  - Salaire de base réel : ${resultat.salaire_base_reel.toFixed(2)} DA`);
console.log(`  - Total gains rubriques: ${resultat.total_rubriques_gains_da.toFixed(2)} DA`);
console.log(`  - Total retenues rubr. : ${resultat.total_rubriques_retenues_da.toFixed(2)} DA`);
console.log(`  - Salaire BRUT total   : ${resultat.total_gains.toFixed(2)} DA`);
console.log(`  - Assiette CNAS (9%)   : ${resultat.base_cnas.toFixed(2)} DA (Retenue CNAS: ${resultat.retenue_cnas.toFixed(2)} DA)`);
console.log(`  - Base imposable IRG   : ${resultat.base_imposable_irg.toFixed(2)} DA (Retenue IRG: ${resultat.retenue_irg_nette.toFixed(2)} DA)`);
console.log(`  - TOTAL RETENUES       : ${resultat.total_retenues.toFixed(2)} DA`);
console.log(`  - NET À PAYER          : ${resultat.net_a_payer.toFixed(2)} DA`);

// Vérification de la logique fiscale et sociale :
// Gains = 50000 (base) + 3000 (R280) + 11000 (R522) + 3000 (R264) + 5000 (R318) + 15000 (R320) = 87 000 DA
if (Math.abs(resultat.total_gains - 87000) > 0.01) {
  throw new Error("Brut attendu 87000 DA, reçu " + resultat.total_gains);
}

// Base CNAS = Base (50000) + R280 (3000) + R264 (3000) + R318 (5000) + R320 (15000) = 76 000 DA (Panier R522 non cotisable)
if (Math.abs(resultat.base_cnas - 76000) > 0.01) {
  throw new Error("Base CNAS attendue 76000 DA, reçu " + resultat.base_cnas);
}

// Retenue CNAS = 76000 * 9% = 6840 DA
if (Math.abs(resultat.retenue_cnas - 6840) > 0.01) {
  throw new Error("Retenue CNAS attendue 6840 DA, reçu " + resultat.retenue_cnas);
}

// Total retenues doit inclure la retenue mutuelle de 500 DA
if (resultat.total_retenues < 6840 + 500) {
  throw new Error("Les retenues ne contiennent pas la mutuelle");
}

console.log("\n================================================================================");
console.log("  >>> TEST RÉUSSI AVEC SUCCÈS : TOUTES LES RUBRIQUES SONT VALIDÉES À 100% <<<    ");
console.log("================================================================================");
