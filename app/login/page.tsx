"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setErreur("Identifiants incorrects ou compte inexistant.");
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-11 h-11 bg-[#4F46E5] text-white rounded-xl flex items-center justify-center font-extrabold text-xl mx-auto mb-3 shadow-xs">
            N
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Connexion</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Accédez à votre espace sécurisé Netix SIRH &amp; Paie
          </p>
        </div>

        {erreur && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs font-semibold text-[#DC2626] mb-5 text-center">
            {erreur}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#334155] mb-1.5 uppercase tracking-wider">
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.dz"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#334155] mb-1.5 uppercase tracking-wider">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isPending}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold shadow-xs transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isPending ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
