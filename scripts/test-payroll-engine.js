/**
 * Script de test et validation officielle du moteur de paie algérienne (Netix SIRH 2.0)
 * Vérifie rigoureusement les formules de la Loi 90-11, Loi 83-11 et la Table DGI 2022.
 */

// Utilise import ES ou Node natif
import {
  BASE_HORAIRE_LEGALE,
  JOURS_OUVRABLES_STANDARD,
  calculerTauxHoraire,
  calculerRetenueAbsence,
  calculerHeuresSupplementaires,
  calculerTransportProratise,
  calculerPanierProratise,
  calculerCotisationsCNAS,
  calculerIRGDGI,
  calculerBulletinComplet,
  round2,
  round1
} from '../src/lib/payroll-engine.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, expected, actual) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
    console.error(`     Attendu: ${expected} | Obtenu: ${actual}`);
  }
}

function assertEquals(actual, expected, message) {
  const match = Math.abs(actual - expected) < 0.001;
  assert(match, message, expected, actual);
}

console.log('================================================================');
console.log('🧪 VALIDATION MOTEUR DE PAIE ALGÉRIENNE — NETIX SIRH 2.0');
console.log('================================================================\n');

// ------------------------------------------------------------------
// TEST SUITE 1 : CHECKPOINTS OFFICIELS TABLE IRG 2022 (DGI)
// ------------------------------------------------------------------
console.log('📋 SUITE 1 : Checkpoints Table Officielle DGI 2022');

const checkpointsDGI = [
  { R: 30000, gen: 0.0, part: 0.0, label: 'Seuil d’exonération (30 000 DA)' },
  { R: 30010, gen: 7.7, part: 4.7, label: 'Début zone transition (30 010 DA)' },
  { R: 30870, gen: 538.9, part: 306.2, label: 'Milieu zone transition (30 870 DA)' },
  { R: 35000, gen: 2070.0, part: 1175.1, label: 'Sortie transition général (35 000 DA)' },
  { R: 42500, gen: 3775.0, part: 3775.0, label: 'Sortie transition particulier (42 500 DA)' },
];

for (const cp of checkpointsDGI) {
  const resGen = calculerIRGDGI(cp.R, 'general');
  const resPart = calculerIRGDGI(cp.R, 'particulier');

  assertEquals(
    resGen.irgRetenu,
    cp.gen,
    `${cp.label} -> Régime Général: ${resGen.irgRetenu} DA (Attendu: ${cp.gen} DA)`
  );

  assertEquals(
    resPart.irgRetenu,
    cp.part,
    `${cp.label} -> Régime Particulier: ${resPart.irgRetenu} DA (Attendu: ${cp.part} DA)`
  );
}

// Vérification de la troncature à la dizaine
const resTroncature = calculerIRGDGI(30018.95, 'general');
assertEquals(resTroncature.rTronque, 30010, 'Troncature obligatoire à la dizaine (30 018.95 -> 30 010 DA)');
assertEquals(resTroncature.irgRetenu, 7.7, 'IRG sur base tronquée 30 018.95 DA = 7.70 DA');

// ------------------------------------------------------------------
// TEST SUITE 2 : BASE HORAIRE, ABSENCES ET HEURES SUPPLÉMENTAIRES (LOI 90-11)
// ------------------------------------------------------------------
console.log('\n📋 SUITE 2 : Loi 90-11 (Base 173,33h, Retenue Absence, Heures Sup)');

const salaireBaseTest = 60000;
const tauxHoraireAttendu = 60000 / 173.33;
const tauxHoraireCalc = calculerTauxHoraire(salaireBaseTest);
assertEquals(round2(tauxHoraireCalc), round2(tauxHoraireAttendu), `Taux horaire pour 60 000 DA = ${round2(tauxHoraireAttendu)} DA/h`);

const heuresAbsenceTest = 10;
const retenueAbsenceAttendue = round2(10 * tauxHoraireAttendu);
const retenueAbsenceCalc = calculerRetenueAbsence(heuresAbsenceTest, salaireBaseTest);
assertEquals(retenueAbsenceCalc, retenueAbsenceAttendue, `Retenue pour 10h absence = ${retenueAbsenceAttendue} DA`);

const hsTest = calculerHeuresSupplementaires(tauxHoraireAttendu, 4, 2, 1);
const hs50Attendu = round2(4 * tauxHoraireAttendu * 1.5);
const hs75Attendu = round2(2 * tauxHoraireAttendu * 1.75);
const hs100Attendu = round2(1 * tauxHoraireAttendu * 2.0);
const hsTotalAttendu = round2(hs50Attendu + hs75Attendu + hs100Attendu);

assertEquals(hsTest.montantHs50, hs50Attendu, `HS 50% (4h) = ${hs50Attendu} DA`);
assertEquals(hsTest.montantHs75, hs75Attendu, `HS 75% (2h) = ${hs75Attendu} DA`);
assertEquals(hsTest.montantHs100, hs100Attendu, `HS 100% (1h) = ${hs100Attendu} DA`);
assertEquals(hsTest.totalHeuresSup, hsTotalAttendu, `Total Heures Sup = ${hsTotalAttendu} DA`);

// ------------------------------------------------------------------
// TEST SUITE 3 : PRORATISATION DU TRANSPORT ET DU PANIER
// ------------------------------------------------------------------
console.log('\n📋 SUITE 3 : Proratisation Transport & Panier');

// Transport
const transportPlein = calculerTransportProratise(2500, 0);
assertEquals(transportPlein, 2500, 'Transport sans absence = 2 500 DA');

const transportProratise = calculerTransportProratise(2500, 35);
const transportProratiseAttendu = round2(2500 * (173.33 - 35) / 173.33);
assertEquals(transportProratise, transportProratiseAttendu, `Transport avec 35h absence = ${transportProratiseAttendu} DA`);

// Panier
const panierPlein = calculerPanierProratise(300, 0);
assertEquals(panierPlein.joursTravaillesPanier, 22, 'Panier sans absence = 22 jours ouvrables');
assertEquals(panierPlein.montantPanier, 6600, 'Montant panier plein (22 * 300) = 6 600 DA');

// 1 journée d'absence = 173.33 / 22 = ~7.8786h
const heures1JourAbsence = 173.33 / 22;
const panier1JourAbsence = calculerPanierProratise(300, heures1JourAbsence);
assertEquals(panier1JourAbsence.joursTravaillesPanier, 21, 'Panier avec 1j absence = 21 jours');
assertEquals(panier1JourAbsence.montantPanier, 6300, 'Montant panier avec 1j absence = 6 300 DA');

// ------------------------------------------------------------------
// TEST SUITE 4 : ASSIETTE CNAS ET COTISATIONS 34,5% (LOI 83-11)
// ------------------------------------------------------------------
console.log('\n📋 SUITE 4 : Assiette CNAS & Ventilation 34,5% (Loi 83-11)');

const cnasTest = calculerCotisationsCNAS(70000, 0, 0, 5000); // Base 70k, 0 abs, 0 hs, 5k prime cotisable (IEP)
assertEquals(cnasTest.salaireDePoste, 75000, 'Salaire de poste (assiette cotisable) = 75 000 DA');
assertEquals(cnasTest.cnasSalariale, round2(75000 * 0.09), 'CNAS Salariale 9% = 6 750 DA');
assertEquals(cnasTest.cnasPatronale, round2(75000 * 0.25), 'CNAS Patronale 25% = 18 750 DA');
assertEquals(cnasTest.cnasOeuvresSociales, round2(75000 * 0.005), 'Œuvres Sociales 0,5% = 375 DA');
assertEquals(cnasTest.totalDAC, round2(75000 * 0.345), 'Total DAC Employeur + Salarié (34,5%) = 25 875 DA');

// ------------------------------------------------------------------
// TEST SUITE 5 : BULLETIN DE PAIE INTÉGRAL & SALAIRE NET À PAYER
// ------------------------------------------------------------------
console.log('\n📋 SUITE 5 : Intégration Bulletin Complet');

const bulletinTest = calculerBulletinComplet({
  salaireBase: 50000,
  heuresAbsence: 0,
  hs50: 0,
  hs75: 0,
  hs100: 0,
  primesCotisables: 5000, // IEP 5000
  forfaitTransport: 2500,
  tauxUnitairePanier: 300, // 22 * 300 = 6600
  avancesAcomptes: 2000,
  autresRetenues: 0,
  regimeIrg: 'general',
});

// Salaire de poste = 50 000 + 5 000 = 55 000 DA
assertEquals(bulletinTest.salaireDePoste, 55000, 'Salaire de poste = 55 000 DA');
// CNAS Salariale = 55 000 * 0.09 = 4 950 DA
assertEquals(bulletinTest.cnasSalariale, 4950, 'CNAS Salariale = 4 950 DA');
// Transport = 2 500 DA, Panier = 6 600 DA
assertEquals(bulletinTest.montantTransport, 2500, 'Transport = 2 500 DA');
assertEquals(bulletinTest.montantPanier, 6600, 'Panier = 6 600 DA');
// Brut Total = 55 000 + 2 500 + 6 600 = 64 100 DA
assertEquals(bulletinTest.salaireBrutTotal, 64100, 'Salaire Brut Total = 64 100 DA');
// Base IRG = (55 000 - 4 950) + 2 500 + 6 600 = 50 050 + 9 100 = 59 150 DA
assertEquals(bulletinTest.baseIrg, 59150, 'Base IRG = 59 150 DA');
// R tronqué = 59 150 DA
assertEquals(bulletinTest.rTronqueIrg, 59150, 'R Tronqué = 59 150 DA');

// Vérification de l'IRG sur 59 150 DA (hors zone transition car > 35 000 DA):
// IRG Brut: (40000-20000)*0.23 + (59150-40000)*0.27 = 4600 + 5170.5 = 9770.5
// Abattement 40%: 9770.5 * 0.4 = 3908.2 => plafonné à 1500
// I1 = 9770.5 - 1500 = 8270.5
// IRG Retenu = 8270.5 DA
assertEquals(bulletinTest.irgRetenu, 8270.5, 'IRG Retenu = 8 270.50 DA');

// Total Retenues = CNAS (4 950) + IRG (8 270.5) + Acompte (2 000) = 15 220.50 DA
assertEquals(bulletinTest.totalRetenues, 15220.5, 'Total Retenues = 15 220.50 DA');

// Net à Payer = 64 100 - 15 220.50 = 48 879.50 DA
assertEquals(bulletinTest.netAPayer, 48879.5, 'Net à Payer = 48 879.50 DA');

console.log('\n================================================================');
console.log(`📊 RÉSULTAT FINAL : ${passedTests}/${totalTests} tests réussis`);
if (failedTests === 0) {
  console.log('🎉 TOUS LES TESTS SONT AU VERT ! LE MOTEUR EST 100% CONFORME.');
  console.log('================================================================');
} else {
  console.error(`💥 ${failedTests} test(s) ont échoué !`);
  console.log('================================================================');
  process.exitCode = 1;
}

