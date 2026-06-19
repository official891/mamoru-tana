import { Platform } from "react-native";
import { daysUntil, formatShortDate, isValidDateValue, relativeLabel } from "./date";
import { readJson, writeJson } from "./storage";
import type { ShelfItem } from "./types";

type NotificationsModule = typeof import("expo-notifications");

const notificationSettingsKey = "mamoru-tana-due-notifications-v1";
const notificationIdPrefix = "mamoru-tana-due-";
const notificationChannelId = "mamoru-tana-due-reminders";
const maxScheduledNotifications = 64;
const defaultReminderHour = 9;
const paidOverdueFollowUpDays = 3;
let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let didSetNotificationHandler = false;

export const dueReminderHourChoices = [8, 9, 18, 20] as const;

export type DueNotificationState = {
  enabled: boolean;
  permission: "unknown" | "granted" | "denied" | "web" | "error";
  scheduledCount: number;
  nextReminderAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  reminderHour: number;
  overdueFollowUp: boolean;
};

export type DueNotificationScheduleOptions = {
  isPremium: boolean;
  reminderHour: number;
  overdueFollowUp: boolean;
};

export const defaultDueNotificationState: DueNotificationState = {
  enabled: false,
  permission: "unknown",
  scheduledCount: 0,
  nextReminderAt: null,
  lastSyncedAt: null,
  lastError: null,
  reminderHour: defaultReminderHour,
  overdueFollowUp: true,
};

export function readDueNotificationState(): DueNotificationState {
  const stored = readJson<Partial<DueNotificationState> | null>(notificationSettingsKey, null);
  if (!stored || typeof stored !== "object") return defaultDueNotificationState;

  return {
    ...defaultDueNotificationState,
    enabled: stored.enabled === true,
    permission: normalizePermission(stored.permission),
    scheduledCount: asCount(stored.scheduledCount),
    nextReminderAt: typeof stored.nextReminderAt === "string" ? stored.nextReminderAt : null,
    lastSyncedAt: typeof stored.lastSyncedAt === "string" ? stored.lastSyncedAt : null,
    lastError: typeof stored.lastError === "string" ? stored.lastError : null,
    reminderHour: normalizeDueReminderHour(stored.reminderHour),
    overdueFollowUp: stored.overdueFollowUp !== false,
  };
}

export function writeDueNotificationState(state: DueNotificationState) {
  writeJson(notificationSettingsKey, state);
}

export async function enableDueNotificationsForItems(items: ShelfItem[], options: DueNotificationScheduleOptions): Promise<DueNotificationState> {
  if (Platform.OS === "web") {
    return {
      ...defaultDueNotificationState,
      permission: "web",
      lastError: "通知はiOS/Androidの実機で有効にできます。",
      lastSyncedAt: new Date().toISOString(),
      reminderHour: options.reminderHour,
      overdueFollowUp: options.overdueFollowUp,
    };
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return webNotificationState();

    const granted = await ensureNotificationPermission(Notifications, true);
    if (!granted) {
      await cancelMamoruTanaNotifications(Notifications);
      return {
        ...defaultDueNotificationState,
        permission: "denied",
        lastError: "端末の通知権限が許可されていません。",
        lastSyncedAt: new Date().toISOString(),
        reminderHour: options.reminderHour,
        overdueFollowUp: options.overdueFollowUp,
      };
    }

    return await scheduleDueNotifications(Notifications, items, options);
  } catch {
    return {
      ...defaultDueNotificationState,
      permission: "error",
      lastError: "通知の設定に失敗しました。端末の通知設定を確認してください。",
      lastSyncedAt: new Date().toISOString(),
      reminderHour: options.reminderHour,
      overdueFollowUp: options.overdueFollowUp,
    };
  }
}

export async function syncDueNotificationsForItems(items: ShelfItem[], options: DueNotificationScheduleOptions): Promise<DueNotificationState> {
  if (Platform.OS === "web") {
    return {
      ...defaultDueNotificationState,
      permission: "web",
      lastError: "通知はiOS/Androidの実機で有効にできます。",
      lastSyncedAt: new Date().toISOString(),
      reminderHour: options.reminderHour,
      overdueFollowUp: options.overdueFollowUp,
    };
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return webNotificationState();

    const granted = await ensureNotificationPermission(Notifications, false);
    if (!granted) {
      await cancelMamoruTanaNotifications(Notifications);
      return {
        ...defaultDueNotificationState,
        permission: "denied",
        lastError: "端末の通知権限が許可されていません。",
        lastSyncedAt: new Date().toISOString(),
        reminderHour: options.reminderHour,
        overdueFollowUp: options.overdueFollowUp,
      };
    }

    return await scheduleDueNotifications(Notifications, items, options);
  } catch {
    return {
      ...defaultDueNotificationState,
      permission: "error",
      lastError: "通知の再設定に失敗しました。",
      lastSyncedAt: new Date().toISOString(),
      reminderHour: options.reminderHour,
      overdueFollowUp: options.overdueFollowUp,
    };
  }
}

export async function disableDueNotificationsForItems(options: DueNotificationScheduleOptions): Promise<DueNotificationState> {
  const Notifications = await getNotificationsModule();
  if (Notifications) {
    await cancelMamoruTanaNotifications(Notifications);
  }

  return {
    ...defaultDueNotificationState,
    permission: Platform.OS === "web" ? "web" : "unknown",
    lastSyncedAt: new Date().toISOString(),
    reminderHour: options.reminderHour,
    overdueFollowUp: options.overdueFollowUp,
  };
}

export function formatNotificationStatus(state: DueNotificationState, isPremium: boolean): string {
  if (Platform.OS === "web") return "通知はiOS/Androidの実機で使えます。";
  if (!state.enabled) return "オフ。必要なときにここから有効にできます。";
  if (state.scheduledCount === 0) return "オン。通知予定のアイテムはまだありません。";
  const label = isPremium ? "安心通知オン" : "基本通知オン";
  return `${label}。${state.scheduledCount}件を予約中${state.nextReminderAt ? `（次回 ${formatNotificationDateTime(state.nextReminderAt)}）` : ""}。`;
}

function normalizePermission(value: unknown): DueNotificationState["permission"] {
  return value === "granted" || value === "denied" || value === "web" || value === "error" ? value : "unknown";
}

function asCount(value: unknown): number {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.min(maxScheduledNotifications, Math.floor(count)));
}

export function normalizeDueReminderHour(value: unknown): number {
  const hour = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(hour)) return defaultReminderHour;
  const normalized = Math.floor(hour);
  return dueReminderHourChoices.includes(normalized as (typeof dueReminderHourChoices)[number]) ? normalized : defaultReminderHour;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web") return null;

  notificationsModulePromise ??= import("expo-notifications");
  const Notifications = await notificationsModulePromise;
  if (!didSetNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    didSetNotificationHandler = true;
  }

  return Notifications;
}

function webNotificationState(): DueNotificationState {
  return {
    ...defaultDueNotificationState,
    permission: "web",
    lastError: "通知はiOS/Androidの実機で有効にできます。",
    lastSyncedAt: new Date().toISOString(),
  };
}

async function ensureNotificationPermission(Notifications: NotificationsModule, shouldRequest: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!shouldRequest) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleDueNotifications(
  Notifications: NotificationsModule,
  items: ShelfItem[],
  options: DueNotificationScheduleOptions,
): Promise<DueNotificationState> {
  await ensureAndroidChannel(Notifications);
  await cancelMamoruTanaNotifications(Notifications);

  const now = new Date();
  const scheduledItems = buildScheduledReminders(items, now, {
    ...options,
    reminderHour: normalizeDueReminderHour(options.reminderHour),
  })
    .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime())
    .slice(0, maxScheduledNotifications);

  for (const entry of scheduledItems) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${notificationIdPrefix}${entry.item.id}-${entry.kind}`,
      content: {
        title: entry.title,
        body: entry.body,
        data: { itemId: entry.item.id, notificationKind: entry.kind, source: "mamoru-tana" },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: entry.triggerAt,
        channelId: notificationChannelId,
      },
    });
  }

  return {
    enabled: true,
    permission: "granted",
    scheduledCount: scheduledItems.length,
    nextReminderAt: scheduledItems[0]?.triggerAt.toISOString() ?? null,
    lastSyncedAt: new Date().toISOString(),
    lastError: null,
    reminderHour: normalizeDueReminderHour(options.reminderHour),
    overdueFollowUp: options.overdueFollowUp,
  };
}

async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(notificationChannelId, {
    name: "期限のお知らせ",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function cancelMamoruTanaNotifications(Notifications: NotificationsModule) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(notificationIdPrefix) || request.content.data?.source === "mamoru-tana")
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

type ScheduledReminder = {
  item: ShelfItem;
  triggerAt: Date;
  kind: string;
  title: string;
  body: string;
};

function buildScheduledReminders(items: ShelfItem[], now: Date, options: DueNotificationScheduleOptions): ScheduledReminder[] {
  return items
    .filter((item) => !item.done && isValidDateValue(item.dueDate))
    .flatMap((item) => (options.isPremium ? buildPremiumReminders(item, now, options) : buildBasicReminders(item, now, options.reminderHour)));
}

function buildBasicReminders(item: ShelfItem, now: Date, reminderHour: number): ScheduledReminder[] {
  const triggerAt = getReminderDate(item, now, reminderHour);
  if (!triggerAt) return [];

  return [
    {
      item,
      triggerAt,
      kind: "basic",
      title: "期限が近いものがあります",
      body: `${item.name}は${relativeLabel(item.dueDate)}です。確認しましょう。`,
    },
  ];
}

function buildPremiumReminders(item: ShelfItem, now: Date, options: DueNotificationScheduleOptions): ScheduledReminder[] {
  const reminders: ScheduledReminder[] = [];
  const usedTimes = new Set<number>();
  const reminderHour = normalizeDueReminderHour(options.reminderHour);

  const addReminder = (kind: string, triggerAt: Date | null, title: string, body: string) => {
    if (!triggerAt) return;
    const key = triggerAt.getTime();
    if (usedTimes.has(key)) return;
    usedTimes.add(key);
    reminders.push({ item, triggerAt, kind, title, body });
  };

  addReminder(
    "early",
    getReminderDate(item, now, reminderHour),
    "期限が近いものがあります",
    `${item.name}は${relativeLabel(item.dueDate)}です。早めに確認しましょう。`,
  );
  addReminder(
    "day-before",
    getDateFromDue(item, -1, now, reminderHour),
    "明日が期限です",
    `${item.name}は明日が期限です。今日のうちに確認しましょう。`,
  );
  addReminder(
    "due-day",
    getDateFromDue(item, 0, now, reminderHour),
    "今日が期限です",
    `${item.name}は今日が期限です。完了したらチェックしましょう。`,
  );

  if (options.overdueFollowUp) {
    for (let daysAfterDue = 1; daysAfterDue <= paidOverdueFollowUpDays; daysAfterDue += 1) {
      addReminder(
        `overdue-${daysAfterDue}`,
        getDateFromDue(item, daysAfterDue, now, reminderHour),
        "期限を過ぎています",
        `${item.name}の期限を過ぎています。必要なら入れ替えや確認をしましょう。`,
      );
    }
  }

  return reminders;
}

function getReminderDate(item: ShelfItem, now: Date, reminderHour: number): Date | null {
  const dueDate = new Date(`${item.dueDate}T00:00:00`);
  dueDate.setHours(reminderHour, 0, 0, 0);

  const dueEnd = new Date(dueDate);
  dueEnd.setHours(23, 59, 0, 0);
  if (dueEnd.getTime() <= now.getTime()) return null;

  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - item.reminderDays);
  reminderDate.setHours(reminderHour, 0, 0, 0);

  if (reminderDate.getTime() > now.getTime() + 60 * 1000) {
    return reminderDate;
  }

  const nextMorning = new Date(now);
  nextMorning.setDate(nextMorning.getDate() + 1);
  nextMorning.setHours(reminderHour, 0, 0, 0);

  return nextMorning.getTime() <= dueEnd.getTime() ? nextMorning : null;
}

function getDateFromDue(item: ShelfItem, dueOffsetDays: number, now: Date, reminderHour: number): Date | null {
  const target = new Date(`${item.dueDate}T00:00:00`);
  target.setDate(target.getDate() + dueOffsetDays);
  target.setHours(reminderHour, 0, 0, 0);

  return target.getTime() > now.getTime() + 60 * 1000 ? target : null;
}

function formatNotificationDateTime(isoValue: string): string {
  const date = new Date(isoValue);
  if (!Number.isFinite(date.getTime())) return "未定";

  return `${formatShortDate(date.toISOString().slice(0, 10))} ${date.getHours()}:00`;
}
