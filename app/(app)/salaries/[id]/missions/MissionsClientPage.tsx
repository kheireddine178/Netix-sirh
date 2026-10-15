"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creerMissionSalarie,
  supprimerMissionSalarie,
  changerStatutMission,
  type MissionRow,
  type Salarie,
} from "../../actions";

interface Props {
  salarie: Salarie;
  missions: MissionRow[];
}

export default function MissionsClientPage({ salarie, missions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout
  const [objet, setObjet] = useState("");
  const [destination, setDestination] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [moyenTransport, setMoyenTransport] = useState("Véhicule de service");
  const [statut, setStatut] = useState("En attente");

  const handleAjouterMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objet || !destination || !dateDebut || !dateFin) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("objet", objet);
    formData.append("destination", destination);
    formData.append("date_debut", dateDebut);
    formData.append("date_fin", dateFin);
    formData.append("moyen_transport", moyenTransport);
    formData.append("statut", statut);

    startTransition(async () => {
      try {
        await creerMissionSalarie(salarie.id, formData);
        setObjet("");
        setDestination("");
        setDateDebut("");
        setDateFin("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de création de la mission");
      }
    });
  };

  const handleChangerStatut = async (id: number, nouveauStatut: string) => {
    setErreur(null);
    startTransition(async () => {
      try {
        await changerStatutMission(id, nouveauStatut, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de mise à jour");
      }
    });
  };

  const handleSupprimer = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette mission ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerMissionSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6" style={{ marginTop: "var(--s4)" }}>
      {/* Colonne 1 & 2 : Liste des missions */}
      <div className="md:col-span-2 space-y-6">
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Ordres de mission & Déplacements</h3>

          {missions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun déplacement enregistré pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Objet</th>
                    <th>Destination</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Transport</th>
                    <th>Statut</th>
                    <th>Impression</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold" }}>{m.objet}</td>
                      <td>{m.destination}</td>
                      <td>{m.date_debut.split("-").reverse().join("/")}</td>
                      <td>{m.date_fin.split("-").reverse().join("/")}</td>
                      <td>{m.moyen_transport}</td>
                      <td>
                        <span className={`badge ${m.statut === "Approuvée" ? "badge-teal" : m.statut === "Terminée" ? "badge-red" : "badge-accent"}`}>
                          {m.statut}
                        </span>
                      </td>
                      <td>
                        {m.statut === "Approuvée" || m.statut === "Terminée" ? (
                          <a
                            href={`/salaries/${salarie.id}/missions/generate-ordre?missionId=${m.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 6px", fontSize: "10px" }}
                          >
                            Générer PDF Ordre
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>En attente</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {m.statut === "En attente" && (
                            <button onClick={() => handleChangerStatut(m.id, "Approuvée")} className="btn btn-teal btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                              Approuver
                            </button>
                          )}
                          {m.statut === "Approuvée" && (
                            <button onClick={() => handleChangerStatut(m.id, "Terminée")} className="btn btn-secondary btn-sm" style={{ padding: "2px 6px", fontSize: "10px" }}>
                              Terminer
                            </button>
                          )}
                          <button
                            onClick={() => handleSupprimer(m.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginLeft: 4 }}
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

      {/* Colonne 3 : Formulaire de création */}
      <div>
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Nouveau déplacement</h3>
          {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)", marginBottom: 8 }}>Erreur : {erreur}</div>}

          <form onSubmit={handleAjouterMission} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Objet de la mission</label>
              <input
                type="text"
                placeholder="ex: Installation client, Réunion technique..."
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Destination</label>
              <input
                type="text"
                placeholder="ex: Alger, Oran, Staging..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
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
              <label>Moyen de transport</label>
              <select value={moyenTransport} onChange={(e) => setMoyenTransport(e.target.value)} required>
                <option value="Véhicule de service">Véhicule de service</option>
                <option value="Véhicule personnel">Véhicule personnel</option>
                <option value="Transport en commun">Transport en commun</option>
                <option value="Avion">Avion</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Statut initial</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="En attente">En attente</option>
                <option value="Approuvée">Approuvée</option>
              </select>
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Création..." : "Enregistrer le déplacement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
