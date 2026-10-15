"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creerContratSalarie,
  supprimerContratSalarie,
  creerDocumentSalarie,
  supprimerDocumentSalarie,
  type ContratRow,
  type DocumentSalarieRow,
} from "../../actions";
import { type Salarie } from "../../actions";

interface Props {
  salarie: Salarie;
  contrats: ContratRow[];
  documents: DocumentSalarieRow[];
}

export default function ContratClientPage({ salarie, contrats, documents }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout de document
  const [docNom, setDocNom] = useState("");
  const [docCat, setDocCat] = useState("Identité");
  const [docUrl, setDocUrl] = useState("");

  const formatDA = (val: number) => {
    return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
  };

  const handleAjouterContrat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErreur(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await creerContratSalarie(salarie.id, formData);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de création du contrat");
      }
    });
  };

  const handleSupprimerContrat = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contrat ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerContratSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  const handleAjouterDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNom || !docUrl) return;
    setErreur(null);

    startTransition(async () => {
      try {
        await creerDocumentSalarie(salarie.id, docNom, docCat, docUrl);
        setDocNom("");
        setDocUrl("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur d'ajout du document");
      }
    });
  };

  const handleSupprimerDocument = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerDocumentSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6" style={{ marginTop: "var(--s4)" }}>
      {/* Colonne 1 & 2 : Contrats et Documents */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Liste des contrats */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Contrats de travail</h3>
          
          {contrats.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>
              Aucun contrat enregistré pour le moment. Remplissez le formulaire à droite pour en ajouter un.
            </p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Type</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Essai</th>
                    <th>Salaire</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contrats.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold" }}>{c.type_contrat}</td>
                      <td>{c.date_debut}</td>
                      <td>{c.date_fin || "—"}</td>
                      <td>{c.periode_essai_mois > 0 ? `${c.periode_essai_mois} mois` : "Aucune"}</td>
                      <td style={{ fontWeight: "bold" }}>{formatDA(c.salaire_base_contrat)}</td>
                      <td>
                        <span className={`badge ${c.statut === "En cours" ? "badge-teal" : "badge-red"}`}>
                          {c.statut}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSupprimerContrat(c.id)}
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

        {/* Documents joints */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Dossier documentaire (Justificatifs)</h3>
          
          <form onSubmit={handleAjouterDocument} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--s2)", marginBottom: "var(--s4)", borderBottom: "1px dashed var(--border)", paddingBottom: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Nom du document (ex: CNI)"
                value={docNom}
                onChange={(e) => setDocNom(e.target.value)}
                required
                style={{ height: "34px", padding: "6px" }}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <select
                value={docCat}
                onChange={(e) => setDocCat(e.target.value)}
                style={{ height: "34px", padding: "4px" }}
              >
                <option value="Identité">Identité</option>
                <option value="Diplôme">Diplôme</option>
                <option value="Contrat">Contrat</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Lien / URL du fichier"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                required
                style={{ height: "34px", padding: "6px" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: "34px", padding: "0 12px", fontSize: "var(--txs)" }}>
              + Téléverser
            </button>
          </form>

          {documents.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun document téléversé.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {documents.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "8px 12px", borderRadius: "var(--r)", border: "1px solid var(--border-soft)" }}>
                  <div>
                    <strong style={{ fontSize: "var(--tsm)" }}>{d.nom_document}</strong>
                    <span className="badge" style={{ marginLeft: 8, fontSize: "10px" }}>{d.categorie}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <a href={d.fichier_url} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ fontSize: "var(--txs)" }}>
                      Ouvrir
                    </a>
                    <button
                      onClick={() => handleSupprimerDocument(d.id)}
                      style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colonne 3 : Actions rapides & Formulaires */}
      <div className="space-y-6">
        
        {/* Génération automatique de documents officiels */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Édition Administrative</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--txs)", marginBottom: "var(--s4)" }}>
            Générez les documents de conformité administrative en un clic.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
            <a
              href={`/salaries/${salarie.id}/contrat/pdf-pv`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Imprimer le PV d'installation
            </a>
            <a
              href={`/salaries/${salarie.id}/contrat/pdf-attestation`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Imprimer l'Attestation de travail
            </a>
          </div>
        </div>

        {/* Formulaire d'ajout de contrat */}
        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Nouveau contrat</h3>
          {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)", marginBottom: 8 }}>Erreur : {erreur}</div>}

          <form onSubmit={handleAjouterContrat} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Type de contrat</label>
              <select name="type_contrat" required>
                <option value="CDI">CDI (Indéterminé)</option>
                <option value="CDD">CDD (Déterminé)</option>
                <option value="CTA">CTA (Aide à l'insertion)</option>
                <option value="SIVP">SIVP (Stage)</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Salaire de base (DA)</label>
              <input
                name="salaire_base_contrat"
                type="number"
                step="0.01"
                defaultValue={salarie.salaire_base_theorique}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date de début</label>
              <input name="date_debut" type="date" required />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date de fin (CDD uniquement)</label>
              <input name="date_fin" type="date" />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Période d'essai (mois)</label>
              <input name="periode_essai_mois" type="number" defaultValue="0" min="0" />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Statut</label>
              <select name="statut">
                <option value="En cours">En cours</option>
                <option value="Période d'essai">Période d'essai</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Création..." : "Ajouter le contrat"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
