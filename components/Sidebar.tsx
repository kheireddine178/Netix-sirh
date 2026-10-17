"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TableProperties,
  Sparkles,
  FileText,
  Briefcase,
  BookOpen,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";
import { useSidebar } from "@/lib/sidebarContext";

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
  const { isOpen, toggleSidebar } = useSidebar();

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
          label: "Saisie de Paie",
          href: "/paie",
          icon: TableProperties,
        },
        {
          label: "Clôture Période",
          href: "/paie/cloture",
          icon: ShieldCheck,
        },
        {
          label: "Journal & Déclarations",
          href: "/rapports",
          icon: FileText,
        },
        {
          label: "Rubriques de Paie",
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
    <aside
      className={cn(
        "hidden md:flex flex-col bg-[#F8F7F4] border-r border-[#E6E4DD] h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0 pointer-events-none"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between gap-2 min-w-[256px]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0D3B2E] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <span className="font-bold text-sm tracking-tight font-mono">N</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[#111315]">
                NETIX
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D3B2E] bg-[#E6F3EE] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                SIRH 2.0
              </span>
            </div>
            <span className="text-[11px] text-[#5A6065] font-medium truncate">
              Standard Fintech Haut de Gamme
            </span>
          </div>
        </Link>

        {/* Bouton pour masquer la barre latérale */}
        <button
          onClick={toggleSidebar}
          title="Masquer la navigation (Ctrl+B) pour agrandir l'espace de travail"
          className="p-1.5 rounded-lg text-[#5A6065] hover:text-[#111315] hover:bg-[#E6E4DD] transition-colors cursor-pointer shrink-0"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 min-w-[256px]">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#5A6065]">
              {section.title}
            </div>
            <nav className="space-y-0.5">
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
                      "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group",
                      isActive
                        ? "bg-[#0D3B2E] text-white shadow-xs"
                        : "text-[#5A6065] hover:text-[#111315] hover:bg-[#F2F0EC]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-[#94A3B8] group-hover:text-[#111315]"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
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
      <div className="p-3 border-t border-[#E6E4DD] bg-[#F2F0EC]/50 min-w-[256px]">
        <div className="flex items-center justify-between p-2 rounded-md bg-white border border-[#E6E4DD]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#0D3B2E]/10 text-[#0D3B2E] font-bold text-xs flex items-center justify-center shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "C"}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-[#111315] truncate">
                {user?.email?.split("@")[0] || "Chef Service RH"}
              </span>
              <span className="text-[10px] text-[#065F46] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Session Active
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Se déconnecter"
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
