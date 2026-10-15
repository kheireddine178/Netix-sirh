import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerContratsSalarie } from "../../../actions";
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
    marginBottom: 40,
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
  },
  bodyText: {
    fontSize: 11,
    textAlign: "justify",
    marginBottom: 15,
  },
  footer: {
    marginTop: 80,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 40,
  }
});

function PvPdfDocument({ salarie, contrat }: { salarie: any; contrat: any }) {
  const dateDebut = contrat ? contrat.date_debut : salarie.cree_le ? new Date(salarie.cree_le).toISOString().split("T")[0] : "—";
  const typeContrat = contrat ? contrat.type_contrat : "CDI";

  return (
    <Document title={`PV d'installation — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Unité Chaabat El Leham</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>PROCES-VERBAL D'INSTALLATION</Text>

        {/* Contenu */}
        <View style={styles.section}>
          <Text style={styles.bodyText}>
            L'an deux mille vingt-six, et le {dateDebut.split("-").reverse().join("/")}, nous soussignés, Directeur des Ressources Humaines de la société NETIX PAIE SPA, déclarons avoir installé ce jour :
          </Text>

          <View style={{ marginVertical: 20, paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: "#111827" }}>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Nom & Prénom :</Text> {salarie.nom_prenom}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Matricule :</Text> {salarie.matricule || "—"}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Fonction :</Text> {salarie.fonction || "—"}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Type de contrat :</Text> {typeContrat}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Lieu d'affectation :</Text> Unité Chaabat El Leham</Text>
          </View>

          <Text style={styles.bodyText}>
            L'intéressé(e) est affecté(e) à compter de ce jour à son poste de travail et prendra ses fonctions réglementaires conformément aux dispositions du règlement intérieur de l'entreprise.
          </Text>

          <Text style={styles.bodyText}>
            En foi de quoi, le présent procès-verbal a été dressé pour servir et valoir ce que de droit.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>L'intéressé(e)</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af" }}>(Signature précédée de la mention manuscrite "Lu et approuvé")</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>L'employeur</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af" }}>Pour NETIX PAIE SPA</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);

  if (!salarieId) return new Response("ID manquant", { status: 400 });

  const salarie = await getSalarie(salarieId);
  if (!salarie) return new Response("Salarié introuvable", { status: 404 });

  const contrats = await listerContratsSalarie(salarieId);
  const contratActif = contrats.find((c) => c.statut === "En cours") || contrats[0] || null;

  const doc = createElement(PvPdfDocument, { salarie, contrat: contratActif });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `PV_Installation_${salarie.nom_prenom.replace(/\s+/g, "_")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
