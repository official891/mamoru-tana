import { useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Bell, Briefcase, CheckCircle2, ChevronRight, Clock3, Plus } from "lucide-react-native";
import { daysUntil } from "@/src/date";
import { useAppState } from "@/src/app-state";
import { getEmergencyKitStatus, makeTemplateDraft } from "@/src/quick-add";
import type { QuickAddTemplate } from "@/src/quick-add";
import {
  EmptyState,
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
  const twoWeekItems = useMemo(
    () =>
      getHomeItems("all")
        .filter((item) => !item.done && daysUntil(item.dueDate) >= 0 && daysUntil(item.dueDate) <= 14)
        .slice(0, 5),
    [getHomeItems],
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

  const compactHome = width < 430;
  const tinyHome = width < 360;
  const stackSummary = width < 340;

  return (
    <Screen>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      <View style={styles.heroCard}>
        <View style={styles.heroCardText}>
          <Text selectable adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.heroTitle}>
            おかえりなさい
          </Text>
          <Text selectable style={styles.heroSub}>
            おうちストックを一緒に管理しよう
          </Text>
        </View>
        <Mascot mood={recallItems.length ? "search" : "clipboard"} size={compactHome ? 118 : 142} />
        <Pressable accessibilityLabel="今日の確認" accessibilityRole="button" onPress={() => setNotice("今日の確認をまとめました。")} style={styles.heroBellButton}>
          <Bell color={colors.ink} size={24} strokeWidth={2.3} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={styles.panel}>
        <SectionHeader title="状況サマリー" />
        <View style={[styles.summaryGrid, stackSummary ? styles.summaryGridStack : null]}>
          <SummaryCard title="近い期限" count={soonItems.length} icon={Clock3} tone="orange" />
          <SummaryCard title="安全チェック" count={recallItems.length} icon={AlertTriangle} tone="red" />
          <SummaryCard title="完了" count={doneItems.length} icon={CheckCircle2} tone="green" />
        </View>
      </View>

      <View style={styles.kitPanel}>
        <View style={styles.kitHeader}>
          <View style={styles.kitTitleLine}>
            <View style={styles.kitIcon}>
              <Briefcase color={colors.green} size={22} strokeWidth={2.4} />
            </View>
            <Text selectable style={styles.kitEyebrow}>
              防災キット
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/list")} style={styles.linkButton}>
            <Text style={styles.linkText}>詳細を見る</Text>
            <ChevronRight color={colors.blue} size={18} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={styles.kitBody}>
          <View style={styles.kitCopy}>
            <Text selectable adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.kitTitle}>
              基本セット <Text style={styles.kitTitleCount}>{emergencyKit.covered.length}</Text>/{emergencyKit.total}
            </Text>
            <View style={styles.kitProgressLine}>
              <View style={styles.kitProgressTrack}>
                <View style={[styles.kitProgressFill, { width: `${emergencyProgress}%` }]} />
              </View>
              <Text selectable style={styles.kitPercent}>
                {emergencyProgress}%
              </Text>
            </View>
          </View>
          <Mascot mood={emergencyKit.missing.length ? "clipboard" : "wave"} size={compactHome ? 76 : 92} />
        </View>
        <View style={styles.kitDivider} />
        <Text selectable style={styles.kitText}>
          {emergencyKit.missing.length ? "足りないものをすぐ追加できます" : "基本セットはそろっています。期限だけ見守りましょう。"}
        </Text>
        {emergencyKit.missing.length ? (
          <View style={styles.kitChipRow}>
            {emergencyKit.missing.slice(0, 4).map((template) => (
              <Pressable accessibilityRole="button" key={template.id} onPress={() => addEmergencyTemplate(template)} style={styles.kitChip}>
                <Plus color={colors.green} size={17} strokeWidth={2.8} />
                <Text style={styles.kitChipText}>{template.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <SectionHeader
          title="安全チェック"
          action={
            <Pressable accessibilityRole="button" onPress={() => router.push("/list")} style={styles.linkButton}>
              <Text style={styles.linkText}>すべて見る</Text>
              <ChevronRight color={colors.blue} size={18} strokeWidth={2.5} />
            </Pressable>
          }
        />
        <View style={styles.listStack}>
          {recallItems.slice(0, 2).map((item) => (
            <ItemRow key={item.id} item={item} actionLabel="確認する" onAction={() => clearRecall(item.id)} compact />
          ))}
          {!recallItems.length ? <EmptyState title="今すぐ確認するものはありません" detail="期限が近づくとここに表示されます。" /> : null}
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeader
          title="2週間の予定"
          action={
            <Pressable accessibilityRole="button" onPress={() => router.push("/schedule")} style={styles.linkButton}>
              <Text style={styles.linkText}>すべて見る</Text>
              <ChevronRight color={colors.blue} size={18} strokeWidth={2.5} />
            </Pressable>
          }
        />
        <View style={styles.listStack}>
          {twoWeekItems.slice(0, 2).map((item) => (
            <ItemRow key={item.id} item={item} compact />
          ))}
          {!twoWeekItems.length ? <EmptyState title="2週間以内の予定はありません" /> : null}
        </View>
      </View>

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
          <View style={[styles.onboardingSteps, tinyHome ? styles.onboardingStepsStack : null]}>
            {[
              { number: "1", title: "追加", text: "名前かテンプレで登録" },
              { number: "2", title: "期限", text: "日付を入れる" },
              { number: "3", title: "完了", text: "終わったら完了" },
            ].map((step) => (
              <View key={step.number} style={[styles.onboardingStep, tinyHome ? styles.onboardingStepStack : null]}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#f2dfc5",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 150,
    overflow: "hidden",
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 10,
  },
  heroCardText: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 90,
  },
  heroTiny: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 2,
  },
  heroIntro: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38,
  },
  heroTitleTiny: {
    fontSize: 20,
  },
  heroSub: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  heroBellButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 14,
    width: 46,
  },
  bellButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  bellButtonTiny: {
    alignSelf: "flex-end",
    height: 42,
    marginTop: -10,
    width: 42,
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
    gap: 12,
    padding: 12,
  },
  onboardingPanel: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: "#c9e2ff",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 12,
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
    flexDirection: "row",
    gap: 8,
  },
  onboardingStepsStack: {
    flexDirection: "column",
  },
  onboardingStep: {
    alignItems: "flex-start",
    backgroundColor: colors.blueSoft,
    borderColor: "#d6e9ff",
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    minHeight: 92,
    padding: 9,
  },
  onboardingStepStack: {
    alignItems: "center",
    flex: 0,
    flexDirection: "row",
    minHeight: 52,
  },
  onboardingStepBadge: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  onboardingStepBadgeText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
  },
  onboardingStepBody: {
    flex: 1,
    minWidth: 0,
  },
  onboardingStepTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  onboardingStepText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
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
    minHeight: 46,
    paddingHorizontal: 12,
  },
  onboardingSecondary: {
    alignItems: "center",
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
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
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  kitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  kitTitleLine: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  kitIcon: {
    alignItems: "center",
    backgroundColor: colors.greenSoft,
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  kitBody: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  kitCopy: {
    flex: 1,
    minWidth: 0,
  },
  kitEyebrow: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  kitTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 31,
  },
  kitTitleCount: {
    color: colors.green,
  },
  kitProgressLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  kitProgressTrack: {
    backgroundColor: colors.greenSoft,
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: "hidden",
  },
  kitProgressFill: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: "100%",
  },
  kitPercent: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 36,
  },
  kitDivider: {
    borderColor: colors.lineStrong,
    borderStyle: "dashed",
    borderTopWidth: 1,
  },
  kitText: {
    color: colors.ink,
    fontSize: 14,
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
    flexDirection: "row",
    gap: 5,
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
    flexDirection: "row",
    gap: 3,
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
