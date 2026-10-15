"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  creerCongeSalarie,
  supprimerCongeSalarie,
  type CongeRow,
  type ContratRow,
  type Salarie,
} from "../../../(app)/salaries/actions";

interface Props {
  salarie: Salarie;
  conges: CongeRow[];
  contrats: ContratRow[];
}

export default function EspaceCongesClient({ salarie, conges, contrats }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout
  const [typeConge, setTypeConge] = useState("Annuel");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [joursOuvrables, setJoursOuvrables] = useState(0);
  const [motif, setMotif] = useState("");
  const [justificatifUrl, setJustificatifUrl] = useState("");

  const compteurs = useMemo(() => {
    const debut = contrats.length > 0
      ? new Date(Math.min(...contrats.map((c) => new Date(c.date_debut).getTime())))
      : new Date();

    const fin = new Date();
    const diffTime = Math.max(0, fin.getTime() - debut.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30.44;
    const acquis = Math.max(0, Math.floor(diffMonths * 2.5 * 2) / 2);

    const pris = conges
      .filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé")
      .reduce((sum, c) => sum + c.jours_ouvrables, 0);

    const maladie = conges
      .filter((c) => c.type_conge === "Maladie" && c.statut === "Approuvé")
      .reduce((sum, c) => sum + c.jours_ouvrables, 0);

    return {
      acquis,
      pris,
      reliquat: Math.max(0, acquis - pris),
      maladie,
    };
  }, [contrats, conges]);

  const handleAjouterConge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateDebut || !dateFin || joursOuvrables <= 0) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("type_conge", typeConge);
    formData.append("date_debut", dateDebut);
    formData.append("date_fin", dateFin);
    formData.append("jours_ouvrables", String(joursOuvrables));
    formData.append("motif", motif);
    formData.append("justificatif_url", justificatifUrl);
    formData.append("statut", "En attente N+1");

    startTransition(async () => {
      try {
        await creerCongeSalarie(salarie.id, formData);
        setDateDebut("");
        setDateFin("");
        setJoursOuvrables(0);
        setMotif("");
        setJustificatifUrl("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de soumission");
      }
    });
  };

  const handleSupprimer = async (id: number) => {
    if (!confirm("Voulez-vous vraiment annuler cette demande ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerCongeSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur d'annulation");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {/* Compteurs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--s4)" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--accent)", background: "var(--accent-light)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Congés Acquis</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.acquis} j</p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--teal)", background: "var(--teal-bg)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Congés Pris</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.pris} j</p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--amber)", background: "var(--amber-bg)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Reliquat Disponible</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.reliquat} j</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Historique demandes */}
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Mes demandes de congés</h3>
          {conges.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun congé enregistré pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Type</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Jours</th>
                    <th>Statut</th>
                    <th>Justificatif</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {conges.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold" }}>{c.type_conge}</td>
                      <td>{c.date_debut.split("-").reverse().join("/")}</td>
                      <td>{c.date_fin.split("-").reverse().join("/")}</td>
                      <td style={{ fontWeight: "bold" }}>{c.jours_ouvrables} j</td>
                      <td>
                        <span className={`badge ${
                          c.statut === "Approuvé"
                            ? "badge-teal"
                            : c.statut === "Rejeté"
                            ? "badge-red"
                            : c.statut === "En attente validation RH"
                            ? "badge-amber"
                            : "badge-accent"
                        }`}>
                          {c.statut}
                        </span>
                      </td>
                      <td>
                        {c.justificatif_url ? (
                          <a href={c.justificatif_url} target="_blank" rel="noopener noreferrer" className="btn-link">
                            Voir
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {(c.statut === "En attente N+1" || c.statut === "En attente") && (
                          <button
                            onClick={() => handleSupprimer(c.id)}
                            style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}
                            title="Annuler la demande"
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

        {/* Nouvelle demande */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Nouvelle demande</h3>
          {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)", marginBottom: 8 }}>Erreur : {erreur}</div>}

          <form onSubmit={handleAjouterConge} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Type de congé</label>
              <select value={typeConge} onChange={(e) => setTypeConge(e.target.value)} required>
                <option value="Annuel">Annuel (Payé)</option>
                <option value="Maladie">Maladie</option>
                <option value="Maternité">Maternité</option>
                <option value="Sans solde">Absence Sans Solde</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Nombre de Jours Ouvrables</label>
              <input
                type="number"
                min="1"
                value={joursOuvrables}
                onChange={(e) => setJoursOuvrables(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Motif</label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Raison du congé..."
                style={{ width: "100%", height: "50px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
              />
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Soumission..." : "Soumettre la demande"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
