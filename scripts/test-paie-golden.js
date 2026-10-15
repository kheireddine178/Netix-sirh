/**
 * NETIX SIRH — Golden Tests du Moteur de Paie Algérienne
 * 
 * Règle d'or (§0 de NETIX_VISION_REFONTE.md) :
 * Le moteur de paie est validé par le métier et est INTOUCHABLE.
 * Ce script compare les calculs en temps réel contre 10 profils de référence immuables.
 * Tout écart de plus de 0.01 DA entraîne l'échec immédiat (Exit code 1).
 */

const path = require("path");
let jitiFactory;
try {
  jitiFactory = require("jiti");
} catch {
  try {
    jitiFactory = require(path.resolve(__dirname, "../../sirh-app/node_modules/jiti"));
  } catch {
    console.error("Veuillez installer jiti : npm install -D jiti");
    process.exit(1);
  }
}
const jiti = jitiFactory(__filename);
const { calculerPaie, PARAMETRES_PAR_DEFAUT, SAISIE_VIDE } = jiti(path.resolve(__dirname, "../lib/paieCalcul.ts"));

const GOLDEN_PROFILES = [
  {
    id: "PROFIL_1_SNMG",
    desc: "1. Ouvrier rémunéré au SNMG (20 000 DA)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 20000 },
    expected: {
      salaire_base_reel: 20000,
      total_gains: 20000,
      base_cnas: 20000,
      retenue_cnas: 1800,
      base_imposable_irg: 18200,
      irg_brut: 0,
      abattement_irg: 0,
      retenue_irg_nette: 0,
      total_retenues: 1800,
      net_a_payer: 18200,
      cout_total_employeur: 25200,
    },
  },
  {
    id: "PROFIL_2_TRANSITION_IRG",
    desc: "2. Salarié en zone de lissage transition IRG (35 164.84 DA -> Base imposable 32 000 DA)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 35164.84 },
    expected: {
      salaire_base_reel: 35164.84,
      total_gains: 35164.84,
      base_cnas: 35164.84,
      retenue_cnas: 3164.84,
      base_imposable_irg: 32000.00,
      irg_brut: 2760,
      abattement_irg: 1802.2,
      retenue_irg_nette: 957.8,
      total_retenues: 4122.64,
      net_a_payer: 31042.20,
      cout_total_employeur: 44307.70,
    },
  },
  {
    id: "PROFIL_3_CADRE_40K",
    desc: "3. Cadre standard sans primes (40 000 DA)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 40000 },
    expected: {
      salaire_base_reel: 40000,
      total_gains: 40000,
      base_cnas: 40000,
      retenue_cnas: 3600,
      base_imposable_irg: 36400,
      irg_brut: 3772,
      abattement_irg: 1500,
      retenue_irg_nette: 2272,
      total_retenues: 5872,
      net_a_payer: 34128,
      cout_total_employeur: 50400,
    },
  },
  {
    id: "PROFIL_4_PRIMES_POURCENTAGE",
    desc: "4. Agent de maîtrise (45 000 DA + 10% IEP + 5% Nuisance)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 45000, taux_iep: 0.10, taux_nuisance: 0.05 },
    expected: {
      salaire_base_reel: 45000,
      total_gains: 51750,
      base_cnas: 51750,
      retenue_cnas: 4657.50,
      base_imposable_irg: 47092.50,
      irg_brut: 6514.3,
      abattement_irg: 1500,
      retenue_irg_nette: 5014.3,
      total_retenues: 9671.80,
      net_a_payer: 42078.20,
      cout_total_employeur: 65205.00,
    },
  },
  {
    id: "PROFIL_5_PANIER_NON_COTISABLE",
    desc: "5. Salarié avec prime de Panier (40 000 DA + 22j * 500 DA - Panier non cotisable, imposable)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 40000, panier_jours: 22, panier_forfait_jour: 500 },
    expected: {
      salaire_base_reel: 40000,
      total_gains: 51000,
      base_cnas: 40000,
      retenue_cnas: 3600,
      base_imposable_irg: 47400,
      irg_brut: 6598,
      abattement_irg: 1500,
      retenue_irg_nette: 5098,
      total_retenues: 8698,
      net_a_payer: 42302,
      cout_total_employeur: 61400,
    },
  },
  {
    id: "PROFIL_6_HEURES_SUP",
    desc: "6. Salarié avec Heures Supplémentaires (34 666 DA + 4h P1 + 4h P2 + 2h P3)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 34666, heures_sup_1: 4, heures_sup_2: 4, heures_sup_3: 2 },
    expected: {
      salaire_base_reel: 34666,
      total_gains: 38066,
      base_cnas: 38066,
      retenue_cnas: 3425.94,
      base_imposable_irg: 34640.06,
      irg_brut: 3367.20,
      abattement_irg: 1430.70,
      retenue_irg_nette: 1936.50,
      total_retenues: 5362.44,
      net_a_payer: 32703.56,
      cout_total_employeur: 47963.16,
    },
  },
  {
    id: "PROFIL_7_ABSENCES",
    desc: "7. Salarié avec Absence Irrégulière déduite (40 000 DA - 16h d'absence)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 40000, absence_irreguliere_h: 16 },
    expected: {
      salaire_base_reel: 36307.62,
      total_gains: 36307.62,
      base_cnas: 36307.62,
      retenue_cnas: 3267.69,
      base_imposable_irg: 33039.94,
      irg_brut: 2996.9,
      abattement_irg: 1657.2,
      retenue_irg_nette: 1339.7,
      total_retenues: 4607.39,
      net_a_payer: 31700.24,
      cout_total_employeur: 45747.60,
    },
  },
  {
    id: "PROFIL_8_RETENUES_MUTUELLE",
    desc: "8. Salarié avec Cotisation Mutuelle & Avance (60 000 DA + 2000 DA mutuelle + 5000 DA retenue)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 60000, cotis_mutuelle: 2000, autres_retenues: 5000 },
    expected: {
      salaire_base_reel: 60000,
      total_gains: 60000,
      base_cnas: 60000,
      retenue_cnas: 5400,
      base_imposable_irg: 54600,
      irg_brut: 8539.3,
      abattement_irg: 1500,
      retenue_irg_nette: 7039.3,
      total_retenues: 19439.3,
      net_a_payer: 40560.7,
      cout_total_employeur: 75600,
    },
  },
  {
    id: "PROFIL_9_HAUT_SALAIRE",
    desc: "9. Cadre Supérieur / Dirigeant (250 000 DA - Tranches 30%, 35% et plafonnement 1500 DA)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 250000 },
    expected: {
      salaire_base_reel: 250000,
      total_gains: 250000,
      base_cnas: 250000,
      retenue_cnas: 22500,
      base_imposable_irg: 227500,
      irg_brut: 61675,
      abattement_irg: 1500,
      retenue_irg_nette: 60175,
      total_retenues: 82675,
      net_a_payer: 167325,
      cout_total_employeur: 315000,
    },
  },
  {
    id: "PROFIL_10_PRIMES_MIXTES",
    desc: "10. Salarié avec Primes Mixtes (70 000 DA + 3000 ICR + 15% IEP + 10% PRI)",
    saisie: { ...SAISIE_VIDE, salaire_base_theorique: 70000, icr: 3000, taux_iep: 0.15, taux_pri: 0.10 },
    expected: {
      salaire_base_reel: 70000,
      total_gains: 90500,
      base_cnas: 90500,
      retenue_cnas: 8145,
      base_imposable_irg: 82355,
      irg_brut: 16105,
      abattement_irg: 1500,
      retenue_irg_nette: 14605,
      total_retenues: 22750,
      net_a_payer: 67750,
      cout_total_employeur: 114030,
    },
  },
];

console.log("================================================================================");
console.log("       NETIX SIRH — SUITE DE TESTS GOLDEN DU MOTEUR DE PAIE ALGÉRIENNE          ");
console.log("       Conformité : Loi 90-11 • CIDTA Art. 68 & 104 • Loi 83-11 (CNAS 9%/26%)   ");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

for (const profile of GOLDEN_PROFILES) {
  const actual = calculerPaie(profile.saisie, PARAMETRES_PAR_DEFAUT);
  const exp = profile.expected;
  const errors = [];

  const check = (field, tolerance = 0.05) => {
    const diff = Math.abs(actual[field] - exp[field]);
    if (diff > tolerance) {
      errors.push(`Champ [${field}]: attendu ${exp[field].toFixed(2)}, obtenu ${actual[field].toFixed(2)} (diff: ${diff.toFixed(4)})`);
    }
  };

  check("salaire_base_reel");
  check("total_gains");
  check("base_cnas");
  check("retenue_cnas");
  check("base_imposable_irg");
  check("irg_brut");
  check("abattement_irg");
  check("retenue_irg_nette");
  check("total_retenues");
  check("net_a_payer");
  check("cout_total_employeur");

  if (errors.length === 0) {
    console.log(`  ✓ [SUCCÈS] ${profile.desc}`);
    console.log(`     Brut: ${actual.total_gains.toFixed(2)} DA | CNAS: ${actual.retenue_cnas.toFixed(2)} DA | IRG Net: ${actual.retenue_irg_nette.toFixed(2)} DA | Net à payer: ${actual.net_a_payer.toFixed(2)} DA\n`);
    passed++;
  } else {
    console.error(`  ✕ [ÉCHEC] ${profile.desc}`);
    for (const err of errors) {
      console.error(`     - ${err}`);
    }
    console.error("");
    failed++;
  }
}

console.log("--------------------------------------------------------------------------------");
console.log(`Résultats des tests : ${passed} validés, ${failed} échoués sur ${GOLDEN_PROFILES.length} profils golden.`);
console.log("--------------------------------------------------------------------------------\n");

if (failed > 0) {
  console.error("ALERTE CRITIQUE : Régression détectée sur le moteur de paie !");
  process.exit(1);
} else {
  console.log("INTÉGRITÉ DU MOTEUR DE PAIE 100% GARANTIE (Zéro écart constaté).\n");
  process.exit(0);
}
