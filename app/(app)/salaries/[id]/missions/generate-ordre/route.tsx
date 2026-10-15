import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSalarie, listerMissionsSalarie } from "../../../actions";
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
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 140,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    flex: 1,
  },
  bodyText: {
    fontSize: 11,
    textAlign: "justify",
    marginTop: 20,
    marginBottom: 20,
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
    marginBottom: 50,
  }
});

function OrdreMissionPdf({ salarie, mission }: { salarie: any; mission: any }) {
  const debut = new Date(mission.date_debut).toISOString().split("T")[0].split("-").reverse().join("/");
  const fin = new Date(mission.date_fin).toISOString().split("T")[0].split("-").reverse().join("/");
  const dateDuJour = new Date().toISOString().split("T")[0].split("-").reverse().join("/");

  return (
    <Document title={`Ordre de Mission — ${salarie.nom_prenom}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>NETIX PAIE SPA</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Direction des Ressources Humaines</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Unité Chaabat El Leham</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>ORDRE DE MISSION</Text>

        {/* Contenu */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nom & Prénom :</Text>
            <Text style={styles.value}>{salarie.nom_prenom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Matricule :</Text>
            <Text style={styles.value}>{salarie.matricule || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fonction :</Text>
            <Text style={styles.value}>{salarie.fonction || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Objet de la mission :</Text>
            <Text style={styles.value}>{mission.objet}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lieu de destination :</Text>
            <Text style={styles.value}>{mission.destination}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Moyen de transport :</Text>
            <Text style={styles.value}>{mission.moyen_transport}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Période de la mission :</Text>
            <Text style={styles.value}>Du {debut} au {fin}</Text>
          </View>
        </View>

        <Text style={styles.bodyText}>
          Il est ordonné à l'intéressé(e) de se rendre à la destination indiquée ci-dessus pour l'accomplissement de sa mission professionnelle. Les autorités civiles et militaires sont priées de lui faciliter l'accomplissement de sa tâche.
        </Text>

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Fait à Chaabat El Leham, le {dateDuJour}</Text>
            <Text style={styles.signatureTitle}>L'employeur</Text>
            <Text style={{ fontSize: 9, color: "#9ca3af" }}>Pour NETIX PAIE SPA</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>Visa de l'autorité locale à destination</Text>
            <Text style={{ fontSize: 9, color: "#d1d5db", marginTop: 40 }}>[ Cachet & Date ]</Text>
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
  const missionId = parseInt(searchParams.get("missionId") || "", 10);

  if (!salarieId || !missionId) {
    return new Response("Paramètres manquants : salarieId et missionId sont requis.", { status: 400 });
  }

  const salarie = await getSalarie(salarieId);
  if (!salarie) return new Response("Salarié introuvable", { status: 404 });

  const missions = await listerMissionsSalarie(salarieId);
  const mission = missions.find((m) => m.id === missionId);

  if (!mission) return new Response("Mission introuvable", { status: 404 });

  const doc = createElement(OrdreMissionPdf, { salarie, mission });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  const nomFichier = `Ordre_Mission_${salarie.nom_prenom.replace(/\s+/g, "_")}_${missionId}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
    },
  });
}
