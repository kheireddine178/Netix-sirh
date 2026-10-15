import { listerSalaries, listerBulletinsPourPeriode } from "../../salaries/actions";
import SaisieCollectiveClient from "./saisie-collective-client";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { User, Users, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface Props {
  searchParams: Promise<{
    annee?: string;
    mois?: string;
  }>;
}

export default async function SaisieCollectivePage({ searchParams }: Props) {
  const query = await searchParams;
  const salaries = await listerSalaries();

  // Filter only active salariés for mass entry
  const activeSalaries = salaries.filter((s) => s.actif !== false);

  const now = new Date();
  const selectedAnnee = query.annee ? parseInt(query.annee, 10) : now.getFullYear();
  const selectedMois = query.mois ? parseInt(query.mois, 10) : now.getMonth() + 1;

  // Load existing bulletins for the selected period
  const bulletins = await listerBulletinsPourPeriode(selectedAnnee, selectedMois);

  // Map to the simplified type
  const initialBulletins = bulletins.map((b) => ({
    salarie_id: b.salarie_id,
    maladie_h: b.maladie_h || 0,
    absence_irreguliere_h: b.absence_irreguliere_h || 0,
    retard_h: b.retard_h || 0,
    heures_sup_1: b.heures_sup_1 || 0,
    heures_sup_2: b.heures_sup_2 || 0,
    heures_sup_3: b.heures_sup_3 || 0,
    panier_jours: b.panier_jours || 0,
    autre_prime_fixe: b.autre_prime_fixe || 0,
    statut: b.statut,
  }));

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <Link href="/saisie" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <User className="w-4 h-4" /> Saisie individuelle
          </Link>
          <Link href="/saisie/collective" className="flex items-center gap-2 hover:text-[#4F46E5] transition-colors bg-[#F8FAFC] px-3 py-1.5 rounded-md font-medium text-[#4F46E5]">
            <Users className="w-4 h-4" /> Grille collective
          </Link>
          <Link href="/saisie/avances" className="flex items-center gap-2 hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md font-medium">
            <Wallet className="w-4 h-4" /> Acomptes & Avances
          </Link>
        </div>

        <PageHeader
          title="Grille de Saisie Collective"
          subtitle={`Période: ${MOIS[selectedMois - 1]} ${selectedAnnee} — ${activeSalaries.length} salariés actifs`}
        />
      </div>

      <SaisieCollectiveClient
        salaries={activeSalaries}
        initialBulletins={initialBulletins}
        anneeActive={selectedAnnee}
        moisActive={selectedMois}
      />
    </div>
  );
}
