"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import {
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Layers,
  Scale,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErreur("Identifiants incorrects ou compte non reconnu.");
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    });
  };

  const handleFillDemo = () => {
    setEmail("admin@netix.dz");
    setPassword("Netix2026!Secure");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081C16] text-white">
      {/* ============================================================
          GAUCHE (60%) : Brand Universe & Showcase 2026
          ============================================================ */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 bg-[#061712]">
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0D3B2E]/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] border border-[#A7F3D0]/40 flex items-center justify-center shadow-lg">
            <span className="font-bold text-xl tracking-tight text-white">N</span>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              NETIX <span className="text-[#A7F3D0] font-medium">SIRH</span>
            </span>
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#A7F3D0]/10 text-[#A7F3D0] border border-[#A7F3D0]/20">
              v2.0 2026
            </span>
          </div>
        </div>

        {/* Center Hero Concept */}
        <div className="relative z-10 my-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#A7F3D0]" />
            <span className="text-xs font-medium text-slate-300">
              Moteur de Paie Algérienne Certifié & Haute Précision
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            La gestion RH & Paie,{" "}
            <span className="bg-gradient-to-r from-emerald-200 via-white to-[#A7F3D0] bg-clip-text text-transparent">
              sans compromis.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Une interface split-screen temps réel, un moteur fiscal conforme à l'Article 104 CIDTA, et 402 rubriques officielles prêtes à l'emploi.
          </p>

          {/* Interactive Metric Showcase Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Glass Card 1 */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-[#A7F3D0]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Barème IRG 2026
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#A7F3D0] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-[#A7F3D0]/30">
                  Loi 90-11
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Abattement légal 40%</span>
                  <span className="text-white font-mono font-medium">Actif</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CNAS Salariale / Patronale</span>
                  <span className="text-[#A7F3D0] font-mono font-semibold">9% / 26%</span>
                </div>
              </div>
            </div>

            {/* Glass Card 2 */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-[#A7F3D0]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Moteur Live 0ms
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#A7F3D0] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-[#A7F3D0]/30">
                  OmniBar
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Rubriques officielles</span>
                  <span className="text-white font-mono font-medium">402 codes</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recalcul à la frappe</span>
                  <span className="text-[#A7F3D0] font-mono font-semibold">Instantané</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#A7F3D0]" /> Sécurisé par Supabase
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#A7F3D0]" /> Données Hébergées en Algérie
            </span>
          </div>
          <span>© 2026 Netix SIRH</span>
        </div>
      </div>

      {/* ============================================================
          DROITE (40%) : Auth Portal
          ============================================================ */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white text-[#111827]">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Espace de Connexion
            </h2>
            <p className="mt-1.5 text-xs text-[#71717A] leading-relaxed">
              Connectez-vous avec vos identifiants administrateur pour piloter la paie et les équipes.
            </p>
          </div>

          {/* Erreur Alert */}
          {erreur && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              {erreur}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-1.5"
              >
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@entreprise.dz"
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-sm text-[#111827] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/10 focus:border-[#0D3B2E] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#71717A]"
                >
                  Mot de Passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isPending}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-sm text-[#111827] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/10 focus:border-[#0D3B2E] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#111827] focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#092B21] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isPending ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>Accéder à Netix SIRH</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-6 pt-6 border-t border-[#F0EFEA]">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-lg bg-[#FAF9F8] hover:bg-[#F0EFEA] border border-[#F0EFEA] text-[#71717A] hover:text-[#111827] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0D3B2E]" />
              <span>Tester en un clic (Identifiants Démo)</span>
            </button>
            <p className="mt-3 text-[11px] text-center text-[#A1A1AA]">
              Besoin d'assistance ? Contactez le support au <strong>support@netix.dz</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
