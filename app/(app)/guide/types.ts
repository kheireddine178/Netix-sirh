export type GuidePoleId = "remuneration" | "contrats" | "discipline" | "outils";

export interface GuideItem {
  id: string;
  pole: GuidePoleId;
  label: string;
  badge?: string;
  iconName: string;
  description: string;
  legalRefs?: string[];
}

export interface GuidePole {
  id: GuidePoleId;
  title: string;
  icon: string;
  description: string;
  items: GuideItem[];
}

export interface SearchResultItem {
  type: "theme" | "rubrique" | "dico" | "faq" | "modele";
  targetId: string;
  title: string;
  snippet: string;
  badge?: string;
  poleId?: GuidePoleId;
}
