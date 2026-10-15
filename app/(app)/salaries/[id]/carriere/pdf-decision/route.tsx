import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerPromotionsSalarie } from "../../../actions";
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

function DecisionPromotionPdf({ salarie, promotion }: { salarie: any; promotion: any }) {
  const dateEffet = new Date(promotion.date_effet).toISOString().split("T")[0].split("-").reverse().join("/");
  const dateDuJour = new Date().toISOString().split("T")[0].split("-").reverse().join("/");
  const sRaw = promotion.salaire_base_nouveau.toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/[\u202F\u00A0]/g, ' ');
  const salaireNouveau = sRaw.replace(/[\u202F\u00A0]/g, " ") + " DA";

  return (
    <Document title={`Décision de Promotion — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Unité Chaabat El Leham</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>DECISION DE PROMOTION</Text>

        {/* Contenu */}
        <View style={styles.section}>
          <Text style={styles.bodyText}>
            Vu les statuts et règlements de l'entreprise NETIX PAIE SPA, et après examen de l'évolution de carrière et du rendement professionnel de l'intéressé(e), la Direction Générale décide ce qui suit :
          </Text>

          <View style={{ marginVertical: 20, paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: "#111827" }}>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Nom & Prénom :</Text> {salarie.nom_prenom}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Matricule :</Text> {salarie.matricule || "—"}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Poste précédent :</Text> {promotion.ancien_poste || "—"}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Nouveau poste affecté :</Text> {promotion.nouveau_poste}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Nouveau salaire de base :</Text> {salaireNouveau}</Text>
            <Text style={{ marginBottom: 6 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Date d'effet réglementaire :</Text> {dateEffet}</Text>
          </View>

          <Text style={styles.bodyText}>
            L'intéressé(e) est classé(e) à son nouvel échelon de carrière à compter de la date d'effet mentionnée ci-dessus. Ses droits salariaux et responsabilités professionnelles sont modifiés en conséquence.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Fait à Chaabat El Leham, le {dateDuJour}</Text>
            <Text style={styles.signatureTitle}>Le Directeur Général</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af" }}>(Cachet de l'entreprise et signature)</Text>
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
  const promotionId = parseInt(searchParams.get("promotionId") || "", 10);

  if (!salarieId || !promotionId) {
    return new Response("Paramètres manquants : salarieId et promotionId sont requis.", { status: 400 });
  }

  const salarie = await getSalarie(salarieId);
  if (!salarie) return new Response("Salarié introuvable", { status: 404 });

  const promotions = await listerPromotionsSalarie(salarieId);
  const promotion = promotions.find((p) => p.id === promotionId);

  if (!promotion) return new Response("Promotion introuvable", { status: 404 });

  const doc = createElement(DecisionPromotionPdf, { salarie, promotion });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `Decision_Promotion_${salarie.nom_prenom.replace(/\s+/g, "_")}_${promotionId}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
