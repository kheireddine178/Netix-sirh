"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creerPromotionSalarie,
  supprimerPromotionSalarie,
  creerSanctionSalarie,
  supprimerSanctionSalarie,
  creerObjectifSalarie,
  supprimerObjectifSalarie,
  type PromotionRow,
  type SanctionRow,
  type ObjectifRow,
  type Salarie,
} from "../../actions";

interface Props {
  salarie: Salarie;
  promotions: PromotionRow[];
  sanctions: SanctionRow[];
  objectifs: ObjectifRow[];
}

export default function CarriereClientPage({ salarie, promotions, sanctions, objectifs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout promotion
  const [nouveauPoste, setNouveauPoste] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState("");
  const [dateEffetPromo, setDateEffetPromo] = useState("");
  const [salaireBaseNouveau, setSalaireBaseNouveau] = useState(salarie.salaire_base_theorique);

  // Formulaire d'ajout sanction
  const [typeSanction, setTypeSanction] = useState("Avertissement");
  const [motifSanction, setMotifSanction] = useState("");
  const [dateSanction, setDateSanction] = useState("");
  const [dureeMiseAPied, setDureeMiseAPied] = useState(0);

  // Formulaire d'ajout objectif
  const [objAnnee, setObjAnnee] = useState(new Date().getFullYear());
  const [objTitre, setObjTitre] = useState("");
  const [objPoids, setObjPoids] = useState(1);
  const [objCible, setObjCible] = useState("");
  const [objRealise, setObjRealise] = useState("");
  const [objTauxReussite, setObjTauxReussite] = useState(0);

  const formatDA = (val: number) => {
    return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ') + " DA";
  };

  const handleAjouterPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauPoste || !dateEffetPromo || salaireBaseNouveau <= 0) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("ancien_poste", salarie.fonction || "");
    formData.append("nouveau_poste", nouveauPoste);
    formData.append("ancienne_categorie", "");
    formData.append("nouvelle_categorie", nouvelleCategorie);
    formData.append("date_effet", dateEffetPromo);
    formData.append("salaire_base_nouveau", String(salaireBaseNouveau));

    startTransition(async () => {
      try {
        await creerPromotionSalarie(salarie.id, formData);
        setNouveauPoste("");
        setNouvelleCategorie("");
        setDateEffetPromo("");
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de création de la promotion");
      }
    });
  };

  const handleSupprimerPromotion = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet historique de promotion ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerPromotionSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  const handleAjouterSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motifSanction || !dateSanction) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("type_sanction", typeSanction);
    formData.append("motif", motifSanction);
    formData.append("date_sanction", dateSanction);
    formData.append("duree_mise_a_pied", String(dureeMiseAPied));

    startTransition(async () => {
      try {
        await creerSanctionSalarie(salarie.id, formData);
        setMotifSanction("");
        setDateSanction("");
        setDureeMiseAPied(0);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur d'ajout de la sanction");
      }
    });
  };

  const handleSupprimerSanction = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette sanction disciplinaire ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerSanctionSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  const handleAjouterObjectif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitre || objPoids <= 0) return;
    setErreur(null);

    const formData = new FormData();
    formData.append("annee", String(objAnnee));
    formData.append("titre", objTitre);
    formData.append("poids", String(objPoids));
    formData.append("cible", objCible);
    formData.append("realise", objRealise);
    formData.append("taux_reussite", String(objTauxReussite));

    startTransition(async () => {
      try {
        await creerObjectifSalarie(salarie.id, formData);
        setObjTitre("");
        setObjPoids(1);
        setObjCible("");
        setObjRealise("");
        setObjTauxReussite(0);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur lors de la création de l'objectif");
      }
    });
  };

  const handleSupprimerObjectif = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet objectif ?")) return;
    setErreur(null);
    startTransition(async () => {
      try {
        await supprimerObjectifSalarie(id, salarie.id);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur de suppression");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
      {erreur && <div style={{ color: "var(--red)", fontSize: "var(--txs)" }}>Erreur : {erreur}</div>}

      {/* SECTION 1 : PROMOTIONS & POSTES */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Historique des postes &amp; Promotions</h3>
          {promotions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucune promotion ou modification de poste enregistrée.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Poste précédent</th>
                    <th>Nouveau poste</th>
                    <th>Date d'effet</th>
                    <th>Nouveau salaire</th>
                    <th>Décision</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td>{p.ancien_poste || "—"}</td>
                      <td style={{ fontWeight: "bold" }}>{p.nouveau_poste}</td>
                      <td>{p.date_effet.split("-").reverse().join("/")}</td>
                      <td style={{ fontWeight: "bold" }}>{formatDA(p.salaire_base_nouveau)}</td>
                      <td>
                        <a
                          href={`/salaries/${salarie.id}/carriere/pdf-decision?promotionId=${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                        >
                          Générer PDF Décision
                        </a>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSupprimerPromotion(p.id)}
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

        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Enregistrer une promotion</h3>
          <form onSubmit={handleAjouterPromotion} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Nouveau Poste / Fonction</label>
              <input
                type="text"
                placeholder="ex: Chef de Projet..."
                value={nouveauPoste}
                onChange={(e) => setNouveauPoste(e.target.value)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Nouveau Salaire de Base (DA)</label>
              <input
                type="number"
                step="0.01"
                value={salaireBaseNouveau}
                onChange={(e) => setSalaireBaseNouveau(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date d'effet</label>
              <input type="date" value={dateEffetPromo} onChange={(e) => setDateEffetPromo(e.target.value)} required />
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Traitement..." : "Appliquer la promotion"}
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 2 : DISCIPLINE & SANCTIONS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Historique disciplinaire &amp; Sanctions</h3>
          {sanctions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucune sanction disciplinaire enregistrée.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Type de sanction</th>
                    <th>Motif</th>
                    <th>Date</th>
                    <th>Mise à pied</th>
                    <th>Notification</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sanctions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold", color: "var(--red)" }}>{s.type_sanction}</td>
                      <td>{s.motif}</td>
                      <td>{s.date_sanction.split("-").reverse().join("/")}</td>
                      <td>{s.duree_mise_a_pied ? `${s.duree_mise_a_pied} jours` : "—"}</td>
                      <td>
                        <a
                          href={`/salaries/${salarie.id}/carriere/pdf-sanction?sanctionId=${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                        >
                          Générer PDF Lettre
                        </a>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSupprimerSanction(s.id)}
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

        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Enregistrer une sanction</h3>
          <form onSubmit={handleAjouterSanction} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Type de sanction</label>
              <select value={typeSanction} onChange={(e) => setTypeSanction(e.target.value)} required>
                <option value="Avertissement">Avertissement</option>
                <option value="Blâme">Blâme</option>
                <option value="Mise à pied">Mise à pied</option>
                <option value="Licenciement">Licenciement</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Motif de la sanction</label>
              <textarea
                value={motifSanction}
                onChange={(e) => setMotifSanction(e.target.value)}
                placeholder="ex: Abandons de poste injustifiés..."
                required
                style={{ width: "100%", height: "60px", padding: "6px", borderRadius: "4px", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date de la sanction</label>
              <input type="date" value={dateSanction} onChange={(e) => setDateSanction(e.target.value)} required />
            </div>

            {typeSanction === "Mise à pied" && (
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Durée de mise à pied (jours)</label>
                <input
                  type="number"
                  min="1"
                  value={dureeMiseAPied}
                  onChange={(e) => setDureeMiseAPied(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Enregistrement..." : "Notifier la sanction"}
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3 : OBJECTIFS & INDIFICATEURS (KPIs) */}
      <div className="grid md:grid-cols-3 gap-6" style={{ marginTop: "var(--s4)" }}>
        <div className="md:col-span-2 card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Objectifs Annuels &amp; KPIs de Performance</h3>
          {objectifs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>Aucun objectif de performance enregistré pour le moment.</p>
          ) : (
            <div className="table-wrap">
              <table style={{ width: "100%", fontSize: "var(--txs)" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    <th>Année</th>
                    <th>Intitulé de l'objectif</th>
                    <th>Poids</th>
                    <th>Cible</th>
                    <th>Réalisé</th>
                    <th>Taux de réussite</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {objectifs.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ fontWeight: "bold" }}>{o.annee}</td>
                      <td>{o.titre}</td>
                      <td>x{o.poids}</td>
                      <td>{o.cible || "—"}</td>
                      <td>{o.realise || "—"}</td>
                      <td>
                        <span className={`badge ${
                          o.taux_reussite >= 80
                            ? "badge-teal"
                            : o.taux_reussite >= 50
                            ? "badge-amber"
                            : "badge-red"
                        }`}>
                          {o.taux_reussite}%
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSupprimerObjectif(o.id)}
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

        <div className="card">
          <h3 style={{ marginBottom: "var(--s3)" }}>Ajouter un objectif</h3>
          <form onSubmit={handleAjouterObjectif} style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Année</label>
              <input
                type="number"
                value={objAnnee}
                onChange={(e) => setObjAnnee(parseInt(e.target.value, 10) || new Date().getFullYear())}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Intitulé de l'objectif (KPI)</label>
              <input
                type="text"
                value={objTitre}
                onChange={(e) => setObjTitre(e.target.value)}
                placeholder="Ex: Clôture de paie sans erreurs"
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Poids / Importance (Coeff)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={objPoids}
                onChange={(e) => setObjPoids(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Cible attendue</label>
              <input
                type="text"
                value={objCible}
                onChange={(e) => setObjCible(e.target.value)}
                placeholder="Ex: Avant le 28 du mois"
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Réalisation constatée</label>
              <input
                type="text"
                value={objRealise}
                onChange={(e) => setObjRealise(e.target.value)}
                placeholder="Ex: Réalisé à 100%"
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>Taux de réussite (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={objTauxReussite}
                onChange={(e) => setObjTauxReussite(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>

            <button type="submit" disabled={isPending} className="btn btn-primary" style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}>
              {isPending ? "Création..." : "Ajouter l'objectif"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
