"use client";

import { useMemo, useState, useTransition } from "react";
import { assignerRubriquesSalarie } from "../../actions";
import type { RubriqueAssignee, RubriqueCatalogue } from "../../actions";

const LABELS_CATEGORIE: Record<string, string> = {
  pourcentage: "% d'une base",
  nombre_x_taux: "Nombre × taux",
  montant_fixe: "Montant fixe",
  regularisation: "Régularisation (+/-)",
};

const BADGE_CATEGORIE: Record<string, string> = {
  pourcentage: "badge-teal",
  nombre_x_taux: "badge-accent",
  montant_fixe: "badge-amber",
  regularisation: "badge-red",
};

export default function RubriquesForm({
  salarieId,
  catalogue,
  assignees,
}: {
  salarieId: number;
  catalogue: RubriqueCatalogue[];
  assignees: RubriqueAssignee[];
}) {
  const valeursDefautInitiales = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assignees) m.set(a.code, a.valeur_defaut);
    return m;
  }, [assignees]);

  const [coches, setCoches] = useState<Set<string>>(new Set(assignees.map((a) => a.code)));
  const [recherche, setRecherche] = useState("");
  const [tab, setTab] = useState<"tous" | "gains" | "retenues">("tous");
  const [typeFiltre, setTypeFiltre] = useState<string>("tous");
  const [selectionneesUniquement, setSelectionneesUniquement] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtre = useMemo(() => {
    let result = catalogue;

    // 1. Recherche par texte
    const q = recherche.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) => r.code.toLowerCase().includes(q) || (r.libelle ?? "").toLowerCase().includes(q),
      );
    }

    // 2. Filtrage par tab (Gains / Retenues)
    if (tab === "gains") {
      result = result.filter((r) => r.type_valeur === "Gain (+)");
    } else if (tab === "retenues") {
      result = result.filter((r) => r.type_valeur === "Retenue (-)");
    }

    // 3. Filtrage par type
    if (typeFiltre !== "tous") {
      result = result.filter((r) => r.categorie === typeFiltre);
    }

    // 4. Filtrage sélectionnées uniquement
    if (selectionneesUniquement) {
      result = result.filter((r) => coches.has(r.code));
    }

    return result;
  }, [catalogue, recherche, tab, typeFiltre, selectionneesUniquement, coches]);

  function toggle(code: string) {
    setCoches((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleDeselectionnerTout() {
    if (confirm("Voulez-vous décocher toutes les rubriques ?")) {
      setCoches(new Set());
    }
  }

  function handleReset() {
    setCoches(new Set(assignees.map((a) => a.code)));
  }

  function onSubmit(formData: FormData) {
    setMessage(null);
    setErreur(null);
    startTransition(async () => {
      try {
        await assignerRubriquesSalarie(salarieId, formData);
        setMessage("Rubriques enregistrées avec succès.");
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {/* Search & Filters Dashboard */}
      <div className="card space-y-4" style={{ position: "sticky", top: "var(--s4)", zIndex: 10 }}>
        {/* Row 1: Search and Count */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s4)" }}>
          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 260 }}>
            <label htmlFor="recherche">Rechercher une rubrique</label>
            <input
              id="recherche"
              type="text"
              placeholder="Saisissez un code ou un libellé (ex: panier, IEP...)"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
            <span className="badge badge-accent" style={{ whiteSpace: "nowrap", padding: "6px 12px", fontSize: "var(--tsm)" }}>
              {coches.size} sélectionnée{coches.size > 1 ? "s" : ""} / {catalogue.length}
            </span>
          </div>
        </div>

        {/* Row 2: Category Tabs & Selection filter */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--s4)", borderTop: "1px solid var(--border-soft)", paddingTop: "var(--s3)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--surface-2)", padding: 4, borderRadius: "var(--r)", gap: 4 }}>
            <button
              type="button"
              onClick={() => setTab("tous")}
              className="btn btn-sm"
              style={{
                background: tab === "tous" ? "var(--surface)" : "transparent",
                color: tab === "tous" ? "var(--text)" : "var(--text-muted)",
                boxShadow: tab === "tous" ? "var(--shxs)" : "none",
                border: "none",
              }}
            >
              Toutes ({catalogue.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("gains")}
              className="btn btn-sm"
              style={{
                background: tab === "gains" ? "var(--surface)" : "transparent",
                color: tab === "gains" ? "var(--teal)" : "var(--text-muted)",
                boxShadow: tab === "gains" ? "var(--shxs)" : "none",
                border: "none",
              }}
            >
              Gains (+ )
            </button>
            <button
              type="button"
              onClick={() => setTab("retenues")}
              className="btn btn-sm"
              style={{
                background: tab === "retenues" ? "var(--surface)" : "transparent",
                color: tab === "retenues" ? "var(--red-600)" : "var(--text-muted)",
                boxShadow: tab === "retenues" ? "var(--shxs)" : "none",
                border: "none",
              }}
            >
              Retenues (-)
            </button>
          </div>

          {/* Quick Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "var(--tsm)", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={selectionneesUniquement}
                onChange={(e) => setSelectionneesUniquement(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Sélectionnées uniquement
            </label>

            <div style={{ display: "flex", gap: "var(--s2)" }}>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary btn-sm"
                title="Rétablir la sélection d'origine"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={handleDeselectionnerTout}
                className="btn btn-secondary btn-sm"
                style={{ color: "var(--red-600)" }}
              >
                Décocher tout
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Type Filtering Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s2)", borderTop: "1px solid var(--border-soft)", paddingTop: "var(--s3)" }}>
          <span style={{ fontSize: "var(--t2xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Filtrer par type :
          </span>
          {[
            { value: "tous", label: "Tous" },
            { value: "pourcentage", label: "% d'une base" },
            { value: "nombre_x_taux", label: "Nombre × taux" },
            { value: "montant_fixe", label: "Montant fixe" },
            { value: "regularisation", label: "Régularisation" },
          ].map((t) => {
            const isActive = typeFiltre === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTypeFiltre(t.value)}
                className={`badge ${isActive ? "badge-accent" : ""}`}
                style={{
                  cursor: "pointer",
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: isActive ? "var(--accent-bg)" : "var(--surface)",
                  color: isActive ? "var(--accent-ink)" : "var(--text-2)",
                  padding: "4px 10px",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table of Rubrics */}
      <div className="table-wrap" style={{ maxHeight: "60vh", overflowY: "auto", marginTop: "var(--s4)" }}>
        {filtre.length === 0 ? (
          <p style={{ padding: "var(--s4)", fontSize: "var(--tsm)", color: "var(--text-muted)", textAlign: "center" }}>
            Aucune rubrique ne correspond à ces filtres.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: "center" }}>Actif</th>
                <th style={{ width: 100 }}>Code</th>
                <th>Libellé</th>
                <th style={{ width: 180 }}>Catégorie</th>
                <th style={{ width: 180 }}>Valeur par défaut</th>
              </tr>
            </thead>
            <tbody>
              {filtre.map((r) => {
                const estCoche = coches.has(r.code);
                return (
                  <tr
                    key={r.code}
                    style={{
                      transition: "background 0.2s ease",
                      background: estCoche ? "var(--accent-light)" : undefined,
                    }}
                  >
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        name={`rub_${r.code}`}
                        checked={estCoche}
                        onChange={() => toggle(r.code)}
                        style={{ width: 18, height: 18, cursor: "pointer", verticalAlign: "middle" }}
                      />
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "var(--txs)",
                          fontWeight: 700,
                          color: estCoche ? "var(--accent)" : "var(--text-muted)",
                        }}
                      >
                        {r.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: estCoche ? 650 : 500, color: "var(--text)" }}>
                        {r.libelle ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE_CATEGORIE[r.categorie] ?? "badge-accent"}`}>
                        {LABELS_CATEGORIE[r.categorie] ?? r.categorie}
                        {r.type_valeur ? ` · ${r.type_valeur}` : ""}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          opacity: estCoche ? 1 : 0.3,
                          pointerEvents: estCoche ? "auto" : "none",
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        <input
                          type="number"
                          step="0.01"
                          name={`defaut_${r.code}`}
                          defaultValue={valeursDefautInitiales.get(r.code) ?? 0}
                          placeholder={
                            r.categorie === "pourcentage"
                              ? "Taux (%)"
                              : r.categorie === "nombre_x_taux"
                              ? "Quantité / Taux"
                              : "Montant (DA)"
                          }
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "var(--rsm)",
                            border: "1px solid var(--border)",
                            fontSize: "var(--txs)",
                            background: estCoche ? "var(--surface)" : "var(--surface-2)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {message && <p className="badge badge-green" style={{ display: "inline-block", marginTop: "var(--s3)" }}>{message}</p>}
      {erreur && <p className="badge badge-red" style={{ display: "inline-block", marginTop: "var(--s3)" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s4)" }}>
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Enregistrement..." : "Enregistrer les rubriques"}
        </button>
      </div>
    </form>
  );
}
