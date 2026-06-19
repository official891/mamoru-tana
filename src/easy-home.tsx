import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react-native";
import { useAppState } from "./app-state";
import { categoryMap } from "./data";
import { daysUntil } from "./date";
import { CategoryIcon, Mascot, NoticeBar, Screen } from "./components";
import { colors, radius, shadows } from "./theme";
import type { ShelfItem } from "./types";

export function EasyHome() {
  const { width } = useWindowDimensions();
  const { clearRecall, notice, recallItems, setNotice, soonItems, toggleDone } = useAppState();
  const [adultItemId, setAdultItemId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return [...recallItems, ...soonItems].filter((item) => {
      if (seen.has(item.id) || item.done) return false;
      seen.add(item.id);
      return true;
    });
  }, [recallItems, soonItems]);

  const adultItem = useMemo(() => tasks.find((item) => item.id === adultItemId) ?? null, [adultItemId, tasks]);
  const safetyCount = tasks.filter((item) => item.recallStatus !== "clear").length;
  const compact = width < 430;
  const tiny = width < 360;
  const stackCounts = width < 360;

  return (
    <Screen contentStyle={styles.screenContent}>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      <View style={styles.hero}>
        <Mascot mood={safetyCount ? "boxWarning" : "wave"} size={compact ? 82 : 100} />
        <View style={styles.heroCopy}>
          <Text selectable style={styles.eyebrow}>
            かんたんモード
          </Text>
          <Text selectable adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.title, tiny ? styles.titleTiny : null]}>
            きょうやること
          </Text>
        </View>
      </View>

      <View style={[styles.countRow, stackCounts ? styles.countRowStack : null]}>
        <View style={[styles.countCard, compact ? styles.countCardCompact : null, styles.countCardOrange]}>
          <Clock3 color={colors.orange} size={compact ? 24 : 28} strokeWidth={2.5} />
          <Text selectable style={[styles.countValue, compact ? styles.countValueCompact : null]}>
            {tasks.length}
          </Text>
          <Text selectable style={styles.countLabel}>
            やること
          </Text>
        </View>
        <View style={[styles.countCard, compact ? styles.countCardCompact : null, styles.countCardRed]}>
          <AlertTriangle color={colors.red} size={compact ? 24 : 28} strokeWidth={2.5} />
          <Text selectable style={[styles.countValue, compact ? styles.countValueCompact : null]}>
            {safetyCount}
          </Text>
          <Text selectable style={styles.countLabel}>
            おとなとみる
          </Text>
        </View>
      </View>

      <View style={styles.ruleCard}>
        <Mascot mood="search" size={compact ? 58 : 72} />
        <Text selectable style={styles.ruleText}>
          あかいカードは おとなの人に みせる
        </Text>
      </View>

      <View style={styles.taskStack}>
        {tasks.length ? (
          tasks.slice(0, 8).map((item) => (
            <EasyTaskCard
              item={item}
              key={item.id}
              onDone={() => toggleDone(item.id)}
              onShowAdult={() => {
                setNotice("");
                setAdultItemId(item.id);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <CheckCircle2 color={colors.green} size={42} strokeWidth={2.4} />
            <Text selectable style={styles.emptyTitle}>
              きょうは だいじょうぶ
            </Text>
            <Text selectable style={styles.emptyText}>
              やることが あると ここにでます
            </Text>
          </View>
        )}
      </View>

      <AdultCheckModal
        item={adultItem}
        onClose={() => setAdultItemId(null)}
        onConfirm={() => {
          if (!adultItem) return;
          clearRecall(adultItem.id);
          setAdultItemId(null);
          setNotice("大人の確認が終わりました。");
        }}
      />
    </Screen>
  );
}

function EasyTaskCard({
  item,
  onDone,
  onShowAdult,
}: {
  item: ShelfItem;
  onDone: () => void;
  onShowAdult: () => void;
}) {
  const needsAdult = item.recallStatus !== "clear";

  return (
    <View style={[styles.taskCard, needsAdult ? styles.taskCardAlert : styles.taskCardNormal]}>
      <View style={styles.taskTop}>
        <CategoryIcon category={item.category} size={28} />
        <View style={styles.taskBody}>
          <Text selectable style={styles.taskName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text selectable style={[styles.taskHint, needsAdult ? styles.taskHintAlert : null]}>
            {needsAdult ? "おとなとみる" : easyDueLabel(item.dueDate)}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={needsAdult ? `${item.name}を大人に見せる` : `${item.name}をできたにする`}
        accessibilityHint={needsAdult ? "大人向けの確認画面を開きます。" : "このカードを完了にします。"}
        onPress={needsAdult ? onShowAdult : onDone}
        style={({ pressed }) => [styles.bigButton, needsAdult ? styles.bigButtonAlert : styles.bigButtonDone, pressed ? styles.buttonPressed : null]}
      >
        <Text style={styles.bigButtonText}>{needsAdult ? "みせる" : "できた"}</Text>
      </Pressable>
    </View>
  );
}

function AdultCheckModal({ item, onClose, onConfirm }: { item: ShelfItem | null; onClose: () => void; onConfirm: () => void }) {
  if (!item) return null;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.adultSheet}>
          <View style={styles.adultMascotWrap}>
            <Mascot mood="alert" size={104} />
          </View>
          <Text selectable style={styles.adultTitle}>
            おとなの人へ
          </Text>
          <Text selectable style={styles.adultText}>
            このカードは安全チェックが必要です。問題ないことを確認したら、下のボタンを長押ししてください。
          </Text>

          <View style={styles.adultItemBox}>
            <CategoryIcon category={item.category} size={28} />
            <View style={styles.adultItemCopy}>
              <Text selectable style={styles.adultItemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text selectable style={styles.adultItemMeta}>
                {categoryMap.get(item.category)?.label ?? "その他"}・{easyDueLabel(item.dueDate)}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="長押しすると安全チェックを完了します。"
            delayLongPress={900}
            onLongPress={onConfirm}
            style={({ pressed }) => [styles.adultConfirmButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.adultConfirmText}>大人が長押しで確認</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.adultCancelButton, pressed ? styles.buttonPressed : null]}>
            <Text style={styles.adultCancelText}>もどる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function easyDueLabel(dateValue: string) {
  const days = daysUntil(dateValue);
  if (!Number.isFinite(days)) return "ひづけをみる";
  if (days < 0) return `${Math.abs(days)}にちすぎ`;
  if (days === 0) return "きょう";
  if (days === 1) return "あした";
  return `あと${days}にち`;
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 18,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 112,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 38,
  },
  titleTiny: {
    fontSize: 24,
    lineHeight: 30,
  },
  countRow: {
    flexDirection: "row",
    gap: 12,
  },
  countRowStack: {
    flexDirection: "column",
  },
  countCard: {
    ...shadows.card,
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 136,
    justifyContent: "center",
    padding: 16,
  },
  countCardCompact: {
    minHeight: 114,
    padding: 13,
  },
  countCardOrange: {
    backgroundColor: colors.orangeSoft,
    borderColor: "#ffdba3",
  },
  countCardRed: {
    backgroundColor: colors.redSoft,
    borderColor: "#ffcdd3",
  },
  countValue: {
    color: colors.ink,
    fontSize: 44,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
  },
  countValueCompact: {
    fontSize: 38,
  },
  countLabel: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "900",
  },
  ruleCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  ruleText: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 26,
  },
  taskStack: {
    gap: 14,
  },
  taskCard: {
    ...shadows.card,
    borderRadius: radius.xl,
    borderWidth: 2,
    gap: 16,
    padding: 18,
  },
  taskCardNormal: {
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
  },
  taskCardAlert: {
    backgroundColor: colors.redSoft,
    borderColor: "#ffc1c9",
  },
  taskTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  taskBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  taskName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29,
  },
  taskHint: {
    color: colors.orange,
    fontSize: 19,
    fontWeight: "900",
  },
  taskHintAlert: {
    color: colors.red,
  },
  bigButton: {
    alignItems: "center",
    borderRadius: 18,
    minHeight: 62,
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  bigButtonDone: {
    backgroundColor: colors.green,
  },
  bigButtonAlert: {
    backgroundColor: colors.red,
  },
  bigButtonText: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "900",
  },
  emptyCard: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.greenSoft,
    borderColor: "#c5eddc",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 10,
    minHeight: 220,
    justifyContent: "center",
    padding: 22,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(24, 34, 51, 0.48)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  adultSheet: {
    ...shadows.card,
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: "#ffc1c9",
    borderRadius: radius.xl,
    borderWidth: 2,
    gap: 14,
    maxWidth: 520,
    padding: 20,
    width: "100%",
  },
  adultMascotWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  adultTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  adultText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 25,
    textAlign: "center",
  },
  adultItemBox: {
    alignItems: "center",
    backgroundColor: colors.redSoft,
    borderColor: "#ffc1c9",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 14,
  },
  adultItemCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  adultItemName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  adultItemMeta: {
    color: colors.red,
    fontSize: 15,
    fontWeight: "900",
  },
  adultConfirmButton: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 18,
    minHeight: 62,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  adultConfirmText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  adultCancelButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  adultCancelText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
});
