"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Salarie } from "../../salaries/actions";
import { Lock, Edit3, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";

interface BulletinSimplifie {
  salarie_id: number;
  maladie_h: number;
  absence_irreguliere_h: number;
  retard_h: number;
  heures_sup_1: number;
  heures_sup_2: number;
  heures_sup_3: number;
  panier_jours: number;
  autre_prime_fixe: number;
  statut?: string;
}

interface Props {
  salaries: Salarie[];
  initialBulletins: BulletinSimplifie[];
  anneeActive: number;
  moisActive: number;
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const COLUMNS = [
  { key: "maladie_h", label: "Maladie (H)" },
  { key: "absence_irreguliere_h", label: "Absences (H)" },
  { key: "retard_h", label: "Retards (H)" },
  { key: "heures_sup_1", label: "HS 50% (H)" },
  { key: "heures_sup_2", label: "HS 75% (H)" },
  { key: "heures_sup_3", label: "HS 100% (H)" },
  { key: "panier_jours", label: "Panier (Jours)" },
  { key: "autre_prime_fixe", label: "Autre Prime (DA)" },
];

export default function SaisieCollectiveClient({
  salaries,
  initialBulletins,
  anneeActive,
  moisActive
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Years & Months states for navigation
  const [annee, setAnnee] = useState(anneeActive);
  const [mois, setMois] = useState(moisActive);

  // Grid values state
  const [gridValues, setGridValues] = useState<Record<number, BulletinSimplifie>>({});
  
  // Search state
  const [search, setSearch] = useState("");

  // Initialize values when initial data or period changes
  useEffect(() => {
    const values: Record<number, BulletinSimplifie> = {};
    
    // Create map of existing bulletins
    const existingMap = new Map(initialBulletins.map(b => [b.salarie_id, b]));

    for (const s of salaries) {
      const existing = existingMap.get(s.id);
      values[s.id] = {
        salarie_id: s.id,
        maladie_h: existing?.maladie_h ?? 0,
        absence_irreguliere_h: existing?.absence_irreguliere_h ?? 0,
        retard_h: existing?.retard_h ?? 0,
        heures_sup_1: existing?.heures_sup_1 ?? 0,
        heures_sup_2: existing?.heures_sup_2 ?? 0,
        heures_sup_3: existing?.heures_sup_3 ?? 0,
        panier_jours: existing?.panier_jours ?? 0,
        autre_prime_fixe: existing?.autre_prime_fixe ?? 0,
        statut: existing?.statut ?? "Brouillon",
      };
    }
    
    setGridValues(values);
    setMessage(null);
  }, [initialBulletins, salaries, anneeActive, moisActive]);

  // Navigate when period changes
  const handlePeriodChange = (newAnnee: number, newMois: number) => {
    setAnnee(newAnnee);
    setMois(newMois);
    router.push(`?annee=${newAnnee}&mois=${newMois}`);
  };

  // Cell change handler
  const handleCellChange = (salarieId: number, field: keyof BulletinSimplifie, val: string) => {
    const num = parseFloat(val) || 0;
    setGridValues(prev => ({
      ...prev,
      [salarieId]: {
        ...prev[salarieId],
        [field]: num
      }
    }));
  };

  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === "ArrowUp") {
      targetRow = rowIndex - 1;
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault(); // Prevent standard enter key submit or scroll
      targetRow = rowIndex + 1;
    } else if (e.key === "ArrowLeft") {
      // Navigate to left if cursor is at the beginning
      if (e.currentTarget.selectionStart === 0) {
        targetCol = colIndex - 1;
      }
    } else if (e.key === "ArrowRight") {
      // Navigate to right if cursor is at the end
      if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
        targetCol = colIndex + 1;
      }
    } else {
      return; // Do nothing for other keys
    }

    const nextInput = document.querySelector(
      `input[data-row="${targetRow}"][data-col="${targetCol}"]`
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
      // Select text on focus for easier overwrite
      setTimeout(() => nextInput.select(), 50);
    }
  };

  // Save handler
  const handleSave = () => {
    setMessage(null);
    const list = Object.values(gridValues).filter(v => {
      // Only send values that actually differ from zero or have a status
      return (
        v.maladie_h !== 0 ||
        v.absence_irreguliere_h !== 0 ||
        v.retard_h !== 0 ||
        v.heures_sup_1 !== 0 ||
        v.heures_sup_2 !== 0 ||
        v.heures_sup_3 !== 0 ||
        v.panier_jours !== 0 ||
        v.autre_prime_fixe !== 0 ||
        v.statut !== "Brouillon"
      );
    });

    startTransition(async () => {
      try {
        await enregistrerBulletinsCollectifs(annee, mois, list);
        setMessage({ type: "success", text: "Toutes les variables de paie ont été enregistrées et recalculées avec succès !" });
      } catch (err) {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement." });
      }
    });
  };

  // Filter salaries by search query
  const filteredSalaries = salaries.filter(s =>
    s.nom_prenom.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricule || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.fonction || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Configuration bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label htmlFor="mois-sel" className="text-xs font-semibold text-[#0F172A]">Mois</label>
            <Select
              value={mois.toString()}
              onChange={(v) => handlePeriodChange(annee, parseInt(v, 10))}
              options={MOIS.map((m, i) => ({ value: (i + 1).toString(), label: m }))}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="annee-sel" className="text-xs font-semibold text-[#0F172A]">Année</label>
            <Select
              value={annee.toString()}
              onChange={(v) => handlePeriodChange(parseInt(v, 10), mois)}
              options={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => ({
                value: y.toString(),
                label: y.toString()
              }))}
            />
          </div>

          <div className="space-y-1 flex-1 min-w-[250px]">
            <label htmlFor="search-sal" className="text-xs font-semibold text-[#0F172A]">Filtrer les salariés</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                id="search-sal"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, fonction, matricule..."
                className="pl-9"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Calcul & Enregistrement..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer la paie
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === "success" ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]" : "bg-red-50 text-red-600 border border-red-200"}`}
        >
          {message.text}
        </div>
      )}

      {/* Grid container */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="p-3 font-semibold text-[#64748B] sticky left-0 bg-[#F8FAFC] z-10 min-w-[180px]">Salarié</th>
                <th className="p-3 font-semibold text-[#64748B] text-center">Matricule</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="p-3 font-semibold text-[#64748B] text-center min-w-[110px]">
                    {col.label}
                  </th>
                ))}
                <th className="p-3 font-semibold text-[#64748B] text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalaries.map((s, rowIndex) => {
                const values = gridValues[s.id] || {
                  salarie_id: s.id,
                  maladie_h: 0,
                  absence_irreguliere_h: 0,
                  retard_h: 0,
                  heures_sup_1: 0,
                  heures_sup_2: 0,
                  heures_sup_3: 0,
                  panier_jours: 0,
                  autre_prime_fixe: 0,
                  statut: "Brouillon",
                };
                
                const isLocked = values.statut === "Clôturée" || values.statut === "Clôturé"; // Handle both spellings

                return (
                  <tr
                    key={s.id}
                    className={`border-b border-[#E2E8F0] ${isLocked ? "bg-[#F1F5F9]/50" : "hover:bg-[#F8FAFC]/50"}`}
                  >
                    {/* Fixed name column */}
                    <td
                      className="p-3 sticky left-0 z-5 shadow-[2px_0_5px_rgba(0,0,0,0.02)]"
                      style={{ backgroundColor: isLocked ? "#F8FAFC" : "#ffffff" }}
                    >
                      <div className="font-semibold text-[#0F172A]">{s.nom_prenom}</div>
                      <div className="text-[10px] text-[#64748B]">
                        {s.fonction || "Pas de fonction"}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      {s.matricule ? (
                        <Badge variant="neutral">{s.matricule}</Badge>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    {COLUMNS.map((col, colIndex) => {
                      const field = col.key as keyof BulletinSimplifie;
                      const val = values[field] ?? 0;

                      return (
                        <td key={col.key} className="p-2 text-center">
                          <input
                            type="number"
                            step={field === "autre_prime_fixe" ? "0.01" : "1"}
                            min="0"
                            value={val === 0 ? "" : val}
                            onChange={(e) => handleCellChange(s.id, field, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            disabled={isLocked || isPending}
                            data-row={rowIndex}
                            data-col={colIndex}
                            placeholder="0"
                            className={`w-full p-1.5 border rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors ${isLocked ? "bg-[#F1F5F9] border-transparent text-[#94A3B8]" : "bg-white border-[#E2E8F0] text-[#0F172A]"}`}
                          />
                        </td>
                      );
                    })}

                    <td className="p-3 text-center">
                      {isLocked ? (
                        <Badge variant="neutral" className="inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Clôturé
                        </Badge>
                      ) : (
                        <Badge variant="brand" className="inline-flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> {values.statut || "Brouillon"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
