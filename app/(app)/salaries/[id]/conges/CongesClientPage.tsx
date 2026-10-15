"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  creerCongeSalarie,
  supprimerCongeSalarie,
  changerStatutConge,
  type CongeRow,
  type ContratRow,
  type Salarie,
} from "../../actions";

interface Props {
  salarie: Salarie;
  conges: CongeRow[];
  contrats: ContratRow[];
}

export default function CongesClientPage({ salarie, conges, contrats }: Props) {
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

  // Calcul des compteurs (Loi algérienne : 2.5 jours par mois travaillé)
  const compteurs = useMemo(() => {
    const debut = contrats.length > 0
      ? new Date(Math.min(...contrats.map((c) => new Date(c.date_debut).getTime())))
      : new Date();

    const fin = new Date();
    const diffTime = Math.max(0, fin.getTime() - debut.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30.44;
    const acquis = Math.max(0, Math.floor(diffMonths * 2.5 * 2) / 2); // arrondir au demi-jour

    const pris = conges
      .filter((c) => c.type_conge === "Annuel" && c.statut === "Approuvé")
      .reduce((sum, c) => sum + c.jours_ouvrables, 0);

    const maladie = conges
      .filter((c) => c.type_conge === "Maladie" && c.statut === "Approuvé")
      .reduce((sum, c) => sum + c.jours_ouvrables, 0);

    const sansSolde = conges
      .filter((c) => c.type_conge === "Sans solde" && c.statut === "Approuvé")
      .reduce((sum, c) => sum + c.jours_ouvrables, 0);

    return {
      acquis,
      pris,
      reliquat: Math.max(0, acquis - pris),
      maladie,
      sansSolde,
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
    formData.append("statut", "En attente");

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
        setErreur(err instanceof Error ? err.message : "Erreur lors de la création de la demande");
      }
    });
  };

  const handleChangerStatut = async (id: number, statut: string) => {
    setErreur(null);
    startTransition(async () => {
      try {
        await changerStatutConge(id, statut, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de mise à jour");
      }
    });
  };

  const handleSupprimer = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerCongeSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {/* 1. Compteurs de congés */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--s4)" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--accent)", background: "var(--accent-light)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Congés Acquis</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.acquis} j</p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--teal)", background: "var(--teal-bg)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Congés Pris (Approuvés)</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.pris} j</p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--amber)", background: "var(--amber-bg)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Reliquat Solde</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>{compteurs.reliquat} j</p>
        </div>
        <div className="card" style={{ borderLeft: "4px solid var(--red-500, #ef4444)" }}>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>Maladies / Absences</span>
          <p style={{ fontSize: "var(--txl)", fontWeight: "bold", margin: "4px 0 0" }}>
            {compteurs.maladie} j / {compteurs.sansSolde} j
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Colonnes 1 & 2 : Demandes de congés */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>Historique des demandes</h3>
            
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
                      <th>Actions</th>
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
                              Ouvrir
                            </a>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {c.statut === "En attente N+1" && (
                              <>
                                <button onClick={() => handleChangerStatut(c.id, "En attente validation RH")} className="btn btn-teal btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                                  Valider N+1
                                </button>
                                <button onClick={() => handleChangerStatut(c.id, "Rejeté")} className="btn btn-red btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                                  Rejeter
                                </button>
                              </>
                            )}
                            {c.statut === "En attente validation RH" && (
                              <>
                                <button onClick={() => handleChangerStatut(c.id, "Approuvé")} className="btn btn-teal btn-sm" style={{ padding: "2px 6px", fontSize: "10px", background: "var(--teal)", color: "#fff" }}>
                                  Approbation RH Finale
                                </button>
                                <button onClick={() => handleChangerStatut(c.id, "Rejeté")} className="btn btn-red btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                                  Rejeter
                                </button>
                              </>
                            )}
                            {/* Fallback temporaire pour les anciens statuts "En attente" */}
                            {c.statut === "En attente" && (
                              <>
                                <button onClick={() => handleChangerStatut(c.id, "En attente validation RH")} className="btn btn-teal btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                                  Valider N+1
                                </button>
                                <button onClick={() => handleChangerStatut(c.id, "Rejeté")} className="btn btn-red btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                                  Rejeter
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleSupprimer(c.id)}
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginLeft: 4 }}
                              title="Supprimer la demande"
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Colonne 3 : Formulaire de demande */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: "var(--s3)" }}>Demander un congé</h3>
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
                <label>Motif / Justification</label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="ex: Rendez-vous médical..."
                  style={{ width: "100%", height: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Lien justificatif (justificatif_url)</label>
                <input
                  type="text"
                  placeholder="ex: http://lien-justificatif.pdf"
                  value={justificatifUrl}
                  onChange={(e) => setJustificatifUrl(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
                {isPending ? "Création..." : "Soumettre la demande"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
