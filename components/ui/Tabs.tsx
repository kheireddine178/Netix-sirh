"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "underline" | "pills";
  className?: string;
  defaultValue?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const TabsContext = createContext<{ value: string; setValue: (val: string) => void } | null>(null);

/**
 * Tabs — Système d'onglets épuré Netix SIRH
 * Supporte l'ancienne API (avec `tabs` prop) et la nouvelle API Shadcn (Tabs, TabsList, TabsTrigger, TabsContent).
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
  defaultValue,
  children,
  ...props
}: TabsProps) {
  const [selected, setSelected] = useState(defaultValue || "");

  // Si on utilise l'ancienne API (avec un tableau "tabs")
  if (tabs) {
    if (variant === "pills") {
      return (
        <div
          role="tablist"
          className={cn(
            "inline-flex p-1 bg-[#FAF9F8] border border-[#F0EFEA] rounded-lg gap-1",
            className
          )}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange && onChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all select-none cursor-pointer",
                  isActive
                    ? "bg-white text-[#111827] shadow-2xs border border-[#E4E4E7]"
                    : "text-[#71717A] hover:text-[#111827]"
                )}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold",
                      isActive ? "bg-[#E6F3EE] text-[#0D3B2E]" : "bg-[#F4F4F5] text-[#71717A]"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    // Underline style (par défaut)
    return (
      <div
        role="tablist"
        className={cn("flex border-b border-[#F0EFEA] gap-6 overflow-x-auto", className)}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange && onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 pb-2.5 pt-1 text-xs sm:text-sm font-medium border-b-2 transition-all relative select-none whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-[#0D3B2E] text-[#0D3B2E] font-bold"
                  : "border-transparent text-[#71717A] hover:text-[#111827] hover:border-[#E4E4E7]"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full tabular-nums font-bold",
                    isActive ? "bg-[#E6F3EE] text-[#0D3B2E]" : "bg-[#FAF9F8] text-[#71717A]"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Si on utilise la nouvelle API (Shadcn-like)
  const value = activeTab !== undefined ? activeTab : selected;
  const setValue = onChange || setSelected;

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: any) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex p-1 bg-[#FAF9F8] border border-[#F0EFEA] rounded-lg gap-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, ...props }: any) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  
  const isActive = context.value === value;
  
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => context.setValue(value)}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all select-none cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#0D3B2E]",
        isActive
          ? "bg-white text-[#111827] shadow-2xs border border-[#E4E4E7]"
          : "text-[#71717A] hover:text-[#111827]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }: any) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  
  const isSelected = context.value === value;
  
  return (
    <div
      role="tabpanel"
      hidden={!isSelected}
      className={cn(
        "mt-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0D3B2E]",
        !isSelected && "hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
