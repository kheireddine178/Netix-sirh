"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  Users,
  Briefcase,
  Calendar,
  BookOpen,
  FileText,
  SlidersHorizontal,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";

export function NavbarMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const NAV_LINKS = [
    { label: "Tableau de Bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Saisie de Paie", href: "/paie", icon: Wallet },
    { label: "Clôture Période", href: "/paie/cloture", icon: Sparkles },
    { label: "Journal & Déclarations", href: "/rapports", icon: FileText },
    { label: "Collaborateurs", href: "/salaries", icon: Users },
    { label: "Contrats & Documents", href: "/contrats", icon: Briefcase },
    { label: "Congés & Absences", href: "/conges", icon: Calendar },
    { label: "Guide RH & Barèmes", href: "/guide", icon: BookOpen },
  ];

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0EFEA] px-4 py-2.5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0D3B2E] flex items-center justify-center text-white shadow-2xs">
            <span className="font-extrabold text-xs">N</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-[#111827]">
              NETIX
            </span>
            <span className="text-[10px] font-bold text-[#0D3B2E] bg-[#E6F3EE] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
              2.0
            </span>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
          className="p-1.5 rounded-lg text-[#71717A] hover:text-[#111827] hover:bg-[#FAF9F8] transition-colors cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[50px] z-50 bg-[#111827]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-b border-[#F0EFEA] shadow-xl max-h-[calc(100vh-50px)] overflow-y-auto p-4 space-y-4">
            <nav className="space-y-1">
              {NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all",
                      isActive
                        ? "bg-[#0D3B2E] text-white"
                        : "text-[#71717A] hover:text-[#111827] hover:bg-[#FAF9F8]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#A1A1AA]")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                {user?.email || "Connecté"}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
