import Link from "next/link";
import { ArrowRight, Users, CreditCard, Calendar } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Collaborateurs",
    desc: "Tous les dossiers de vos équipes réunis au même endroit.",
  },
  {
    icon: CreditCard,
    title: "Paie",
    desc: "Préparez et éditez les bulletins en quelques clics.",
  },
  {
    icon: Calendar,
    title: "Congés & absences",
    desc: "Suivez les demandes et les soldes en temps réel.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Bandeau supérieur : marque + accès connexion */}
      <header className="relative overflow-hidden bg-white border-b border-[#E2E8F0]">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 70, 229, 0.12), transparent 70%)",
          }}
        />

        <nav className="relative max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-extrabold text-lg">
              N
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#0F172A]">
              NETIX <span className="text-[#4F46E5]">SIRH</span>
            </span>
          </div>

          <Link
            href="/login"
            className="text-xs font-semibold px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            Se connecter
          </Link>
        </nav>

        {/* Présentation principale */}
        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center px-4 pt-10 pb-20 sm:pt-16 sm:pb-24">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-[#0F172A] mb-5">
            Gérez vos ressources humaines,{" "}
            <span className="text-[#4F46E5]">simplement</span>.
          </h1>

          <p className="text-base sm:text-lg text-[#475569] max-w-xl mx-auto leading-relaxed mb-10">
            Netix rassemble vos collaborateurs, votre paie et vos congés dans un
            espace unique, clair et rapide.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-all hover:-translate-y-0.5"
          >
            <span>Accéder à l&apos;application</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Trois points clés, sans jargon technique */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] flex flex-col gap-3 transition-colors hover:border-[#CBD5E1]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h2 className="text-sm font-bold text-[#0F172A]">{f.title}</h2>
                <p className="text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-[#E2E8F0] py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <span className="font-bold text-[#0F172A]">NETIX SIRH</span>
          <span>Created by Kharrouby Kheireddine</span>
        </div>
      </footer>
    </div>
  );
}
