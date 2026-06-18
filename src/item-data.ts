import { categories } from "./data";
import { isValidDateValue } from "./date";
import type { Category, RecallStatus, ShelfItem } from "./types";

export const maxStoredItems = 1000;

export const itemTextLimits = {
  id: 80,
  name: 80,
  place: 80,
  notes: 500,
  owner: 40,
  createdAt: 40,
} as const;

const categoryIds = new Set<Category>(categories.map((category) => category.id));
const recallStatuses = new Set<RecallStatus>(["clear", "watch", "check"]);

function asString(value: unknown, fallback = "", maxLength = 240): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asReminderDays(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 7;
  return Math.max(1, Math.min(3650, Math.floor(numeric)));
}

function asCategory(value: unknown): Category {
  return typeof value === "string" && categoryIds.has(value as Category) ? (value as Category) : "other";
}

function asRecallStatus(value: unknown): RecallStatus {
  return typeof value === "string" && recallStatuses.has(value as RecallStatus) ? (value as RecallStatus) : "clear";
}

function makeLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeShelfItem(value: unknown): ShelfItem | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const name = asString(source.name, "", itemTextLimits.name);
  const dueDate = asString(source.dueDate, "", 10);

  if (!name || !isValidDateValue(dueDate)) {
    return null;
  }

  const id = asString(source.id, "", itemTextLimits.id) || makeLocalId();
  const recallStatus = asRecallStatus(source.recallStatus);

  return {
    id,
    name,
    category: asCategory(source.category),
    place: asString(source.place, "", itemTextLimits.place),
    dueDate,
    reminderDays: asReminderDays(source.reminderDays),
    notes: asString(source.notes, "", itemTextLimits.notes),
    owner: asString(source.owner, "自分", itemTextLimits.owner),
    done: asBoolean(source.done),
    recallWatch: asBoolean(source.recallWatch) || recallStatus !== "clear",
    recallStatus,
    createdAt: asString(source.createdAt, new Date().toISOString(), itemTextLimits.createdAt),
  };
}

export function normalizeItems(value: unknown): ShelfItem[] | null {
  if (!Array.isArray(value)) return null;
  const usedIds = new Set<string>();

  return value
    .slice(0, maxStoredItems)
    .map(normalizeShelfItem)
    .filter((item): item is ShelfItem => item !== null)
    .map((item) => {
      if (!usedIds.has(item.id)) {
        usedIds.add(item.id);
        return item;
      }

      const uniqueId = makeLocalId();
      usedIds.add(uniqueId);
      return { ...item, id: uniqueId };
    });
}
