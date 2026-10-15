"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Calendar,
  Sparkles,
  FileText,
  Briefcase,
  BookOpen,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const NAV_SECTIONS: NavSection[] = [
    {
      title: "Cockpit",
      items: [
        {
          label: "Tableau de Bord",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Moteur de Paie",
      items: [
        {
          label: "Saisie Live 2026",
          href: "/saisie",
          icon: Wallet,
          badge: "SPLIT",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        },
        {
          label: "Clôture Période",
          href: "/paie/cloture",
          icon: ShieldCheck,
        },
        {
          label: "Saisie Collective",
          href: "/saisie/collective",
          icon: SlidersHorizontal,
        },
        {
          label: "Journal & Déclarations",
          href: "/rapports",
          icon: FileText,
        },
        {
          label: "402 Rubriques",
          href: "/rubriques",
          icon: Sparkles,
          adminOnly: true,
        },
      ],
    },
    {
      title: "Capital Humain",
      items: [
        {
          label: "Collaborateurs",
          href: "/salaries",
          icon: Users,
        },
        {
          label: "Contrats & Juridique",
          href: "/contrats",
          icon: Briefcase,
        },
        {
          label: "Congés & Absences",
          href: "/conges",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Conformité Légale",
      items: [
        {
          label: "Guide RH & Barèmes",
          href: "/guide",
          icon: BookOpen,
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <span className="font-black text-lg">N</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                NETIX
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                SIRH 2.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              SARL Entreprise • Alger
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {section.title}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
                          isActive
                            ? "bg-white/20 text-white border-white/30"
                            : item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                      )
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-bold text-slate-800 truncate">
                {user?.email?.split("@")[0] || "Administrateur"}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Session Active
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Se déconnecter"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
