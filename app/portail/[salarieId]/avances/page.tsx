import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalarie, listerAvancesSalarie } from "../../../(app)/salaries/actions";
import EspaceAvancesClient from "./EspaceAvancesClient";

import { checkPortalAccess } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ salarieId: string }>;
}

export default async function EspaceAvancesPage({ params }: Props) {
  const { salarieId } = await params;
  const id = parseInt(salarieId, 10);
  if (isNaN(id)) notFound();

  // Contrôle d'accès strict
  await checkPortalAccess(id);

  const salarie = await getSalarie(id);
  if (!salarie) notFound();

  const avances = await listerAvancesSalarie(id);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 var(--s4)" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s5)", borderBottom: "var(--hairline)", paddingBottom: "var(--s3)" }}>
        <div>
          <span style={{ fontSize: "var(--t2xs)", color: "var(--accent)", fontWeight: "bold", textTransform: "uppercase" }}>Mes Avances sur Salaire</span>
          <h1 style={{ fontSize: "var(--txl)", margin: "4px 0" }}>{salarie.nom_prenom}</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/portail/${salarie.id}`} className="btn btn-secondary btn-sm">
            ← Mon Espace
          </Link>
        </div>
      </div>

      <EspaceAvancesClient salarie={salarie} avances={avances} />
    </div>
  );
}
