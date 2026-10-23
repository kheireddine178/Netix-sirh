import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 pt-6 pb-10 border-t border-[#F0EFEA] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A1A1AA]">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#0D3B2E]" />
        <span>
          Netix SIRH 2.0 — Conforme Loi 90-11 • CIDTA Art. 104 • Loi 83-11 (CNAS)
        </span>
      </div>
      <div>
        Conçu &amp; Développé par <strong className="text-[#71717A] font-semibold">Kharrouby Kheireddine</strong>
      </div>
    </footer>
  );
}
