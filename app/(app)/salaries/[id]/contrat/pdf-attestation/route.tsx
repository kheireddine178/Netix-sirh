import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerContratsSalarie } from "../../../actions";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.8,
  },
  header: {
    textAlign: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  section: {
    marginBottom: 30,
    marginTop: 20,
  },
  bodyText: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 20,
    textIndent: 30,
  },
  footer: {
    marginTop: 80,
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "50%",
    textAlign: "center",
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 50,
  }
});

function AttestationPdfDocument({ salarie, contrats }: { salarie: any; contrats: any[] }) {
  const dates = contrats.map((c) => new Date(c.date_debut).getTime());
  const dateDebutInitiale = dates.length > 0
    ? new Date(Math.min(...dates)).toISOString().split("T")[0].split("-").reverse().join("/")
    : salarie.cree_le
      ? new Date(salarie.cree_le).toISOString().split("T")[0].split("-").reverse().join("/")
      : "—";

  const dateDuJour = new Date().toISOString().split("T")[0].split("-").reverse().join("/");

  return (
    <Document title={`Attestation de Travail — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Unité Chaabat El Leham</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>ATTESTATION DE TRAVAIL</Text>

        {/* Contenu */}
        <View style={styles.section}>
          <Text style={styles.bodyText}>
            Nous soussignés, société NETIX PAIE SPA, Direction des Ressources Humaines, certifions par la présente que :
          </Text>

          <Text style={[styles.bodyText, { textIndent: 0, paddingLeft: 30 }]}>
            L'intéressé(e) : <Text style={{ fontFamily: "Helvetica-Bold" }}>{salarie.nom_prenom}</Text>{"\n"}
            Matricule : <Text style={{ fontFamily: "Helvetica-Bold" }}>{salarie.matricule || "—"}</Text>{"\n"}
            Fonction : <Text style={{ fontFamily: "Helvetica-Bold" }}>{salarie.fonction || "—"}</Text>
          </Text>

          <Text style={styles.bodyText}>
            est employé(e) au sein de notre entreprise depuis le {dateDebutInitiale} jusqu'à ce jour, en qualité de {salarie.fonction || "salarié(e)"}.
          </Text>

          <Text style={styles.bodyText}>
            Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 11, marginBottom: 5 }}>Fait à Chaabat El Leham, le {dateDuJour}</Text>
            <Text style={styles.signatureTitle}>Le Directeur des Ressources Humaines</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af" }}>(Griffe et signature)</Text>
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

  const doc = createElement(AttestationPdfDocument, { salarie, contrats });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `Attestation_Travail_${salarie.nom_prenom.replace(/\s+/g, "_")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
