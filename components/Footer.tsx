import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 pt-8 pb-12 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>
          Netix SIRH 2.0 — Conforme Loi 90-11 • CIDTA Art. 104 • Loi 83-11 (CNAS)
        </span>
      </div>
      <div>
        Conçu &amp; Développé par <strong className="text-slate-600 font-semibold">Kharrouby Kheireddine</strong>
      </div>
    </footer>
  );
}
