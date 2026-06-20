import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react-native";
import { useAppState } from "@/src/app-state";
import { daysUntil, startOfToday, toDateInputValue } from "@/src/date";
import { CategoryIcon, EmptyState, NoticeBar, Screen, SummaryCard } from "@/src/components";
import { EasyHome } from "@/src/easy-home";
import { categoryMap } from "@/src/data";
import { colors, radius, shadows } from "@/src/theme";
import type { ShelfItem } from "@/src/types";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function ScheduleScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { activeItems, isEasyMode, notice, setNotice, toggleDone } = useAppState();
  const todayValue = toDateInputValue(startOfToday());
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(startOfToday()));
  const [selectedDate, setSelectedDate] = useState(todayValue);

  const sortedItems = useMemo(
    () => [...activeItems].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)),
    [activeItems],
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ShelfItem[]>();
    sortedItems.forEach((item) => {
      const entries = map.get(item.dueDate) ?? [];
      entries.push(item);
      map.set(item.dueDate, entries);
    });
    return map;
  }, [sortedItems]);

  const calendarDays = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const selectedDateObject = parseDateValue(selectedDate) ?? startOfToday();
  const overdue = sortedItems.filter((item) => daysUntil(item.dueDate) < 0);
  const threeDays = sortedItems.filter((item) => daysUntil(item.dueDate) >= 0 && daysUntil(item.dueDate) <= 3);
  const twoWeeks = sortedItems.filter((item) => daysUntil(item.dueDate) >= 0 && daysUntil(item.dueDate) <= 14);
  const compact = width < 360;
  const stackSummary = width < 340;

  if (isEasyMode) {
    return <EasyHome />;
  }

  function moveMonth(amount: number) {
    setVisibleMonth((current) => addMonths(current, amount));
  }

  function jumpToday() {
    const today = startOfToday();
    setVisibleMonth(monthStart(today));
    setSelectedDate(toDateInputValue(today));
  }

  return (
    <Screen>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.title}>
            予定
          </Text>
          <Text selectable style={styles.subTitle}>
            カレンダーで日付を選ぶと、その日の予定を確認できます
          </Text>
        </View>
        <Pressable accessibilityLabel="今日の確認" accessibilityRole="button" onPress={() => setNotice("今日の確認をまとめました。")} style={styles.bellButton}>
          <Bell color={colors.ink} size={24} strokeWidth={2.3} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={styles.monthToolbar}>
        <Pressable accessibilityLabel="前の月" accessibilityRole="button" onPress={() => moveMonth(-1)} style={styles.monthArrow}>
          <ChevronLeft color={colors.ink} size={25} strokeWidth={2.5} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => undefined} style={styles.monthLabelButton}>
          <Text selectable style={styles.monthLabel}>
            {visibleMonth.getFullYear()}年{visibleMonth.getMonth() + 1}月
          </Text>
          <ChevronDown color={colors.ink} size={20} strokeWidth={2.4} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={jumpToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>今日</Text>
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekHeader}>
          {weekLabels.map((label, index) => (
            <Text key={label} selectable style={[styles.weekLabel, index === 0 ? styles.sundayText : null, index === 6 ? styles.saturdayText : null]}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {calendarDays.map((date) => {
            const dateValue = toDateInputValue(date);
            const selected = dateValue === selectedDate;
            const inCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const marker = markerForDate(itemsByDate.get(dateValue) ?? []);
            const weekendStyle = date.getDay() === 0 ? styles.sundayText : date.getDay() === 6 ? styles.saturdayText : null;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={dateValue}
                onPress={() => setSelectedDate(dateValue)}
                style={[styles.dayCell, compact ? styles.dayCellCompact : null]}
              >
                <View style={[styles.dayCellInner, compact ? styles.dayCellInnerCompact : null, selected ? styles.dayCellSelected : null]}>
                  <Text selectable style={[styles.dayNumber, weekendStyle, !inCurrentMonth ? styles.outMonthText : null, selected ? styles.dayNumberSelected : null]}>
                    {date.getDate()}
                  </Text>
                  <View style={[styles.dayDot, marker ? { backgroundColor: marker } : styles.dayDotMuted, selected ? styles.dayDotSelected : null]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={colors.red} label="期限切れ" />
        <LegendDot color={colors.orange} label="3日以内" />
        <LegendDot color={colors.blue} label="予定あり" />
        <LegendDot color={colors.muted} label="予定なし" />
      </View>

      <View style={styles.selectedPanel}>
        <View style={styles.selectedHeader}>
          <View style={styles.selectedTitleGroup}>
            <View style={styles.selectedIcon}>
              <CalendarDays color="#fff" size={22} strokeWidth={2.4} />
            </View>
            <Text selectable adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.selectedTitle}>
              {formatSelectedDate(selectedDateObject)}
            </Text>
            {selectedDate === todayValue ? (
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>今日</Text>
              </View>
            ) : null}
          </View>
          <Text selectable style={styles.selectedCount}>
            予定 {selectedItems.length}件
          </Text>
        </View>

        <View style={styles.selectedList}>
          {selectedItems.map((item) => (
            <ScheduleItemRow key={item.id} item={item} onDone={() => toggleDone(item.id)} />
          ))}
          {!selectedItems.length ? <EmptyState title="この日の予定はありません" detail="予定がある日を選ぶとここに表示されます。" /> : null}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push("/list")} style={styles.addDayButton}>
          <Plus color={colors.blue} size={18} strokeWidth={2.6} />
          <Text style={styles.addDayButtonText}>この日に予定を追加</Text>
        </Pressable>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryHeader}>
          <Text selectable style={styles.summaryTitle}>
            期限のサマリー
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/list")} style={styles.linkButton}>
            <Text style={styles.linkText}>すべて見る</Text>
            <ChevronRight color={colors.blue} size={18} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={[styles.summaryGrid, stackSummary ? styles.summaryGridStack : null]}>
          <SummaryCard title="期限切れ" count={overdue.length} icon={AlertTriangle} tone="red" />
          <SummaryCard title="3日以内" count={threeDays.length} icon={Clock3} tone="orange" />
          <SummaryCard title="2週間以内" count={twoWeeks.length} icon={CalendarDays} tone="blue" />
        </View>
      </View>
    </Screen>
  );
}

function ScheduleItemRow({ item, onDone }: { item: ShelfItem; onDone: () => void }) {
  const status = statusForItem(item);

  return (
    <Pressable accessibilityRole="button" onPress={onDone} style={styles.scheduleItem}>
      <View style={styles.itemLeadingDot} />
      <CategoryIcon category={item.category} size={24} />
      <View style={styles.itemCopy}>
        <Text selectable numberOfLines={1} style={styles.itemName}>
          {item.name}
        </Text>
        <View style={styles.itemMetaRow}>
          <Clock3 color={colors.muted} size={14} strokeWidth={2.2} />
          <Text selectable numberOfLines={1} style={styles.itemMeta}>
            {categoryMap.get(item.category)?.label ?? "その他"}・{item.place || "保管場所未設定"}
          </Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
      </View>
      <ChevronRight color={colors.muted} size={20} strokeWidth={2.3} />
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text selectable style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

function markerForDate(items: ShelfItem[]) {
  if (!items.length) return null;
  if (items.some((item) => daysUntil(item.dueDate) < 0 || item.recallStatus !== "clear")) return colors.red;
  if (items.some((item) => daysUntil(item.dueDate) <= 3)) return colors.orange;
  return colors.blue;
}

function statusForItem(item: ShelfItem) {
  const days = daysUntil(item.dueDate);
  if (item.recallStatus !== "clear") return { label: "要確認", bg: colors.redSoft, fg: colors.red };
  if (days < 0) return { label: "期限切れ", bg: colors.redSoft, fg: colors.red };
  if (days <= 3) return { label: "3日以内", bg: colors.orangeSoft, fg: colors.orange };
  return { label: "予定", bg: colors.blueSoft, fg: colors.blue };
}

function parseDateValue(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthCells(month: Date) {
  const first = monthStart(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weeks = first.getDay() + last.getDate() > 35 ? 6 : 5;
  return Array.from({ length: weeks * 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function formatSelectedDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
  return `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`;
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 37,
  },
  subTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  bellButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  bellDot: {
    backgroundColor: colors.red,
    borderRadius: 999,
    height: 8,
    position: "absolute",
    right: 11,
    top: 9,
    width: 8,
  },
  monthToolbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthArrow: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  monthLabelButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 8,
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  todayButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    minWidth: 70,
    paddingHorizontal: 14,
  },
  todayButtonText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900",
  },
  calendarCard: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  weekHeader: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  weekLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: 10,
    textAlign: "center",
  },
  sundayText: {
    color: colors.red,
  },
  saturdayText: {
    color: colors.blue,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    alignItems: "center",
    borderColor: colors.line,
    borderRightWidth: 1,
    borderTopWidth: 1,
    height: 58,
    justifyContent: "center",
    width: `${100 / 7}%`,
  },
  dayCellCompact: {
    height: 52,
  },
  dayCellInner: {
    alignItems: "center",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    width: 44,
  },
  dayCellInnerCompact: {
    height: 45,
    width: 39,
  },
  dayCellSelected: {
    backgroundColor: colors.blue,
  },
  dayNumber: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  dayNumberSelected: {
    color: colors.surface,
  },
  outMonthText: {
    color: "#a2a9b2",
  },
  dayDot: {
    borderRadius: 999,
    height: 7,
    marginTop: 5,
    width: 7,
  },
  dayDotMuted: {
    backgroundColor: "transparent",
  },
  dayDotSelected: {
    backgroundColor: colors.surface,
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  selectedPanel: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  selectedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  selectedTitleGroup: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
  },
  selectedIcon: {
    alignItems: "center",
    backgroundColor: colors.blue,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  selectedTitle: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
  },
  todayPill: {
    backgroundColor: colors.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  todayPillText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  selectedCount: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900",
  },
  selectedList: {
    gap: 8,
  },
  scheduleItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  itemLeadingDot: {
    backgroundColor: colors.blue,
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  itemCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  itemName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  itemMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  itemMeta: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  addDayButton: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderRadius: 10,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 42,
  },
  addDayButtonText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
  },
  summarySection: {
    gap: 10,
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryGridStack: {
    flexDirection: "column",
  },
  linkButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    minHeight: 38,
    paddingLeft: 8,
  },
  linkText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
  },
});
