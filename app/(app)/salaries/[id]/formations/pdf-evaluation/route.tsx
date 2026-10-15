import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerObjectifsSalarie } from "../../../actions";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.6,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 20,
    textAlign: "center",
  },
  companyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    padding: 15,
    backgroundColor: "#f9fafb",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    color: "#1e3a8a",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 150,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 4,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 4,
  },
  notesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  footer: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 40,
  }
});

function EvaluationPdf({ salarie, details, objectifs }: { salarie: any; details: any; objectifs: any[] }) {
  const dateDuJour = new Date().toISOString().split("T")[0].split("-").reverse().join("/");

  const ratings = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
  const stars = ratings[parseInt(details.note, 10) - 1] || "⭐⭐⭐⭐⭐";

  return (
    <Document title={`Bilan d'Évaluation — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Bilan de Performance</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>FICHE D'ÉVALUATION DE PERFORMANCE ANNUELLE ({details.annee})</Text>

        {/* Collaborateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. IDENTIFICATION DU COLLABORATEUR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom & Prénom :</Text>
            <Text style={styles.value}>{salarie.nom_prenom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Matricule :</Text>
            <Text style={styles.value}>{salarie.matricule || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fonction / Poste :</Text>
            <Text style={styles.value}>{salarie.fonction || "—"}</Text>
          </View>
        </View>

        {/* Objectifs KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. EVALUATION DES OBJECTIFS (KPIs)</Text>
          {objectifs.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>Aucun KPI de performance enregistré pour cette année.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 3 }}>Objectif</Text>
                <Text style={{ flex: 1 }}>Importance</Text>
                <Text style={{ flex: 1.5 }}>Cible</Text>
                <Text style={{ flex: 1.5 }}>Réalisé</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>Réussite</Text>
              </View>
              {objectifs.map((o) => (
                <View key={o.id} style={styles.tableRow}>
                  <Text style={{ flex: 3 }}>{o.titre}</Text>
                  <Text style={{ flex: 1 }}>x{o.poids}</Text>
                  <Text style={{ flex: 1.5 }}>{o.cible || "—"}</Text>
                  <Text style={{ flex: 1.5 }}>{o.realise || "—"}</Text>
                  <Text style={{ flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{o.taux_reussite}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Évaluation globale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. RÉSULTATS DE L'ENTRETIEN & APPRÉCIATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Évaluateur (Manager) :</Text>
            <Text style={styles.value}>{details.evaluateur}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Appréciation Globale :</Text>
            <Text style={[styles.value, { fontFamily: "Helvetica-Bold", color: "#1e3a8a" }]}>{stars}</Text>
          </View>

          <Text style={{ marginTop: 10, fontFamily: "Helvetica-Bold" }}>Objectifs atteints & Compétences clés :</Text>
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 9.5 }}>{details.objectifs}</Text>
          </View>

          <Text style={{ marginTop: 10, fontFamily: "Helvetica-Bold" }}>Axes d'amélioration & Commentaires RH :</Text>
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 9.5 }}>{details.commentaires}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Fait à Chaabat El Leham, le {dateDuJour}</Text>
            <Text style={styles.signatureTitle}>Signature du Collaborateur</Text>
            <Text style={{ fontSize: 8.5, color: "#9ca3af" }}>(Lu et approuvé)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Signature de l'Évaluateur</Text>
            <Text style={styles.signatureTitle}>Pour la Direction</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);

  const searchParams = request.nextUrl.searchParams;
  const details = {
    annee: searchParams.get("annee") || "2026",
    evaluateur: searchParams.get("evaluateur") || "Directeur RH",
    note: searchParams.get("note") || "5",
    objectifs: searchParams.get("objectifs") || "",
    commentaires: searchParams.get("commentaires") || "",
  };

  if (!salarieId) return new Response("ID manquant", { status: 400 });

  const salarie = await getSalarie(salarieId);
  if (!salarie) return new Response("Salarié introuvable", { status: 404 });

  // Récupérer et filtrer les objectifs de cette année pour le PDF
  const tousObjectifs = await listerObjectifsSalarie(salarieId);
  const objectifsAnnee = tousObjectifs.filter((o) => String(o.annee) === details.annee);

  const doc = createElement(EvaluationPdf, { salarie, details, objectifs: objectifsAnnee });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `Evaluation_Performance_${salarie.nom_prenom.replace(/\s+/g, "_")}_${details.annee}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
