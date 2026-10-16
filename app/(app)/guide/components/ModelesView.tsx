"use client";

import React, { useState, useMemo } from "react";
import { MODELES_DOCUMENTS, ModeleDocument } from "../modelesData";
import { Copy, Check, Search, FileText, Printer, AlertTriangle, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function ModelesView() {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "Tous les modèles (9)" },
    { id: "contrats", label: "Contrats de travail (2)" },
    { id: "discipline", label: "Discipline & Sanctions (3)" },
    { id: "attestations", label: "Attestations légales (2)" },
    { id: "evaluation", label: "Évaluation & R.I (2)" },
  ];

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MODELES_DOCUMENTS.filter((doc) => {
      if (selectedCat !== "all" && doc.category !== selectedCat) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.base.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q)
      );
    });
  }, [selectedCat, search]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2500);
    });
  };

  const handlePrint = (doc: ModeleDocument) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.title}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; padding: 40px; color: #111; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 8px; }
            .ref { text-align: center; font-size: 10pt; color: #555; margin-bottom: 24px; font-style: italic; }
            pre { font-family: inherit; white-space: pre-wrap; word-break: break-word; }
          </style>
        </head>
        <body>
          <h1>${doc.title}</h1>
          <div class="ref">Base légale : ${doc.base}</div>
          <pre>${doc.content}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Documents Juridiques Prêts à l'Emploi
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Modèles & Actes Types RH Algériens</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              9 modèles contractuels et disciplinaires rédigés selon les exigences strictes de la Loi n°90-11. Remplissez les champs entre crochets <code>[...]</code> avant émission.
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 max-w-md">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Vigilance juridique :</strong> Ces modèles sont fournis à titre de trame de référence. Pour toute procédure contentieuse ou licenciement, respectez la procédure contradictoire d'audition (Art. 73 bis).
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Categories */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher dans les modèles de contrat, clause, lettre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedCat === c.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-6">
        {filteredDocs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Aucun modèle ne correspond à votre recherche</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isCopied = copiedId === doc.id;

            return (
              <div
                key={doc.id}
                id={doc.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Header */}
                <div className="p-5 sm:px-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-200/70 text-slate-700 tabular-nums">
                        {doc.id.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Scale className="w-3.5 h-3.5 text-indigo-500" />
                        {doc.base}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrint(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Imprimer
                    </button>
                    <button
                      onClick={() => handleCopy(doc.id, doc.content)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          Copié dans le presse-papier !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          Copier le texte
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Document Paper */}
                <div className="p-5 sm:p-6 bg-white">
                  <div className="bg-[#FAFBFD] border border-slate-200/60 rounded-xl p-5 tabular-nums text-xs text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-indigo-100 selection:text-indigo-900">
                    {doc.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
