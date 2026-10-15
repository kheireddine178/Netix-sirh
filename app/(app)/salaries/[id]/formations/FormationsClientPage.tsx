"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creerFormationCatalogue,
  creerInscriptionFormation,
  supprimerInscriptionFormation,
  type FormationRow,
  type InscriptionRow,
  type Salarie,
} from "../../actions";

interface Props {
  salarie: Salarie;
  catalogue: FormationRow[];
  inscriptions: InscriptionRow[];
}

export default function FormationsClientPage({ salarie, catalogue, inscriptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire inscription
  const [selectedFormationId, setSelectedFormationId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [statut, setStatut] = useState("Prévue");

  // Formulaire création catalogue
  const [titre, setTitre] = useState("");
  const [theme, setTheme] = useState("");
  const [organisme, setOrganisme] = useState("");
  const [dureeJours, setDureeJours] = useState(1);
  const [prixDa, setPrixDa] = useState(0);

  // Formulaire évaluation (local pour impression directe)
  const [evalAnnee, setEvalAnnee] = useState("2026");
  const [evalName, setEvalName] = useState("");
  const [evalNote, setEvalNote] = useState("5");
  const [evalObjectifs, setEvalObjectifs] = useState("");
  const [evalCommentaires, setEvalCommentaires] = useState("");

  const handleCreerFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre || !organisme || dureeJours <= 0) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("titre", titre);
    formData.append("theme", theme);
    formData.append("organisme", organisme);
    formData.append("duree_jours", String(dureeJours));
    formData.append("prix_da", String(prixDa));

    startTransition(async () => {
      try {
        await creerFormationCatalogue(formData);
        setTitre("");
        setTheme("");
        setOrganisme("");
        setDureeJours(1);
        setPrixDa(0);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de création de formation");
      }
    });
  };

  const handleInscrireSalarie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormationId || !dateDebut) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("formation_id", selectedFormationId);
    formData.append("date_debut", dateDebut);
    formData.append("statut", statut);

    startTransition(async () => {
      try {
        await creerInscriptionFormation(salarie.id, formData);
        setSelectedFormationId("");
        setDateDebut("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur d'inscription");
      }
    });
  };

  const handleSupprimerInscription = async (id: number) => {
    if (!confirm("Voulez-vous vraiment retirer ce salarié de cette formation ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerInscriptionFormation(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  const handleImprimerEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      annee: evalAnnee,
      evaluateur: evalName,
      note: evalNote,
      objectifs: evalObjectifs,
      commentaires: evalCommentaires,
    }).toString();

    window.open(`/salaries/${salarie.id}/formations/pdf-evaluation?${query}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)" }}>Erreur : {erreur}</div>}

      {/* SECTION 1 : SUIVI DES FORMATIONS */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Liste des inscriptions */}
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Formations suivies</h3>
          {inscriptions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Ce salarié n'est inscrit à aucune formation.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Formation</th>
                    <th>Theme</th>
                    <th>Date de début</th>
                    <th>Durée</th>
                    <th>Organisme</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptions.map((i) => (
                    <tr key={i.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold" }}>{i.formations?.titre || "—"}</td>
                      <td>{i.formations?.theme || "—"}</td>
                      <td>{i.date_debut.split("-").reverse().join("/")}</td>
                      <td>{i.formations?.duree_jours || 0} jours</td>
                      <td>{i.formations?.organisme || "—"}</td>
                      <td>
                        <span className={`badge ${i.statut === "Terminée" ? "badge-teal" : i.statut === "En cours" ? "badge-accent" : "badge-secondary"}`}>
                          {i.statut}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSupprimerInscription(i.id)}
                          style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formulaire d'inscription */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Inscrire à une formation</h3>
          {catalogue.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--txs)" }}>
              Le catalogue est vide. Créez d'abord des cours ci-dessous.
            </p>
          ) : (
            <form onSubmit={handleInscrireSalarie} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Sélectionner la formation</label>
                <select value={selectedFormationId} onChange={(e) => setSelectedFormationId(e.target.value)} required>
                  <option value="">-- Choisir --</option>
                  {catalogue.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titre} ({c.duree_jours}j) - {c.organisme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Date de début</label>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                  <option value="Prévue">Prévue</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Annulée">Annulée</option>
                </select>
              </div>

              <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
                {isPending ? "Traitement..." : "Inscrire le salarié"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 2 : CREATION CATALOGUE & EVALUATION */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Évaluation / Questionnaires */}
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Fiche d'Évaluation de Performance</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--txs)", marginBottom: "var(--s4)" }}>
            Saisissez les résultats de l'entretien d'évaluation annuel pour générer le bilan PDF officiel.
          </p>

          <form onSubmit={handleImprimerEvaluation} className="grid grid-cols-2 gap-4">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Année d'évaluation</label>
              <input type="number" value={evalAnnee} onChange={(e) => setEvalAnnee(e.target.value)} required />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Nom de l'évaluateur</label>
              <input
                type="text"
                placeholder="Nom du Manager..."
                value={evalName}
                onChange={(e) => setEvalName(e.target.value)}
                required
              />
            </div>

            <div className="field col-span-2" style={{ marginBottom: 0 }}>
              <label>Note globale de performance</label>
              <select value={evalNote} onChange={(e) => setEvalNote(e.target.value)}>
                <option value="5">5 / Excellent (Dépasse largement les attentes)</option>
                <option value="4">4 / Très Bon (Au-dessus des objectifs)</option>
                <option value="3">3 / Satisfaisant (Objectifs atteints)</option>
                <option value="2">2 / À améliorer (Objectifs partiellement atteints)</option>
                <option value="1">1 / Insuffisant (Objectifs non atteints)</option>
              </select>
            </div>

            <div className="field col-span-2" style={{ marginBottom: 0 }}>
              <label>Objectifs atteints & Compétences clés</label>
              <textarea
                value={evalObjectifs}
                onChange={(e) => setEvalObjectifs(e.target.value)}
                placeholder="Rédigez les points forts et objectifs atteints..."
                required
                style={{ width: "100%", height: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="field col-span-2" style={{ marginBottom: 0 }}>
              <label>Axes d'amélioration & Commentaires RH</label>
              <textarea
                value={evalCommentaires}
                onChange={(e) => setEvalCommentaires(e.target.value)}
                placeholder="Rédigez les axes de développement..."
                required
                style={{ width: "100%", height: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="col-span-2" style={{ textAlign: "right", marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Générer la Fiche d'Évaluation (PDF)
              </button>
            </div>
          </form>
        </div>

        {/* Ajouter cours catalogue */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Ajouter au catalogue</h3>
          <form onSubmit={handleCreerFormation} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Intitulé du cours</label>
              <input
                type="text"
                placeholder="ex: Sécurité industrielle, Langue..."
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Thème / Domaine</label>
              <input
                type="text"
                placeholder="ex: Technique, Management..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Organisme formateur</label>
              <input
                type="text"
                placeholder="ex: Centre National de Formation..."
                value={organisme}
                onChange={(e) => setOrganisme(e.target.value)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Durée (jours)</label>
              <input
                type="number"
                min="1"
                value={dureeJours}
                onChange={(e) => setDureeJours(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Coût pédagogique (DA)</label>
              <input
                type="number"
                step="0.01"
                value={prixDa}
                onChange={(e) => setPrixDa(parseFloat(e.target.value) || 0)}
              />
            </div>

            <button type="submit" disabled={isPending} className="btn btn-secondary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Création..." : "Ajouter au catalogue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
