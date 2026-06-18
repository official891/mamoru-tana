import { addDays } from "./date";
import type { Category, ShelfItem } from "./types";

export type QuickAddTemplate = {
  id: string;
  label: string;
  name: string;
  category: Category;
  place: string;
  days: number;
  reminderDays: number;
  notes: string;
  owner?: string;
  recallWatch?: boolean;
  keywords?: string[];
};

export const quickAddTemplates: QuickAddTemplate[] = [
  {
    id: "emergency-water",
    label: "防災の水",
    name: "防災用の水",
    category: "emergency",
    place: "玄関収納",
    days: 180,
    reminderDays: 30,
    notes: "家族の人数分を確認",
    recallWatch: true,
    keywords: ["防災用の水", "防災リュックの水", "保存水", "飲料水", "ペットボトル水", "ウォーター"],
  },
  {
    id: "emergency-food",
    label: "非常食",
    name: "非常食・レトルト",
    category: "food",
    place: "防災棚",
    days: 180,
    reminderDays: 30,
    notes: "食べ慣れているものを優先",
    recallWatch: false,
    keywords: ["非常食", "保存食", "レトルト", "缶詰"],
  },
  {
    id: "flashlight",
    label: "ライト",
    name: "懐中電灯",
    category: "emergency",
    place: "防災リュック",
    days: 365,
    reminderDays: 60,
    notes: "点灯確認も一緒に行う",
    recallWatch: true,
    keywords: ["懐中電灯", "ライト", "ランタン"],
  },
  {
    id: "batteries",
    label: "電池",
    name: "予備の電池",
    category: "emergency",
    place: "防災リュック",
    days: 365,
    reminderDays: 60,
    notes: "ライトやラジオの規格と合うか確認",
    recallWatch: true,
    keywords: ["電池", "バッテリー"],
  },
  {
    id: "radio",
    label: "ラジオ",
    name: "防災ラジオ",
    category: "emergency",
    place: "防災リュック",
    days: 365,
    reminderDays: 60,
    notes: "電池式または手回し式を確認",
    recallWatch: true,
    keywords: ["防災ラジオ", "携帯ラジオ", "ラジオ"],
  },
  {
    id: "first-aid",
    label: "救急セット",
    name: "救急セット",
    category: "health",
    place: "防災リュック",
    days: 365,
    reminderDays: 60,
    notes: "絆創膏、消毒、包帯の不足を確認",
    recallWatch: true,
    keywords: ["救急", "応急", "絆創膏", "消毒"],
  },
  {
    id: "medicine",
    label: "常備薬",
    name: "常備薬",
    category: "health",
    place: "薬箱",
    days: 180,
    reminderDays: 30,
    notes: "期限と残量を大人が確認",
    recallWatch: true,
    keywords: ["常備薬", "薬", "解熱剤", "医薬品"],
  },
  {
    id: "hygiene",
    label: "衛生用品",
    name: "衛生用品セット",
    category: "health",
    place: "防災リュック",
    days: 365,
    reminderDays: 60,
    notes: "マスク、ウェットティッシュ、簡易トイレを確認",
    recallWatch: false,
    keywords: ["衛生用品", "マスク", "ウェットティッシュ", "簡易トイレ"],
  },
];

export const emergencyEssentials = quickAddTemplates.filter((template) =>
  ["emergency-water", "emergency-food", "flashlight", "batteries", "radio", "first-aid", "medicine", "hygiene"].includes(template.id),
);

export function makeTemplateDraft(template: QuickAddTemplate) {
  return {
    name: template.name,
    category: template.category,
    place: template.place,
    dueDate: addDays(template.days),
    reminderDays: template.reminderDays,
    notes: template.notes,
    owner: template.owner ?? "家族",
    recallWatch: template.recallWatch ?? false,
  };
}

export function getEmergencyKitStatus(items: ShelfItem[]) {
  const activeItems = items.filter((item) => !item.done);
  const covered = emergencyEssentials.filter((template) => isTemplateCovered(template, activeItems));
  const missing = emergencyEssentials.filter((template) => !covered.some((entry) => entry.id === template.id));

  return {
    covered,
    missing,
    total: emergencyEssentials.length,
  };
}

function isTemplateCovered(template: QuickAddTemplate, items: ShelfItem[]) {
  const keywords = template.keywords ?? [template.name];
  return items.some((item) => {
    const haystack = `${item.name} ${item.notes}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  });
}
