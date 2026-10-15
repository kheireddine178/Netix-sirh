"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supprimerBulletin } from "../../actions";

export default function BulletinRowActions({
  salarieId,
  bulletinId,
  annee,
  mois,
}: {
  salarieId: number;
  bulletinId: number;
  annee: number;
  mois: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSupprimer() {
    if (
      !confirm(
        `Supprimer définitivement le bulletin de ${mois}/${annee} ?\n\nCette action est irréversible.`,
      )
    )
      return;
    startTransition(async () => {
      await supprimerBulletin(salarieId, bulletinId);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "flex-end" }}>
      <Link
        href={`/salaries/${salarieId}/bulletin/explication?annee=${annee}&mois=${mois}`}
        className="btn btn-secondary btn-sm"
      >
        Explication
      </Link>
      <Link
        href={`/salaries/${salarieId}/bulletin/pdf?annee=${annee}&mois=${mois}&variante=salarie`}
        target="_blank"
        className="btn btn-secondary btn-sm"
      >
        PDF salarié
      </Link>
      <Link
        href={`/salaries/${salarieId}/bulletin/pdf?annee=${annee}&mois=${mois}&variante=employeur`}
        target="_blank"
        className="btn btn-secondary btn-sm"
      >
        PDF employeur
      </Link>
      <button
        type="button"
        className="btn btn-sm"
        style={{ color: "var(--red-600)", borderColor: "var(--red-600)" }}
        onClick={handleSupprimer}
        disabled={isPending}
      >
        Supprimer
      </button>
    </div>
  );
}
