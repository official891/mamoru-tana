import type { Category, CategoryMeta } from "./types";

export const storageKey = "mamoru-tana-items-v1";

export const categories: CategoryMeta[] = [
  { id: "food", label: "食品", shortLabel: "食品", tone: "mint" },
  { id: "warranty", label: "保証", shortLabel: "保証", tone: "blue" },
  { id: "document", label: "書類", shortLabel: "書類", tone: "yellow" },
  { id: "emergency", label: "防災", shortLabel: "防災", tone: "coral" },
  { id: "health", label: "薬・健康", shortLabel: "薬", tone: "green" },
  { id: "other", label: "その他", shortLabel: "他", tone: "gray" },
];

export const categoryMap = new Map<Category, CategoryMeta>(
  categories.map((category) => [category.id, category]),
);
