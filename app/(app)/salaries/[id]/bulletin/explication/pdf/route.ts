import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBulletinPourPdf } from "../../../../actions";
import { genererExplicationDonnees } from "@/lib/paieExplication";
import { PdfExplicationDocument } from "@/lib/pdfExplication";

export const dynamic = "force-dynamic";

/**
 * GET /salaries/[id]/bulletin/explication/pdf?annee=2026&mois=7
 *
 * Génère à la volée le PDF d'explication pédagogique pour ce bulletin et le renvoie.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);

  const searchParams = request.nextUrl.searchParams;
  const annee = parseInt(searchParams.get("annee") || "", 10);
  const mois = parseInt(searchParams.get("mois") || "", 10);

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

  const explDonnees = genererExplicationDonnees(
    donnees.salarie,
    annee,
    mois,
    donnees.saisie,
    donnees.resultat,
    donnees.params
  );

  const document = createElement(PdfExplicationDocument, {
    donnees: explDonnees,
  });

  const buffer = await renderToBuffer(document as Parameters<typeof renderToBuffer>[0]);
  const nomFichier = `explication_paie_${donnees.salarie.nom_prenom.replace(/\s+/g, "_")}_${mois}_${annee}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomFichier}"`,
      "Cache-Control": "no-store",
    },
  });
}
