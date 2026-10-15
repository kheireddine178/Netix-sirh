import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerCongesSalarie, listerContratsSalarie } from "../../../(app)/salaries/actions";
import EspaceCongesClient from "./EspaceCongesClient";

import { checkPortalAccess } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ salarieId: string }>;
}

export default async function Page({ params }: Props) {
  const { salarieId } = await params;
  const id = parseInt(salarieId, 10);
  if (isNaN(id)) notFound();

  // Contrôle d'accès strict
  await checkPortalAccess(id);

  const salarie = await getSalarie(id);
  if (!salarie) notFound();

  const conges = await listerCongesSalarie(id);
  const contrats = await listerContratsSalarie(id);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 var(--s4)" }}>
      {/* En-tête Espace Salarié */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s5)", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
        <div>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--accent)", fontWeight: "bold", textTransform: "uppercase" }}>Mes Congés & Absences</span>
          <h1 style={{ fontSize: "var(--txl)", margin: "4px 0" }}>{salarie.nom_prenom}</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/portail/${salarie.id}`} className="btn btn-secondary btn-sm">
            ← Mon Espace
          </Link>
        </div>
      </div>

      <EspaceCongesClient salarie={salarie} conges={conges} contrats={contrats} />
    </div>
  );
}
