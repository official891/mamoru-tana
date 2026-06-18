import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, Clock3, PackageCheck } from "lucide-react-native";
import { categories } from "@/src/data";
import { daysUntil } from "@/src/date";
import type { HomeFilter } from "@/src/app-state";
import { useAppState } from "@/src/app-state";
import { getEmergencyKitStatus, makeTemplateDraft } from "@/src/quick-add";
import type { QuickAddTemplate } from "@/src/quick-add";
import {
  CollapsibleRow,
  EmptyState,
  FilterTabs,
  ItemRow,
  Mascot,
  NoticeBar,
  Screen,
  SectionHeader,
  SummaryCard,
} from "@/src/components";
import { EasyHome } from "@/src/easy-home";
import { colors, radius, shadows } from "@/src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { addItem, clearRecall, completeOnboarding, doneItems, getHomeItems, hasSeenOnboarding, isEasyMode, items, notice, recallItems, setNotice, soonItems } = useAppState();
  const [filter, setFilter] = useState<HomeFilter>("soon");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const selectedItems = getHomeItems(filter).slice(0, 4);
  const twoWeekItems = useMemo(
    () =>
      getHomeItems("all")
        .filter((item) => !item.done && daysUntil(item.dueDate) >= 0 && daysUntil(item.dueDate) <= 14)
        .slice(0, 5),
    [getHomeItems],
  );
  const categoryCounts = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        count: items.filter((item) => item.category === category.id).length,
      })),
    [items],
  );
  const emergencyKit = useMemo(() => getEmergencyKitStatus(items), [items]);
  const emergencyProgress = Math.round((emergencyKit.covered.length / emergencyKit.total) * 100);

  function addEmergencyTemplate(template: QuickAddTemplate) {
    const saved = addItem(makeTemplateDraft(template));
    if (saved) {
      setNotice(`${template.label}を追加しました。`);
    }
  }

  function startOnboarding() {
    completeOnboarding();
    router.push("/list");
  }

  if (isEasyMode) {
    return <EasyHome />;
  }

  const stackSummary = width < 620;

  return (
    <Screen>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      {!hasSeenOnboarding && items.length === 0 ? (
        <View style={styles.onboardingPanel}>
          <View style={styles.onboardingHeader}>
            <Mascot mood="clipboard" size={84} />
            <View style={styles.onboardingCopy}>
              <Text selectable style={styles.onboardingEyebrow}>
                はじめてガイド
              </Text>
              <Text selectable adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={2} style={styles.onboardingTitle}>
                まず1つ登録しましょう
              </Text>
              <Text selectable style={styles.onboardingText}>
                期限が近づいたらホームと通知で確認できます。
              </Text>
            </View>
          </View>
          <View style={styles.onboardingSteps}>
            {[
              { number: "1", title: "一覧で追加", text: "すぐ追加か手入力で登録します。" },
              { number: "2", title: "期限を決める", text: "日付と通知日数を入れます。" },
              { number: "3", title: "確認したら完了", text: "終わったものはFree枠を使いません。" },
            ].map((step) => (
              <View key={step.number} style={styles.onboardingStep}>
                <View style={styles.onboardingStepBadge}>
                  <Text style={styles.onboardingStepBadgeText}>{step.number}</Text>
                </View>
                <View style={styles.onboardingStepBody}>
                  <Text selectable style={styles.onboardingStepTitle}>
                    {step.title}
                  </Text>
                  <Text selectable style={styles.onboardingStepText}>
                    {step.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.onboardingActions}>
            <Pressable accessibilityRole="button" onPress={startOnboarding} style={styles.onboardingPrimary}>
              <Text style={styles.onboardingPrimaryText}>登録へ進む</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={completeOnboarding} style={styles.onboardingSecondary}>
              <Text style={styles.onboardingSecondaryText}>あとで</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.hero}>
        <Mascot mood={recallItems.length ? "search" : "wave"} size={100} />
        <View style={styles.heroText}>
          <Text selectable adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.heroTitle}>
            おかえりなさい！
          </Text>
          <Text selectable style={styles.heroSub}>
            おうちストックを一緒に管理しよう
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setNotice("今日の確認をまとめました。")} style={styles.bellButton}>
          <Bell color={colors.ink} size={24} strokeWidth={2.3} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={[styles.summaryGrid, stackSummary ? styles.summaryGridStack : null]}>
        <SummaryCard title="近い期限" count={soonItems.length} icon={Clock3} tone="orange" />
        <SummaryCard title="安全チェック" count={recallItems.length} icon={AlertTriangle} tone="red" />
        <SummaryCard title="完了" count={doneItems.length} icon={CheckCircle2} tone="green" />
      </View>

      <View style={styles.kitPanel}>
        <View style={styles.kitHeader}>
          <View style={styles.kitCopy}>
            <Text selectable style={styles.kitEyebrow}>
              防災キット
            </Text>
            <Text selectable adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.kitTitle}>
              基本セット {emergencyKit.covered.length}/{emergencyKit.total}
            </Text>
          </View>
          <Mascot mood={emergencyKit.missing.length ? "clipboard" : "wave"} size={78} />
        </View>
        <View style={styles.kitProgressTrack}>
          <View style={[styles.kitProgressFill, { width: `${emergencyProgress}%` }]} />
        </View>
        <Text selectable style={styles.kitText}>
          {emergencyKit.missing.length ? "足りないものをすぐ追加できます。" : "基本セットはそろっています。期限だけ見守りましょう。"}
        </Text>
        {emergencyKit.missing.length ? (
          <View style={styles.kitChipRow}>
            {emergencyKit.missing.slice(0, 4).map((template) => (
              <Pressable accessibilityRole="button" key={template.id} onPress={() => addEmergencyTemplate(template)} style={styles.kitChip}>
                <Text style={styles.kitChipText}>＋ {template.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <FilterTabs
        active={filter}
        onChange={(id) => setFilter(id as HomeFilter)}
        options={[
          { id: "soon", label: "近い期限", count: soonItems.length },
          { id: "recall", label: "安全チェック", count: recallItems.length },
          { id: "done", label: "完了", count: doneItems.length },
          { id: "all", label: "すべて", count: items.length },
        ]}
      />

      <View style={styles.panel}>
        <SectionHeader
          title={filter === "recall" ? "安全チェック" : filter === "done" ? "完了" : filter === "all" ? "すべて" : "近い期限"}
          action={
            <Pressable accessibilityRole="button" onPress={() => router.push("/list")} style={styles.linkButton}>
              <Text style={styles.linkText}>すべて見る</Text>
            </Pressable>
          }
        />
        <View style={styles.listStack}>
          {selectedItems.length ? (
            selectedItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                actionLabel={item.recallStatus !== "clear" ? "確認する" : undefined}
                onAction={item.recallStatus !== "clear" ? () => clearRecall(item.id) : undefined}
              />
            ))
          ) : (
            <EmptyState title="今すぐ確認するものはありません" detail="期限が近づくとここに表示されます。" />
          )}
        </View>
        <Text selectable style={styles.pagingText}>
          1-{Math.min(selectedItems.length, 4)}件を表示（全{getHomeItems(filter).length}件）
        </Text>
      </View>

      <View style={styles.panel}>
        <SectionHeader
          title="安全チェック"
          action={
            <Pressable accessibilityRole="button" onPress={() => setFilter("recall")} style={styles.linkButton}>
              <Text style={styles.linkText}>すべて見る</Text>
            </Pressable>
          }
        />
        <View style={styles.listStack}>
          {recallItems.slice(0, 2).map((item) => (
            <ItemRow key={item.id} item={item} actionLabel="確認する" onAction={() => clearRecall(item.id)} compact />
          ))}
          {!recallItems.length ? <EmptyState title="安全チェックはありません" /> : null}
        </View>
      </View>

      <CollapsibleRow title="2週間の予定" icon={CalendarDays} open={scheduleOpen} onPress={() => setScheduleOpen((current) => !current)}>
        {twoWeekItems.map((item) => (
          <ItemRow key={item.id} item={item} compact />
        ))}
        {!twoWeekItems.length ? <EmptyState title="2週間以内の予定はありません" /> : null}
      </CollapsibleRow>

      <CollapsibleRow title={`カテゴリ別アイテム数（合計${items.length}件）`} icon={PackageCheck} open={categoryOpen} onPress={() => setCategoryOpen((current) => !current)}>
        <View style={styles.categoryGrid}>
          {categoryCounts.map((category) => (
            <View key={category.id} style={styles.categoryCell}>
              <Text selectable style={styles.categoryLabel}>
                {category.label}
              </Text>
              <Text selectable style={styles.categoryCount}>
                {category.count}件
              </Text>
            </View>
          ))}
        </View>
      </CollapsibleRow>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 116,
    position: "relative",
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },
  heroSub: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 5,
  },
  bellButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 18,
    width: 54,
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
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryGridStack: {
    flexDirection: "column",
  },
  panel: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  onboardingPanel: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: "#c9e2ff",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  onboardingHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  onboardingCopy: {
    flex: 1,
    minWidth: 0,
  },
  onboardingEyebrow: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
  },
  onboardingTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 26,
    marginTop: 2,
  },
  onboardingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 4,
  },
  onboardingSteps: {
    gap: 9,
  },
  onboardingStep: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderColor: "#d6e9ff",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    padding: 10,
  },
  onboardingStepBadge: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  onboardingStepBadgeText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: "900",
  },
  onboardingStepBody: {
    flex: 1,
    minWidth: 0,
  },
  onboardingStepTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  onboardingStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  onboardingActions: {
    flexDirection: "row",
    gap: 10,
  },
  onboardingPrimary: {
    alignItems: "center",
    backgroundColor: colors.blue,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  onboardingSecondary: {
    alignItems: "center",
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 86,
    paddingHorizontal: 12,
  },
  onboardingPrimaryText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  onboardingSecondaryText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  kitPanel: {
    ...shadows.card,
    backgroundColor: colors.greenSoft,
    borderColor: "#c5eddc",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  kitHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  kitCopy: {
    flex: 1,
    minWidth: 0,
  },
  kitEyebrow: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
  },
  kitTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 26,
    marginTop: 3,
  },
  kitProgressTrack: {
    backgroundColor: colors.surface,
    borderColor: "#c5eddc",
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    overflow: "hidden",
  },
  kitProgressFill: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: "100%",
  },
  kitText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  kitChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kitChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#b8e4d0",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  kitChipText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
  },
  linkButton: {
    alignItems: "center",
    minHeight: 38,
    justifyContent: "center",
    paddingLeft: 10,
  },
  linkText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
  },
  listStack: {
    gap: 10,
  },
  pagingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCell: {
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 64,
    minWidth: "30%",
    padding: 12,
  },
  categoryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryCount: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
});
