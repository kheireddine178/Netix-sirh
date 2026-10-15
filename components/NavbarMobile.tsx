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
    { label: "Saisie Live 2026", href: "/saisie", icon: Wallet, badge: "LIVE" },
    { label: "Clôture Période", href: "/paie/cloture", icon: Sparkles },
    { label: "Saisie Collective", href: "/saisie/collective", icon: SlidersHorizontal },
    { label: "Journal & Déclarations", href: "/rapports", icon: FileText },
    { label: "Collaborateurs", href: "/salaries", icon: Users },
    { label: "Contrats & Documents", href: "/contrats", icon: Briefcase },
    { label: "Congés & Absences", href: "/conges", icon: Calendar },
    { label: "Guide Juridique RH", href: "/guide", icon: BookOpen },
  ];

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <span className="font-extrabold text-sm">N</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-slate-900">
              NETIX
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
              2.0
            </span>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] z-50 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-b border-slate-200 shadow-xl max-h-[calc(100vh-53px)] overflow-y-auto p-4 space-y-4">
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
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
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
