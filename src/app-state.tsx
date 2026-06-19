import * as Haptics from "expo-haptics";
import { createContext, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { canUsePaidPlans, isPaidPlanId, paidPlansUnavailableMessage } from "./billing";
import { categoryMap, storageKey } from "./data";
import { daysUntil, isValidDateValue, relativeLabel } from "./date";
import {
  disableDueNotificationsForItems,
  enableDueNotificationsForItems,
  normalizeDueReminderHour,
  readDueNotificationState,
  syncDueNotificationsForItems,
  writeDueNotificationState,
} from "./due-notifications";
import { itemTextLimits, normalizeItems } from "./item-data";
import { readJson, writeJson } from "./storage";
import type { Category, ShelfItem } from "./types";
import type { DueNotificationState } from "./due-notifications";

export type HomeFilter = "soon" | "recall" | "done" | "all";
export type PlanId = "free" | "plus" | "family";

export type DraftItem = {
  name: string;
  category: Category;
  place: string;
  dueDate: string;
  reminderDays: number;
  notes: string;
  owner: string;
  recallWatch: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  limitLabel: string;
  features: string[];
};

type AppState = {
  activeItems: ShelfItem[];
  addItem: (draft: DraftItem) => boolean;
  arePaidPlansEnabled: boolean;
  canAddMore: boolean;
  choosePlan: (plan: PlanId) => void;
  clearRecall: (id: string) => void;
  completeOnboarding: () => void;
  currentPlan: Plan;
  doneItems: ShelfItem[];
  draftTemplate: DraftItem;
  dueNotifications: DueNotificationState;
  disableDueNotifications: () => Promise<void>;
  enableDueNotifications: () => Promise<void>;
  filterItems: (query: string) => ShelfItem[];
  getHomeItems: (filter: HomeFilter) => ShelfItem[];
  isFamilyPlan: boolean;
  isEasyMode: boolean;
  isPaidPlan: boolean;
  isSyncingDueNotifications: boolean;
  hasSeenOnboarding: boolean;
  items: ShelfItem[];
  notice: string;
  plan: PlanId;
  recallItems: ShelfItem[];
  remainingFreeItems: number;
  setEasyMode: (enabled: boolean) => void;
  setDueNotificationHour: (hour: number) => void;
  setDueNotificationOverdueFollowUp: (enabled: boolean) => void;
  setNotice: (notice: string) => void;
  soonItems: ShelfItem[];
  syncDueNotifications: () => Promise<void>;
  toggleDone: (id: string) => void;
};

const subscriptionKey = "mamoru-tana-plan-v1";
const easyModeKey = "mamoru-tana-easy-mode-v1";
const onboardingKey = "mamoru-tana-onboarding-seen-v1";
export const freeItemLimit = 15;

const legacySampleItemIds = new Set([
  "seed-freezer-meal",
  "seed-emergency-water",
  "seed-medicine",
  "seed-helmet",
  "seed-washer-warranty",
  "seed-passport",
]);

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "0円",
    description: "まずは家の期限を試す",
    limitLabel: "未完了15件まで",
    features: ["端末保存", "基本通知1回", "完了分は枠外"],
  },
  {
    id: "plus",
    name: "Plus",
    price: "480円/月",
    description: "うっかり損を減らす本命",
    limitLabel: "登録無制限",
    features: ["登録無制限", "安心通知", "安全チェック強化"],
  },
  {
    id: "family",
    name: "Family",
    price: "880円/月",
    description: "家族で分担して守る",
    limitLabel: "家族共有つき",
    features: ["担当者", "家族共有", "複数端末同期"],
  },
];

export const draftTemplate: DraftItem = {
  name: "",
  category: "food",
  place: "",
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  reminderDays: 7,
  notes: "",
  owner: "自分",
  recallWatch: false,
};

const StateContext = createContext<AppState | null>(null);

function sortByUrgency(items: ShelfItem[]): ShelfItem[] {
  const score = (item: ShelfItem) => {
    const days = daysUntil(item.dueDate);
    const safeDays = Number.isFinite(days) ? days : 100000;
    const recallPenalty = item.recallStatus === "clear" ? 0 : -100;
    return safeDays + recallPenalty;
  };

  return [...items].sort((a, b) => {
    return score(a) - score(b);
  });
}

export function isSoon(item: ShelfItem): boolean {
  const days = daysUntil(item.dueDate);
  return Number.isFinite(days) && !item.done && item.recallStatus === "clear" && days > 0 && days <= item.reminderDays;
}

export function statusLabel(item: ShelfItem): string {
  if (item.done) return "完了";
  if (item.recallStatus !== "clear") return "要確認";
  return relativeLabel(item.dueDate);
}

function makeItem(draft: DraftItem): ShelfItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...draft,
    done: false,
    recallStatus: draft.recallWatch ? "check" : "clear",
    createdAt: new Date().toISOString(),
  };
}

function clampText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function tapLight() {
  if (process.env.EXPO_OS === "ios") {
    Haptics.selectionAsync().catch(() => undefined);
  }
}

function removeLegacySampleItems(items: ShelfItem[]): ShelfItem[] {
  return items.filter((item) => !legacySampleItemIds.has(item.id));
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const arePaidPlansEnabled = canUsePaidPlans();
  const [items, setItems] = useState<ShelfItem[]>(() => {
    const stored = readJson<unknown>(storageKey, null);
    if (stored === null) return [];
    const normalized = normalizeItems(stored);
    return normalized ? removeLegacySampleItems(normalized) : [];
  });
  const [plan, setPlan] = useState<PlanId>(() => {
    if (!arePaidPlansEnabled) return "free";
    const stored = readJson<unknown>(subscriptionKey, "free");
    return stored === "plus" || stored === "family" ? stored : "free";
  });
  const [isEasyMode, setIsEasyMode] = useState<boolean>(() => readJson<unknown>(easyModeKey, false) === true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => readJson<unknown>(onboardingKey, false) === true);
  const [dueNotifications, setDueNotifications] = useState<DueNotificationState>(() => readDueNotificationState());
  const [isSyncingDueNotifications, setIsSyncingDueNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const currentPlan = plans.find((entry) => entry.id === plan) ?? plans[0];
  const isPaidPlan = arePaidPlansEnabled && plan !== "free";
  const isFamilyPlan = arePaidPlansEnabled && plan === "family";

  useEffect(() => {
    writeJson(storageKey, items);
  }, [items]);

  useEffect(() => {
    writeJson(subscriptionKey, plan);
  }, [plan]);

  useEffect(() => {
    if (!arePaidPlansEnabled && plan !== "free") {
      setPlan("free");
    }
  }, [arePaidPlansEnabled, plan]);

  useEffect(() => {
    writeJson(easyModeKey, isEasyMode);
  }, [isEasyMode]);

  useEffect(() => {
    writeJson(onboardingKey, hasSeenOnboarding);
  }, [hasSeenOnboarding]);

  useEffect(() => {
    writeDueNotificationState(dueNotifications);
  }, [dueNotifications]);

  useEffect(() => {
    if (!dueNotifications.enabled || isSyncingDueNotifications) return;

    let cancelled = false;
    syncDueNotificationsForItems(items, {
      isPremium: isPaidPlan,
      reminderHour: dueNotifications.reminderHour,
      overdueFollowUp: dueNotifications.overdueFollowUp,
    }).then((nextState) => {
      if (!cancelled) {
        setDueNotifications(nextState);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dueNotifications.enabled, dueNotifications.overdueFollowUp, dueNotifications.reminderHour, isPaidPlan, isSyncingDueNotifications, items]);

  const activeItems = useMemo(() => items.filter((item) => !item.done), [items]);
  const doneItems = useMemo(() => items.filter((item) => item.done), [items]);
  const soonItems = useMemo(() => sortByUrgency(activeItems).filter((item) => isSoon(item) || daysUntil(item.dueDate) <= 7), [activeItems]);
  const recallItems = useMemo(() => sortByUrgency(activeItems).filter((item) => item.recallStatus !== "clear"), [activeItems]);
  const remainingFreeItems = Math.max(freeItemLimit - activeItems.length, 0);
  const canAddMore = isPaidPlan || activeItems.length < freeItemLimit;

  const value = useMemo<AppState>(
    () => ({
      activeItems,
      addItem(draft) {
        const name = clampText(draft.name, itemTextLimits.name);
        if (!name) {
          setNotice("アイテム名を入力してください。");
          return false;
        }
        if (!isValidDateValue(draft.dueDate)) {
          setNotice("期限はYYYY-MM-DD形式で正しい日付を入力してください。");
          return false;
        }
        if (!canAddMore) {
          setNotice("無料プランは未完了15件までです。完了にすると枠が空きます。");
          return false;
        }
        const reminderDays = Math.max(1, Math.min(3650, Math.floor(Number.isFinite(draft.reminderDays) ? draft.reminderDays : 7)));
        tapLight();
        setItems((current) => [
          makeItem({
            ...draft,
            name,
            place: clampText(draft.place, itemTextLimits.place),
            notes: clampText(draft.notes, itemTextLimits.notes),
            owner: clampText(draft.owner, itemTextLimits.owner) || "自分",
            reminderDays,
          }),
          ...current,
        ]);
        setNotice("追加しました。");
        return true;
      },
      arePaidPlansEnabled,
      canAddMore,
      choosePlan(nextPlan) {
        tapLight();
        if (isPaidPlanId(nextPlan) && !arePaidPlansEnabled) {
          setPlan("free");
          setNotice(paidPlansUnavailableMessage);
          return;
        }
        setPlan(nextPlan);
        setNotice(
          nextPlan === "free"
            ? "Freeに戻しました。"
            : `${plans.find((entry) => entry.id === nextPlan)?.name}を有効にしました。`,
        );
      },
      clearRecall(id) {
        tapLight();
        setItems((current) => current.map((item) => (item.id === id ? { ...item, recallStatus: "clear" } : item)));
      },
      completeOnboarding() {
        tapLight();
        setHasSeenOnboarding(true);
      },
      currentPlan,
      doneItems,
      draftTemplate,
      dueNotifications,
      async disableDueNotifications() {
        setIsSyncingDueNotifications(true);
        try {
          const nextState = await disableDueNotificationsForItems({
            isPremium: isPaidPlan,
            reminderHour: dueNotifications.reminderHour,
            overdueFollowUp: dueNotifications.overdueFollowUp,
          });
          setDueNotifications(nextState);
          setNotice("期限通知をオフにしました。");
        } finally {
          setIsSyncingDueNotifications(false);
        }
      },
      async enableDueNotifications() {
        setIsSyncingDueNotifications(true);
        try {
          const nextState = await enableDueNotificationsForItems(items, {
            isPremium: isPaidPlan,
            reminderHour: dueNotifications.reminderHour,
            overdueFollowUp: dueNotifications.overdueFollowUp,
          });
          setDueNotifications(nextState);
          setNotice(nextState.enabled ? (isPaidPlan ? "安心通知をオンにしました。" : "基本通知をオンにしました。") : nextState.lastError ?? "期限通知を有効にできませんでした。");
        } finally {
          setIsSyncingDueNotifications(false);
        }
      },
      filterItems(query) {
        const normalized = query.trim().toLowerCase();
        return sortByUrgency(items).filter((item) => {
          const searchable = `${item.name} ${categoryMap.get(item.category)?.label ?? ""} ${item.place} ${item.notes}`.toLowerCase();
          return !normalized || searchable.includes(normalized);
        });
      },
      getHomeItems(filter) {
        if (filter === "soon") return soonItems;
        if (filter === "recall") return recallItems;
        if (filter === "done") return doneItems;
        return sortByUrgency(items);
      },
      isEasyMode,
      isFamilyPlan,
      isPaidPlan,
      isSyncingDueNotifications,
      hasSeenOnboarding,
      items,
      notice,
      plan,
      recallItems,
      remainingFreeItems,
      setEasyMode(enabled) {
        tapLight();
        setIsEasyMode(enabled);
        setNotice(enabled ? "かんたんモードにしました。" : "通常モードに戻しました。");
      },
      setDueNotificationHour(hour) {
        tapLight();
        if (!isPaidPlan) {
          setNotice("通知時間の変更はPlusの安心通知で使えます。");
          return;
        }
        const reminderHour = normalizeDueReminderHour(hour);
        setDueNotifications((current) => ({ ...current, reminderHour }));
        setNotice(`通知時間を${reminderHour}:00にしました。`);
      },
      setDueNotificationOverdueFollowUp(enabled) {
        tapLight();
        if (!isPaidPlan) {
          setNotice("期限切れ後のフォローはPlusの安心通知で使えます。");
          return;
        }
        setDueNotifications((current) => ({ ...current, overdueFollowUp: enabled }));
        setNotice(enabled ? "期限切れ後のフォローをオンにしました。" : "期限切れ後のフォローをオフにしました。");
      },
      setNotice,
      soonItems,
      async syncDueNotifications() {
        if (!dueNotifications.enabled) {
          setNotice("期限通知はオフです。");
          return;
        }
        setIsSyncingDueNotifications(true);
        try {
          const nextState = await syncDueNotificationsForItems(items, {
            isPremium: isPaidPlan,
            reminderHour: dueNotifications.reminderHour,
            overdueFollowUp: dueNotifications.overdueFollowUp,
          });
          setDueNotifications(nextState);
          setNotice(nextState.enabled ? "期限通知を再設定しました。" : nextState.lastError ?? "期限通知を再設定できませんでした。");
        } finally {
          setIsSyncingDueNotifications(false);
        }
      },
      toggleDone(id) {
        tapLight();
        setItems((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
      },
    }),
    [
      activeItems,
      arePaidPlansEnabled,
      canAddMore,
      currentPlan,
      doneItems,
      dueNotifications,
      isEasyMode,
      isFamilyPlan,
      isPaidPlan,
      isSyncingDueNotifications,
      hasSeenOnboarding,
      items,
      notice,
      plan,
      recallItems,
      remainingFreeItems,
      soonItems,
    ],
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const value = use(StateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}
