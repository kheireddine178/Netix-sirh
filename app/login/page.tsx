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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#090D16] text-white">
      {/* ============================================================
          GAUCHE (60%) : Brand Universe & Showcase 2026
          ============================================================ */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-mesh-dark border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <span className="font-black text-xl tracking-tight text-white">N</span>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              NETIX <span className="text-indigo-400 font-medium">SIRH</span>
            </span>
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              v2.0 2026
            </span>
          </div>
        </div>

        {/* Center Hero Concept */}
        <div className="relative z-10 my-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-slate-300">
              Moteur de Paie Algérienne Certifié & Haute Précision
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            La gestion RH & Paie,{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-white to-purple-200 bg-clip-text text-transparent">
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
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Barème IRG 2026
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
                  <span className="text-emerald-400 font-mono font-semibold">9% / 26%</span>
                </div>
              </div>
            </div>

            {/* Glass Card 2 */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Moteur Live 0ms
                  </span>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
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
                  <span className="text-indigo-400 font-mono font-semibold">Instantané</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sécurisé par Supabase
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Données Hébergées en Algérie
            </span>
          </div>
          <span>© 2026 Netix SIRH</span>
        </div>
      </div>

      {/* ============================================================
          DROITE (40%) : Auth Portal
          ============================================================ */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white text-slate-900">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Espace de Connexion
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
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
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Adresse Email Professionnelle
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@entreprise.dz"
                  disabled={isPending}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Mot de Passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isPending}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
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
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tester en un clic (Identifiants Démo)</span>
            </button>
            <p className="mt-3 text-[11px] text-center text-slate-400">
              Besoin d'assistance ? Contactez le support au <strong>support@netix.dz</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
