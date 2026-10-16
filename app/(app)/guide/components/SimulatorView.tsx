"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, Check, Copy } from "lucide-react";

export function SimulatorView() {
  const [sb, setSb] = useState(100000);
  const [iepPct, setIepPct] = useState(5);
  const [nuisPct, setNuisPct] = useState(0);
  const [respPct, setRespPct] = useState(10);
  const [autresPct, setAutresPct] = useState(0);
  const [icr, setIcr] = useState(0);
  const [panier, setPanier] = useState(11000); // 22j * 500 DA
  const [mutuelle, setMutuelle] = useState(500);
  const [copied, setCopied] = useState(false);

  const calcResults = useMemo(() => {
    const primesPct = sb * ((iepPct + nuisPct + respPct + autresPct) / 100);
    const totalGains = sb + icr + primesPct + panier;

    // CNAS : Panier exclu de l'assiette (Ord. n°95-01 Art. 1)
    const baseCnas = totalGains - panier;
    const cnasSal = baseCnas * 0.09;

    // IRG : Panier inclus dans la base imposable (CIDTA Art. 68)
    const baseIrg = totalGains - cnasSal;

    const exo = baseIrg <= 30000;
    const zoneAb2 = baseIrg > 30000 && baseIrg <= 42500;

    const tranchesConfig = [
      { max: 20000, rate: 0, label: "Jusqu'à 20 000 DA" },
      { max: 40000, rate: 0.23, label: "20 001 à 40 000 DA" },
      { max: 80000, rate: 0.27, label: "40 001 à 80 000 DA" },
      { max: 160000, rate: 0.30, label: "80 001 à 160 000 DA" },
      { max: 320000, rate: 0.33, label: "160 001 à 320 000 DA" },
      { max: Infinity, rate: 0.35, label: "Plus de 320 000 DA" },
    ];

    let irgB = 0;
    let prev = 0;
    const tranchesDetaillées: { label: string; rate: number; impôt: number; active: boolean }[] = [];

    for (const t of tranchesConfig) {
      const taxable = Math.min(baseIrg, t.max) - prev;
      if (taxable <= 0) {
        tranchesDetaillées.push({ label: t.label, rate: t.rate, impôt: 0, active: false });
        continue;
      }
      const montantTranche = taxable * t.rate;
      irgB += montantTranche;
      const isCur = baseIrg > prev && baseIrg <= t.max;
      tranchesDetaillées.push({ label: t.label, rate: t.rate, impôt: montantTranche, active: isCur });
      prev = t.max;
      if (prev >= baseIrg) break;
    }

    const abat40 = irgB * 0.40;
    let abat = abat40;
    let abatNote = "40% de l'IRG brut";
    if (abat40 < 1000) {
      abat = 1000;
      abatNote = "Plancher légal de 1 000 DA";
    } else if (abat40 > 1500) {
      abat = 1500;
      abatNote = "Plafond légal de 1 500 DA";
    }

    const irgNet1 = Math.max(0, irgB - abat);
    const irgNet = exo
      ? 0
      : zoneAb2
      ? Math.max(0, irgNet1 * (93 / 61) - 81213 / 41)
      : irgNet1;

    const net = totalGains - cnasSal - irgNet - mutuelle;
    const cnasPat = baseCnas * 0.26;
    const coutTotal = totalGains + cnasPat;

    return {
      totalGains,
      baseCnas,
      cnasSal,
      baseIrg,
      irgB,
      irgNet,
      net,
      coutTotal,
      cnasPat,
      primesPct,
      tranchesDetaillées,
      exo,
      zoneAb2,
      abat,
      abatNote,
    };
  }, [sb, iepPct, nuisPct, respPct, autresPct, icr, panier, mutuelle]);

  const fmt = (n: number) => {
    return Math.round(n).toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ") + " DA";
  };

  const copySummary = () => {
    const text = `SIMULATION DE PAIE (Algérie - CIDTA 2024 / Loi 90-11)
Salaire de base brut : ${fmt(sb)}
Total des gains bruts : ${fmt(calcResults.totalGains)}
Assiette cotisable CNAS : ${fmt(calcResults.baseCnas)}
- Retenue CNAS (9%) : ${fmt(calcResults.cnasSal)}
Base imposable IRG : ${fmt(calcResults.baseIrg)}
- Retenue IRG nette : ${fmt(calcResults.irgNet)}
- Cotisation Mutuelle : ${fmt(mutuelle)}
---------------------------------------------
NET À PAYER SALARIÉ : ${fmt(calcResults.net)}
---------------------------------------------
Coût total employeur (avec CNAS 26%) : ${fmt(calcResults.coutTotal)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2">
              <Calculator size={13} />
              Outil Métier Interactif
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">Simulateur de Paie — Du Brut au Net</h2>
            <p className="text-sm text-[#64748B] mt-1">
              Testez instantanément la cascade légale algérienne : déductions CNAS (9%), barème IRG 2022-2025 et coût patronal (26%).
            </p>
          </div>
          <button
            onClick={copySummary}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-[#64748B]" />}
            {copied ? "Synthèse copiée !" : "Copier la synthèse"}
          </button>
        </div>

        {/* Input Parameters vs Result Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Inputs Section */}
          <div className="lg:col-span-6 space-y-5">
            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Paramètres de Rémunération</h3>

            {/* Salaire de base */}
            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0] space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <label htmlFor="sb-range" className="text-[#0F172A]">Salaire de base brut</label>
                <span className="tabular-nums font-bold text-indigo-700 text-base">{fmt(sb)}</span>
              </div>
              <input
                id="sb-range"
                type="range"
                min="24000"
                max="350000"
                step="1000"
                value={sb}
                onChange={(e) => setSb(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#64748B]">
                <span>SNMG : 24 000 DA</span>
                <span>350 000 DA</span>
              </div>
            </div>

            {/* Primes en pourcentage */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#0F172A]">Primes en % du salaire de base</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">I.E.P (Ancienneté)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={iepPct}
                      onChange={(e) => setIepPct(Number(e.target.value))}
                      className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                    />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">Indemnité Nuisance</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={nuisPct}
                      onChange={(e) => setNuisPct(Number(e.target.value))}
                      className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                    />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">Prime Responsabilité</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={respPct}
                      onChange={(e) => setRespPct(Number(e.target.value))}
                      className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                    />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">Autres primes % (PRI, PRC)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={autresPct}
                      onChange={(e) => setAutresPct(Number(e.target.value))}
                      className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                    />
                    <span className="text-xs text-[#64748B]">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primes fixes & Panier */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#0F172A]">Primes fixes &amp; Retenues</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">ICR / Primes fixes</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={icr}
                    onChange={(e) => setIcr(Number(e.target.value))}
                    className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                  />
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-[#0F172A] font-semibold">Panier mensuel</label>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">Non CNAS</span>
                  </div>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={panier}
                    onChange={(e) => setPanier(Number(e.target.value))}
                    className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium"
                  />
                </div>

                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <label className="block text-xs text-[#64748B] mb-1">Mutuelle (Retenue)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={mutuelle}
                    onChange={(e) => setMutuelle(Number(e.target.value))}
                    className="w-full tabular-nums text-sm border border-[#E2E8F0] rounded p-1.5 text-right font-medium text-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Règle d&apos;or fiscale :</strong> Le panier est <em>exonéré de cotisation CNAS</em> (Ord. n°95-01 Art. 1), mais demeure <em>imposable à l&apos;IRG</em> (CIDTA Art. 68). Il est donc inclus dans la base IRG après déduction de la CNAS.
              </span>
            </div>
          </div>

          {/* Results Cascade Section */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0]">
            <div>
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Cascade de Calcul Légal</h3>

              <div className="space-y-3 text-sm">
                {/* ① Total Gains */}
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <div>
                    <div className="font-semibold text-[#0F172A]">① Salaire Brut Total</div>
                    <div className="text-xs text-[#64748B]">Base ({fmt(sb)}) + Primes ({fmt(calcResults.primesPct + icr)}) + Panier</div>
                  </div>
                  <span className="tabular-nums font-bold text-base text-[#0F172A]">{fmt(calcResults.totalGains)}</span>
                </div>

                {/* ② CNAS */}
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                  <div>
                    <div className="font-semibold text-[#0F172A]">② Retenue CNAS Salarié (9%)</div>
                    <div className="text-xs text-[#64748B]">Assiette cotisable : {fmt(calcResults.baseCnas)} (panier exclu)</div>
                  </div>
                  <span className="tabular-nums font-bold text-red-600">− {fmt(calcResults.cnasSal)}</span>
                </div>

                {/* ③ IRG */}
                <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#0F172A] flex items-center gap-2">
                        ③ Retenue Fiscale IRG (Art. 104)
                        {calcResults.exo && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Exonéré
                          </span>
                        )}
                        {calcResults.zoneAb2 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                            2e abattement
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Assiette IRG : {fmt(calcResults.baseIrg)} · Abattement 40% : {fmt(calcResults.abat)} ({calcResults.abatNote})
                      </div>
                    </div>
                    <span className="tabular-nums font-bold text-red-600">− {fmt(calcResults.irgNet)}</span>
                  </div>

                  {/* Tranches breakdown */}
                  <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                    <div className="text-[11px] font-semibold text-[#64748B] mb-1">Détail des tranches du barème progressif :</div>
                    <div className="grid grid-cols-2 gap-1 tabular-nums text-[11px] text-[#334155]">
                      {calcResults.tranchesDetaillées.map((t, idx) => (
                        <div key={idx} className={`flex justify-between py-0.5 px-1 rounded ${t.active ? "bg-indigo-50 font-semibold text-indigo-900" : ""}`}>
                          <span>{t.label} ({(t.rate * 100).toFixed(0)}%)</span>
                          <span>{t.impôt > 0 ? `+${fmt(t.impôt)}` : "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Retenues additionnelles */}
                {mutuelle > 0 && (
                  <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-[#E2E8F0] text-xs">
                    <span className="text-[#64748B]">Cotisation Mutuelle Salariale</span>
                    <span className="tabular-nums font-bold text-red-600">− {fmt(mutuelle)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Net Card Banner */}
            <div className="space-y-3 pt-2">
              <div className="bg-[#0F172A] text-white p-4 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Net à Payer Salarié</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Virement bancaire / chèque</div>
                </div>
                <div className="tabular-nums text-2xl font-extrabold text-emerald-400">
                  {fmt(calcResults.net)}
                </div>
              </div>

              {/* Employer Cost Banner */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-amber-900">Coût Total Entreprise</span>
                  <span className="text-amber-700 block text-[11px]">Brut ({fmt(calcResults.totalGains)}) + CNAS Patronale 26% ({fmt(calcResults.cnasPat)})</span>
                </div>
                <span className="tabular-nums font-bold text-amber-950 text-base">
                  {fmt(calcResults.coutTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulatorView;
