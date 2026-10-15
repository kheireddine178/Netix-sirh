import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerSanctionsSalarie } from "../../../actions";
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
    marginBottom: 30,
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

function NotificationSanctionPdf({ salarie, sanction }: { salarie: any; sanction: any }) {
  const dateSanction = new Date(sanction.date_sanction).toISOString().split("T")[0].split("-").reverse().join("/");
  const dateDuJour = new Date().toISOString().split("T")[0].split("-").reverse().join("/");

  return (
    <Document title={`Notification de Sanction — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Unité Chaabat El Leham</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>LETTRE DE NOTIFICATION DE SANCTION</Text>

        {/* Contenu */}
        <View style={styles.section}>
          <Text style={styles.bodyText}>
            À l'attention de Monsieur / Madame <Text style={{ fontFamily: "Helvetica-Bold" }}>{salarie.nom_prenom}</Text> (Matricule {salarie.matricule || "—"}), occupant la fonction de {salarie.fonction || "salarié(e)"}.
          </Text>

          <Text style={styles.bodyText}>
            Par la présente, nous vous notifions que la Direction a pris la décision de vous infliger la sanction suivante :
          </Text>

          <View style={{ marginVertical: 20, padding: 15, borderLeftWidth: 2, borderLeftColor: "#ef4444", backgroundColor: "#fef2f2" }}>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold", color: "#b91c1c" }}>Nature de la sanction :</Text> {sanction.type_sanction}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Date d'application :</Text> {dateSanction}</Text>
            {sanction.duree_mise_a_pied && (
              <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Durée de mise à pied :</Text> {sanction.duree_mise_a_pied} jours</Text>
            )}
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Motif :</Text> {sanction.motif}</Text>
          </View>

          <Text style={styles.bodyText}>
            Nous vous rappelons que tout manquement ultérieur aux dispositions du règlement intérieur de la société NETIX PAIE SPA donnera lieu à des mesures disciplinaires plus sévères, pouvant aller jusqu'à la rupture de votre contrat de travail sans préavis ni indemnités.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Fait à Chaabat El Leham, le {dateDuJour}</Text>
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

  const searchParams = request.nextUrl.searchParams;
  const sanctionId = parseInt(searchParams.get("sanctionId") || "", 10);

  if (!salarieId || !sanctionId) {
    return new Response("Paramètres manquants : salarieId et sanctionId sont requis.", { status: 400 });
  }

  const salarie = await getSalarie(salarieId);
  if (!salarie) return new Response("Salarié introuvable", { status: 404 });

  const sanctions = await listerSanctionsSalarie(salarieId);
  const sanction = sanctions.find((s) => s.id === sanctionId);

  if (!sanction) return new Response("Sanction introuvable", { status: 404 });

  const doc = createElement(NotificationSanctionPdf, { salarie, sanction });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `Lettre_Sanction_${salarie.nom_prenom.replace(/\s+/g, "_")}_${sanctionId}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
