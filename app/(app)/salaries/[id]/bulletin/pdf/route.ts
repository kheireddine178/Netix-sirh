import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBulletinPourPdf } from "../../../actions";
import { BulletinPdfDocument } from "@/lib/pdfBulletin";

export const dynamic = "force-dynamic";

/**
 * GET /salaries/[id]/bulletin/pdf?annee=2026&mois=7&variante=salarie|employeur
 *
 * Génère à la volée le PDF du bulletin de paie enregistré pour ce salarié / cette
 * période (table `bulletins` + `bulletin_rubriques` déjà en base), et le renvoie
 * directement au navigateur (affichage inline, avec bouton "Enregistrer" du lecteur PDF).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);

  const searchParams = request.nextUrl.searchParams;
  const annee = parseInt(searchParams.get("annee") || "", 10);
  const mois = parseInt(searchParams.get("mois") || "", 10);
  const variante = searchParams.get("variante") === "employeur" ? "employeur" : "salarie";

  if (!salarieId || !annee || !mois) {
    return new Response("Paramètres manquants : annee et mois sont requis.", { status: 400 });
  }

  const donnees = await getBulletinPourPdf(salarieId, annee, mois);
  if (!donnees) {
    return new Response(
      "Aucun bulletin enregistré pour ce salarié sur cette période. Calculez et enregistrez d'abord le bulletin.",
      { status: 404 },
    );
  }

  const document = createElement(BulletinPdfDocument, {
    variante,
    employeur: donnees.params,
    salarie: {
      matricule: donnees.salarie.matricule,
      nom_prenom: donnees.salarie.nom_prenom,
      fonction: donnees.salarie.fonction,
    },
    annee,
    mois,
    saisie: donnees.saisie,
    resultat: donnees.resultat,
    params: donnees.params,
  });

const buffer = await renderToBuffer(document as Parameters<typeof renderToBuffer>[0]);
  const nomFichier = `bulletin_${donnees.salarie.nom_prenom.replace(/\s+/g, "_")}_${mois}_${annee}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
      "Cache-Control": "no-store",
    },
  });
}
