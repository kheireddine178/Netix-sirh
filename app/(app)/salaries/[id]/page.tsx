import { notFound } from "next/navigation";
import {
  getSalarie,
  listerContratsSalarie,
  listerCongesSalarie,
  listerInscriptionsSalarie,
  listerBulletinsSalarie,
  listerPromotionsSalarie,
  listerSanctionsSalarie,
  listerDocumentsSalarie,
} from "../actions";
import SalarieDossierView from "./salarie-dossier-view";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SalarieHubPage({ params }: Props) {
  const { id } = await params;
  const salarieId = parseInt(id, 10);
  if (isNaN(salarieId)) notFound();

  const salarie = await getSalarie(salarieId);
  if (!salarie) notFound();

  const [
    contrats,
    conges,
    inscriptions,
    bulletins,
    promotions,
    sanctions,
    documents,
  ] = await Promise.all([
    listerContratsSalarie(salarieId).catch(() => []),
    listerCongesSalarie(salarieId).catch(() => []),
    listerInscriptionsSalarie(salarieId).catch(() => []),
    listerBulletinsSalarie(salarieId).catch(() => []),
    listerPromotionsSalarie(salarieId).catch(() => []),
    listerSanctionsSalarie(salarieId).catch(() => []),
    listerDocumentsSalarie(salarieId).catch(() => []),
  ]);

  return (
    <SalarieDossierView
      salarie={salarie}
      contrats={contrats}
      conges={conges}
      inscriptions={inscriptions}
      bulletins={bulletins}
      promotions={promotions}
      sanctions={sanctions}
      documents={documents}
    />
  );
}

