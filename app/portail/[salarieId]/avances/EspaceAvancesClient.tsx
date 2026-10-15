"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creerAvanceSalarie,
  supprimerAvanceSalarie,
  type AvanceSalaireRow,
  type Salarie,
} from "../../../(app)/salaries/actions";

interface Props {
  salarie: Salarie;
  avances: AvanceSalaireRow[];
}

export default function EspaceAvancesClient({ salarie, avances }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout
  const [montant, setMontant] = useState("");
  const [periode, setPeriode] = useState(""); // Format YYYY-MM
  const [motif, setMotif] = useState("");

  const handleAjouterAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || !periode) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("montant", montant);
    formData.append("periode", periode);
    formData.append("motif", motif);

    startTransition(async () => {
      try {
        await creerAvanceSalarie(salarie.id, formData);
        setMontant("");
        setPeriode("");
        setMotif("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de soumission");
      }
    });
  };

  const handleAnnulerAvance = async (id: number) => {
    if (!confirm("Voulez-vous vraiment annuler cette demande d'avance ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerAvanceSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur d'annulation");
      }
    });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Historique demandes d'avances */}
      <div className="md:col-span-2 card">
        <h3 style={{ marginBottom: "var(--s3)" }}>Historique des avances demandées</h3>
        {avances.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
            Aucune demande d'avance enregistrée pour le moment.
          </p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: "100%", fontSize: "var(--txs)" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  <th>Mois / Période</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Motif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {avances.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    <td style={{ fontWeight: "bold" }}>
                      {String(a.mois).padStart(2, "0")}/{a.annee}
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {a.montant.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, ' ')} DA
                    </td>
                    <td>
                      <span className={`badge ${
                        a.statut === "Approuvée"
                          ? "badge-teal"
                          : a.statut === "Rejetée"
                          ? "badge-red"
                          : "badge-accent"
                      }`}>
                        {a.statut}
                      </span>
                    </td>
                    <td>{a.motif || "—"}</td>
                    <td>
                      {a.statut === "En attente" && (
                        <button
                          onClick={() => handleAnnulerAvance(a.id)}
                          style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "11px" }}
                        >
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nouvelle demande d'avance */}
      <div className="card">
        <h3 style={{ marginBottom: "var(--s3)" }}>Demander une avance</h3>
        {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)", marginBottom: 8 }}>Erreur : {erreur}</div>}

        <form onSubmit={handleAjouterAvance} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Montant de l'avance (DA)</label>
            <input
              type="number"
              min="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 15000"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Mois / Période de paie visée</label>
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Motif / Raison</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Frais de rentrée scolaire, frais médicaux..."
              style={{ width: "100%", height: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
            style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
          >
            {isPending ? "Soumission..." : "Soumettre la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}
