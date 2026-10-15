import { listerSalaries } from "../(app)/salaries/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortailLoginPage() {
  const salaries = await listerSalaries();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-6 sm:p-8 text-center">
        <div className="w-12 h-12 bg-[#EEF2FF] text-[#4F46E5] rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4">
          N
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-2">
          Portail Salarié (ESS)
        </h1>
        <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
          Simulez la connexion d&apos;un collaborateur pour accéder à son espace personnel en self-service.
        </p>

        <div className="text-left">
          <label className="text-xs font-semibold text-[#334155] mb-2 block uppercase tracking-wider">
            Sélectionner un collaborateur :
          </label>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2 bg-[#F8FAFC]">
            {salaries.map((s) => (
              <Link
                key={s.id}
                href={`/portail/${s.id}`}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white hover:bg-[#EEF2FF] hover:border-[#4F46E5] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] transition-colors"
              >
                <span>{s.nom_prenom}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                  {s.fonction || "Employé"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
          >
            ← Retour au panneau Administrateur RH
          </Link>
        </div>
      </div>
    </div>
  );
}
