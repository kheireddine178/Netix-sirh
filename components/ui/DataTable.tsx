"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn, formatDA } from "@/lib/utils";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  isCurrency?: boolean; // Formate automatiquement en 75 253,00 DA + tabular-nums aligné droite
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  exportable?: boolean;
  exportFileName?: string;
  title?: string;
  toolbarActions?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * DataTable — Tableau de données riche Netix SIRH
 * Règle §3.3 : Corps de texte 14px, montants formatés "75 253,00 DA", tabular-nums, alignés à droite.
 * Règle §3.6 : Tri, filtre, pagination, export CSV.
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
  exportable = true,
  exportFileName = "export-netix",
  title,
  toolbarActions,
  emptyStateTitle = "Aucun élément trouvé",
  emptyStateDescription = "Aucun enregistrement ne correspond aux critères de recherche.",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);

  // Filtrage par recherche plein texte
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) => {
      return columns.some((col) => {
        const val = col.accessor ? col.accessor(item) : item[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      });
    });
  }, [data, columns, searchTerm]);

  // Tri
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      const valA = col?.accessor ? col.accessor(a) : a[sortKey];
      const valB = col?.accessor ? col.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, currentPage, perPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const exportCSV = () => {
    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(";");
    const rows = sortedData.map((item) => {
      return columns
        .map((c) => {
          let val = c.accessor ? c.accessor(item) : item[c.key];
          if (c.isCurrency && typeof val === "number") {
            val = formatDA(val);
          }
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(";");
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {/* Barre d'outils supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {title && (
            <h3 className="text-base font-bold text-[#111827] tracking-tight">
              {title}
            </h3>
          )}
          {searchable && (
            <div className="relative min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 text-xs bg-white text-[#111827] border border-[#E4E4E7] rounded-lg placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20 transition-all shadow-2xs"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {toolbarActions}
          {exportable && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCSV}
              disabled={sortedData.length === 0}
            >
              Exporter CSV
            </Button>
          )}
        </div>
      </div>

      {/* Conteneur de tableau Desktop (≥ 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[#F0EFEA] bg-white shadow-2xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#FAF9F8] border-b border-[#F0EFEA]">
              {columns.map((col) => {
                const align = col.isCurrency ? "right" : col.align || "left";
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "py-2.5 px-3.5 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider select-none",
                      align === "center" && "text-center",
                      align === "right" && "text-right",
                      col.sortable !== false && "cursor-pointer hover:text-[#111827]"
                    )}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        align === "right" && "justify-end w-full",
                        align === "center" && "justify-center w-full"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-[#A1A1AA]">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#0D3B2E]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F3F0]">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "transition-colors hover:bg-[#FAF9F8]",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => {
                      const align = col.isCurrency ? "right" : col.align || "left";
                      let content: React.ReactNode;

                      if (col.render) {
                        content = col.render(item);
                      } else {
                        const raw = col.accessor ? col.accessor(item) : item[col.key];
                        if (col.isCurrency && typeof raw === "number") {
                          content = formatDA(raw);
                        } else {
                          content = raw ?? "—";
                        }
                      }

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "py-2.5 px-3.5 text-xs text-[#111827]",
                            align === "center" && "text-center",
                            align === "right" && "text-right tabular-nums font-semibold",
                            col.isCurrency && "tabular-nums"
                          )}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-8 px-4">
                  <EmptyState
                    title={emptyStateTitle}
                    description={emptyStateDescription}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Conteneur Mobile adaptatif (< 768px) : Mode Cartes empilées sans scroll horizontal */}
      <div className="md:hidden flex flex-col gap-3">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => {
            const key = keyExtractor(item);
            return (
              <div
                key={key}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "bg-white border border-[#F0EFEA] rounded-xl p-3.5 shadow-2xs flex flex-col gap-2 transition-colors",
                  onRowClick && "cursor-pointer active:bg-[#FAF9F8]"
                )}
              >
                {columns.map((col) => {
                  let content: React.ReactNode;
                  if (col.render) {
                    content = col.render(item);
                  } else {
                    const raw = col.accessor ? col.accessor(item) : item[col.key];
                    if (col.isCurrency && typeof raw === "number") {
                      content = formatDA(raw);
                    } else {
                      content = raw ?? "—";
                    }
                  }

                  return (
                    <div
                      key={col.key}
                      className="flex items-center justify-between text-xs py-0.5 border-b border-[#FAF9F8] last:border-b-0"
                    >
                      <span className="font-medium text-[#71717A]">{col.header}</span>
                      <div className="text-right text-[#111827] font-medium">{content}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-[#F0EFEA] rounded-xl p-6 shadow-2xs">
            <EmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
            />
          </div>
        )}
      </div>

      {/* Barre de pagination */}
      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#71717A] px-1 py-1">
          <div className="flex items-center gap-2">
            <span>
              Affichage de{" "}
              <strong className="text-[#111827] tabular-nums font-semibold">
                {(currentPage - 1) * perPage + 1}
              </strong>{" "}
              à{" "}
              <strong className="text-[#111827] tabular-nums font-semibold">
                {Math.min(currentPage * perPage, sortedData.length)}
              </strong>{" "}
              sur{" "}
              <strong className="text-[#111827] tabular-nums font-semibold">
                {sortedData.length}
              </strong>{" "}
              entrées
            </span>
            <span className="text-[#E4E4E7]">•</span>
            <div className="flex items-center gap-1.5">
              <span>Par page :</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E4E4E7] rounded px-1.5 py-0.5 text-xs text-[#111827] focus:outline-none focus:border-[#0D3B2E]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              aria-label="Page précédente"
            />
            <span className="px-2 py-1 tabular-nums font-medium text-[#111827]">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronRight className="w-3.5 h-3.5" />}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              aria-label="Page suivante"
            />
          </div>
        </div>
      )}
    </div>
  );
}
