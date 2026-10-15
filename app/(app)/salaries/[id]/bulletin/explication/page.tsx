import Link from "next/link";
import { notFound } from "next/navigation";
import { getBulletinPourPdf } from "../../../actions";
import { genererExplicationDonnees, fmtDa, fmtPct, fmtH } from "@/lib/paieExplication";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ annee?: string; mois?: string }>;
}

export default async function ExplicationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);

  const sParams = await searchParams;
  const annee = parseInt(sParams.annee || "", 10);
  const mois = parseInt(sParams.mois || "", 10);

  if (!salarieId || !annee || !mois) {
    return (
      <div className="card">
        <p style={{ color: "var(--red-600)" }}>Paramètres annee et mois requis dans l'URL.</p>
        <Link href={`/salaries/${salarieId}/historique`} className="btn btn-secondary mt-4">
          Retour à l'historique
        </Link>
      </div>
    );
  }

  const donnees = await getBulletinPourPdf(salarieId, annee, mois);
  if (!donnees) notFound();

  const d = genererExplicationDonnees(
    donnees.salarie,
    annee,
    mois,
    donnees.saisie,
    donnees.resultat,
    donnees.params
  );

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <PageHeader
        title={`Explication du bulletin (${d.moisNom} ${d.annee})`}
        subtitle={`Salarié : ${d.nom}`}
        breadcrumbs={[
          { label: "Collaborateurs", href: "/salaries" },
          { label: d.nom, href: `/salaries/${salarieId}` },
          { label: "Historique", href: `/salaries/${salarieId}/historique` },
          { label: `Explication (${d.moisNom} ${d.annee})` },
        ]}
        primaryAction={
          <Button
            variant="primary"
            href={`/salaries/${salarieId}/bulletin/explication/pdf?annee=${annee}&mois=${mois}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Télécharger le PDF d&apos;explication
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" href={`/salaries/${salarieId}/historique`}>
              ← Retour à l&apos;historique
            </Button>
            <Button variant="secondary" href={`/salaries/${salarieId}`}>
              Fiche salarié
            </Button>
          </div>
        }
      />

      {/* Grid d'explication */}
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s6)" }}>
        
        {/* Section 1: Salaire de base réel */}
        <section className="card">
          <h2 style={{ marginBottom: "var(--s3)", color: "var(--navy)" }}>1. Salaire de base réel après absences</h2>
          <p style={{ marginBottom: "var(--s4)" }}>
            Calculé sur la base de la durée légale mensuelle de <strong>{fmtH(d.dureeLegaleMensuelle)}</strong>.
          </p>
          
          <div className="table-wrap" style={{ marginBottom: "var(--s4)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td><strong>Salaire de base théorique</strong></td>
                  <td style={{ textAlign: "right" }}>{fmtDa(d.salaireBaseTheorique)}</td>
                </tr>
                <tr>
                  <td>Heures d'absences</td>
                  <td style={{ textAlign: "right" }}>{fmtH(d.totalHeuresAbsence)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid var(--border)" }}>
                  <td><strong>Heures travaillées</strong></td>
                  <td style={{ textAlign: "right" }}><strong>{fmtH(d.heuresTravaillees)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: "var(--s3)",
              background: "var(--bg-2)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--mono)",
              fontSize: "var(--tsm)",
            }}
          >
            <p>Taux horaire = {fmtDa(d.salaireBaseTheorique)} ÷ {fmtH(d.dureeLegaleMensuelle)} = {fmtDa(d.tauxHoraire)}/h</p>
            <p>Salaire réel = {fmtDa(d.tauxHoraire)}/h × {fmtH(d.heuresTravaillees)} = {fmtDa(d.salaireBaseReel)}</p>
          </div>
        </section>

        {/* Section 2: Gains */}
        <section className="card">
          <h2 style={{ marginBottom: "var(--s3)", color: "var(--navy)" }}>2. Éléments de gains (Total Brut)</h2>
          <div className="table-wrap" style={{ marginBottom: "var(--s4)" }}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Rubrique</th>
                  <th>Formule de calcul</th>
                  <th style={{ textAlign: "right" }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {d.gains.map((g, i) => (
                  <tr key={i}>
                    <td>{g.libelle}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "var(--tsm)" }}>{g.formule}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>{fmtDa(g.montant)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid var(--navy)", background: "var(--bg-2)" }}>
                  <td><strong>TOTAL BRUT</strong></td>
                  <td></td>
                  <td style={{ textAlign: "right", fontWeight: "bold", color: "var(--navy)" }}>{fmtDa(d.totalGains)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: CNAS */}
        <section className="card">
          <h2 style={{ marginBottom: "var(--s3)", color: "var(--navy)" }}>3. Cotisations de Sécurité Sociale (CNAS)</h2>
          <div
            style={{
              padding: "var(--s4)",
              background: "var(--bg-2)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--mono)",
              fontSize: "var(--tsm)",
              marginBottom: "var(--s4)",
            }}
          >
            <p>Base CNAS (Gains - Panier et frais) = {fmtDa(d.baseCnas)}</p>
            <p>Cotisation Salariale (9%) = {fmtDa(d.baseCnas)} × 9% = <strong>{fmtDa(d.retenueCnas)}</strong></p>
            <p>Cotisation Employeur (26%) = {fmtDa(d.baseCnas)} × 26% = {fmtDa(d.chargePatronaleCnas)}</p>
          </div>
        </section>

        {/* Section 4: IRG */}
        <section className="card">
          <h2 style={{ marginBottom: "var(--s3)", color: "var(--navy)" }}>4. Impôt sur le Revenu Global (IRG)</h2>
          <p style={{ marginBottom: "var(--s3)" }}>
            Assiette imposable IRG (Total Brut - CNAS 9%) = <strong>{fmtDa(d.baseImposableIrg)}</strong>
          </p>

          {d.estExonereIrg ? (
            <div
              style={{
                padding: "var(--s4)",
                background: "var(--green-50)",
                border: "1px solid var(--green-300)",
                color: "var(--green-800)",
                borderRadius: "var(--radius)",
              }}
            >
              <strong>Exonération totale IRG :</strong> La base imposable est inférieure ou égale au seuil légal de {fmtDa(d.seuilExonerationIrg)}/mois. Aucun impôt n'est dû.
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "var(--tmd)", marginBottom: "var(--s2)" }}>Calcul par tranches cumulatives</h3>
              <div className="table-wrap" style={{ marginBottom: "var(--s4)" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Tranche mensuelle</th>
                      <th style={{ textAlign: "right" }}>Taux</th>
                      <th style={{ textAlign: "right" }}>Montant dans la tranche</th>
                      <th style={{ textAlign: "right" }}>Impôt partiel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.tranchesIrg.map((tr, i) => (
                      <tr key={i}>
                        <td>{tr.tranche}</td>
                        <td style={{ textAlign: "right" }}>{tr.taux}</td>
                        <td style={{ textAlign: "right" }}>{fmtDa(tr.montantTranche)}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>{fmtDa(tr.impotPartiel)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "var(--bg-2)" }}>
                      <td><strong>IRG Brut Cumulé</strong></td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>{fmtDa(d.irgBrut)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: "var(--tmd)", marginBottom: "var(--s2)" }}>Abattement de 40% (Art. 104-3 CIDTA)</h3>
              <div
                style={{
                  padding: "var(--s4)",
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--mono)",
                  fontSize: "var(--tsm)",
                }}
              >
                <p>Abattement théorique (40%) = {fmtDa(d.irgBrut)} × 40% = {fmtDa(d.abattementTheorique)}</p>
                <p>Limites légales d'abattement : Min {fmtDa(d.abattementMin)} / Max {fmtDa(d.abattementMax)}</p>
                <p>
                  Abattement retenu : <strong>{fmtDa(d.abattementRetenu)}</strong> ({d.abattementStatus === "plafond" ? "Plafonné au Maximum" : d.abattementStatus === "plancher" ? "Planché au Minimum" : "Normal"})
                </p>
                <p><strong>IRG net = {fmtDa(d.irgBrut)} - {fmtDa(d.abattementRetenu)} = {fmtDa(d.retenueIrgNette)}</strong></p>
              </div>
            </div>
          )}

          {d.baseImposable10pct > 0 && (
            <div
              style={{
                marginTop: "var(--s4)",
                padding: "var(--s3)",
                background: "var(--bg-2)",
                fontFamily: "var(--mono)",
                fontSize: "var(--tsm)",
                borderRadius: "var(--radius)",
              }}
            >
              <p>IRG Forfaitaire (10% sur primes non-mensuelles) = {fmtDa(d.baseImposable10pct)} × 10% = <strong>{fmtDa(d.retenue10pct)}</strong></p>
            </div>
          )}
        </section>

        {/* Synthèse finale */}
        <section
          className="card"
          style={{
            background: "var(--green-50)",
            border: "1px solid var(--green-200)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--s4)",
          }}
        >
          <div>
            <h2 style={{ color: "var(--green-800)", marginBottom: "var(--s2)" }}>Rémunération Salarié</h2>
            <p style={{ fontSize: "var(--tlg)" }}>
              Net à payer : <strong style={{ color: "var(--green-700)" }}>{fmtDa(d.netAPayer)}</strong>
            </p>
            <p style={{ color: "var(--green-600)", fontSize: "var(--tsm)", marginTop: "var(--s2)" }}>
              Total gains : {fmtDa(d.totalGains)} | Total retenues : {fmtDa(d.totalRetenues)}
            </p>
          </div>
          <div>
            <h2 style={{ color: "var(--green-800)", marginBottom: "var(--s2)" }}>Coût pour l'entreprise</h2>
            <p style={{ fontSize: "var(--tlg)" }}>
              Coût total employeur : <strong style={{ color: "var(--green-700)" }}>{fmtDa(d.coutTotalEmployeur)}</strong>
            </p>
            <p style={{ color: "var(--green-600)", fontSize: "var(--tsm)", marginTop: "var(--s2)" }}>
              Charges patronales CNAS : {fmtDa(d.chargePatronaleCnas)}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
