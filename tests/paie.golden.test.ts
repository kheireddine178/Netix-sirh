import { describe, it, expect } from "vitest";
import { calculerPaie, PARAMETRES_PAR_DEFAUT, SAISIE_VIDE } from "../lib/paieCalcul";

describe("NETIX SIRH — Tests Golden du Moteur de Paie (§0 Règle d'or)", () => {
  it("Profil 1 : Ouvrier au SNMG (20 000 DA) — Exonération totale IRG", () => {
    const res = calculerPaie({ ...SAISIE_VIDE, salaire_base_theorique: 20000 }, PARAMETRES_PAR_DEFAUT);
    expect(res.salaire_base_reel).toBe(20000);
    expect(res.total_gains).toBe(20000);
    expect(res.base_cnas).toBe(20000);
    expect(res.retenue_cnas).toBe(1800);
    expect(res.base_imposable_irg).toBe(18200);
    expect(res.irg_brut).toBe(0);
    expect(res.abattement_irg).toBe(0);
    expect(res.retenue_irg_nette).toBe(0);
    expect(res.total_retenues).toBe(1800);
    expect(res.net_a_payer).toBe(18200);
    expect(res.cout_total_employeur).toBe(25200);
  });

  it("Profil 2 : Zone de lissage transition IRG (35 164.84 DA)", () => {
    const res = calculerPaie({ ...SAISIE_VIDE, salaire_base_theorique: 35164.84 }, PARAMETRES_PAR_DEFAUT);
    expect(res.salaire_base_reel).toBeCloseTo(35164.84, 2);
    expect(res.total_gains).toBeCloseTo(35164.84, 2);
    expect(res.base_cnas).toBeCloseTo(35164.84, 2);
    expect(res.retenue_cnas).toBeCloseTo(3164.84, 2);
    expect(res.base_imposable_irg).toBeCloseTo(32000.00, 2);
    expect(res.irg_brut).toBe(2760);
    expect(res.abattement_irg).toBeCloseTo(1802.20, 2);
    expect(res.retenue_irg_nette).toBeCloseTo(957.80, 2);
    expect(res.total_retenues).toBeCloseTo(4122.64, 2);
    expect(res.net_a_payer).toBeCloseTo(31042.20, 2);
    expect(res.cout_total_employeur).toBeCloseTo(44307.70, 2);
  });

  it("Profil 3 : Cadre standard (40 000 DA) — Cas nominal sans prime", () => {
    const res = calculerPaie({ ...SAISIE_VIDE, salaire_base_theorique: 40000 }, PARAMETRES_PAR_DEFAUT);
    expect(res.salaire_base_reel).toBe(40000);
    expect(res.total_gains).toBe(40000);
    expect(res.base_cnas).toBe(40000);
    expect(res.retenue_cnas).toBe(3600);
    expect(res.base_imposable_irg).toBe(36400);
    expect(res.irg_brut).toBe(3772);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBe(2272);
    expect(res.total_retenues).toBe(5872);
    expect(res.net_a_payer).toBe(34128);
    expect(res.cout_total_employeur).toBe(50400);
  });

  it("Profil 4 : Primes en pourcentage (45 000 DA + 10% IEP + 5% Nuisance)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 45000, taux_iep: 0.10, taux_nuisance: 0.05 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBeCloseTo(45000, 2);
    expect(res.total_gains).toBeCloseTo(51750, 2);
    expect(res.base_cnas).toBeCloseTo(51750, 2);
    expect(res.retenue_cnas).toBeCloseTo(4657.50, 2);
    expect(res.base_imposable_irg).toBeCloseTo(47092.50, 2);
    expect(res.irg_brut).toBeCloseTo(6514.30, 2);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBeCloseTo(5014.30, 2);
    expect(res.total_retenues).toBeCloseTo(9671.80, 2);
    expect(res.net_a_payer).toBeCloseTo(42078.20, 2);
    expect(res.cout_total_employeur).toBeCloseTo(65205.00, 2);
  });

  it("Profil 5 : Prime de Panier non cotisable mais imposable (40 000 DA + 22j * 500 DA)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 40000, panier_jours: 22, panier_forfait_jour: 500 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBe(40000);
    expect(res.total_gains).toBe(51000);
    expect(res.base_cnas).toBe(40000);
    expect(res.retenue_cnas).toBe(3600);
    expect(res.base_imposable_irg).toBe(47400);
    expect(res.irg_brut).toBe(6598);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBe(5098);
    expect(res.total_retenues).toBe(8698);
    expect(res.net_a_payer).toBe(42302);
    expect(res.cout_total_employeur).toBe(61400);
  });

  it("Profil 6 : Heures supplémentaires 3 paliers (34 666 DA + 4h P1 + 4h P2 + 2h P3)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 34666, heures_sup_1: 4, heures_sup_2: 4, heures_sup_3: 2 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBe(34666);
    expect(res.total_gains).toBeCloseTo(38066, 2);
    expect(res.base_cnas).toBeCloseTo(38066, 2);
    expect(res.retenue_cnas).toBeCloseTo(3425.94, 2);
    expect(res.base_imposable_irg).toBeCloseTo(34640.06, 2);
    expect(res.irg_brut).toBeCloseTo(3367.20, 2);
    expect(res.abattement_irg).toBeCloseTo(1430.70, 2);
    expect(res.retenue_irg_nette).toBeCloseTo(1936.50, 2);
    expect(res.total_retenues).toBeCloseTo(5362.44, 2);
    expect(res.net_a_payer).toBeCloseTo(32703.56, 2);
    expect(res.cout_total_employeur).toBeCloseTo(47963.16, 2);
  });

  it("Profil 7 : Déduction d'absences irrégulières (40 000 DA - 16h d'absence)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 40000, absence_irreguliere_h: 16 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBeCloseTo(36307.62, 2);
    expect(res.total_gains).toBeCloseTo(36307.62, 2);
    expect(res.base_cnas).toBeCloseTo(36307.62, 2);
    expect(res.retenue_cnas).toBeCloseTo(3267.69, 2);
    expect(res.base_imposable_irg).toBeCloseTo(33039.94, 2);
    expect(res.irg_brut).toBeCloseTo(2996.90, 2);
    expect(res.abattement_irg).toBeCloseTo(1657.20, 2);
    expect(res.retenue_irg_nette).toBeCloseTo(1339.70, 2);
    expect(res.total_retenues).toBeCloseTo(4607.39, 2);
    expect(res.net_a_payer).toBeCloseTo(31700.24, 2);
    expect(res.cout_total_employeur).toBeCloseTo(45747.60, 2);
  });

  it("Profil 8 : Retenues mutuelle & autres retenues (60 000 DA)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 60000, cotis_mutuelle: 2000, autres_retenues: 5000 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBeCloseTo(60000, 2);
    expect(res.total_gains).toBeCloseTo(60000, 2);
    expect(res.base_cnas).toBeCloseTo(60000, 2);
    expect(res.retenue_cnas).toBeCloseTo(5400, 2);
    expect(res.base_imposable_irg).toBeCloseTo(54600, 2);
    expect(res.irg_brut).toBeCloseTo(8539.30, 2);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBeCloseTo(7039.30, 2);
    expect(res.total_retenues).toBeCloseTo(19439.30, 2);
    expect(res.net_a_payer).toBeCloseTo(40560.70, 2);
    expect(res.cout_total_employeur).toBeCloseTo(75600, 2);
  });

  it("Profil 9 : Cadre Supérieur / Dirigeant (250 000 DA — Plafonnement 1500 DA)", () => {
    const res = calculerPaie({ ...SAISIE_VIDE, salaire_base_theorique: 250000 }, PARAMETRES_PAR_DEFAUT);
    expect(res.salaire_base_reel).toBe(250000);
    expect(res.total_gains).toBe(250000);
    expect(res.base_cnas).toBe(250000);
    expect(res.retenue_cnas).toBe(22500);
    expect(res.base_imposable_irg).toBe(227500);
    expect(res.irg_brut).toBe(61675);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBe(60175);
    expect(res.total_retenues).toBe(82675);
    expect(res.net_a_payer).toBe(167325);
    expect(res.cout_total_employeur).toBe(315000);
  });

  it("Profil 10 : Primes mixtes ICR + IEP + PRI (70 000 DA)", () => {
    const res = calculerPaie(
      { ...SAISIE_VIDE, salaire_base_theorique: 70000, icr: 3000, taux_iep: 0.15, taux_pri: 0.10 },
      PARAMETRES_PAR_DEFAUT
    );
    expect(res.salaire_base_reel).toBe(70000);
    expect(res.total_gains).toBe(90500);
    expect(res.base_cnas).toBe(90500);
    expect(res.retenue_cnas).toBe(8145);
    expect(res.base_imposable_irg).toBe(82355);
    expect(res.irg_brut).toBe(16105);
    expect(res.abattement_irg).toBe(1500);
    expect(res.retenue_irg_nette).toBe(14605);
    expect(res.total_retenues).toBe(22750);
    expect(res.net_a_payer).toBe(67750);
    expect(res.cout_total_employeur).toBe(114030);
  });
});
