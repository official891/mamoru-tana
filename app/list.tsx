import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Plus, Search } from "lucide-react-native";
import { useAppState } from "@/src/app-state";
import { categories } from "@/src/data";
import { addDays } from "@/src/date";
import { itemTextLimits } from "@/src/item-data";
import { ActionButton, CategoryIcon, EmptyState, ItemRow, NoticeBar, Screen, SectionHeader } from "@/src/components";
import { EasyHome } from "@/src/easy-home";
import { colors, radius, shadows } from "@/src/theme";
import type { Category } from "@/src/types";

type CategoryFilter = "all" | Category;

const datePresets = [
  { label: "今日", days: 0 },
  { label: "7日", days: 7 },
  { label: "30日", days: 30 },
  { label: "90日", days: 90 },
];

export default function ListScreen() {
  const { addItem, canAddMore, clearRecall, draftTemplate, filterItems, isEasyMode, notice, remainingFreeItems, setNotice, toggleDone } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [draft, setDraft] = useState({ ...draftTemplate, dueDate: addDays(7) });

  const results = useMemo(() => {
    return filterItems(query).filter((item) => category === "all" || item.category === category);
  }, [category, filterItems, query]);

  function submit() {
    const saved = addItem(draft);
    if (saved) {
      setDraft({ ...draftTemplate, dueDate: addDays(7) });
    }
  }

  if (isEasyMode) {
    return <EasyHome />;
  }

  return (
    <Screen>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      <View style={styles.header}>
        <View>
          <Text selectable style={styles.title}>
            一覧
          </Text>
          <Text selectable style={styles.subTitle}>
            Free残り {remainingFreeItems}件
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search color={colors.muted} size={21} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="名前・場所・メモで検索"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <View style={styles.categoryRow}>
        <Pressable accessibilityRole="button" onPress={() => setCategory("all")} style={[styles.categoryChip, category === "all" ? styles.categoryChipActive : null]}>
          <Text style={[styles.categoryChipText, category === "all" ? styles.categoryChipTextActive : null]}>すべて</Text>
        </Pressable>
        {categories.map((entry) => (
          <Pressable
            accessibilityRole="button"
            key={entry.id}
            onPress={() => setCategory(entry.id)}
            style={[styles.categoryChip, category === entry.id ? styles.categoryChipActive : null]}
          >
            <CategoryIcon category={entry.id} size={15} />
            <Text style={[styles.categoryChipText, category === entry.id ? styles.categoryChipTextActive : null]}>{entry.shortLabel}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.formCard}>
        <SectionHeader title="新しく追加" />
        <View style={styles.inputStack}>
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
            placeholder="アイテム名"
            placeholderTextColor={colors.muted}
            maxLength={itemTextLimits.name}
            style={styles.input}
          />
          <TextInput
            value={draft.place}
            onChangeText={(place) => setDraft((current) => ({ ...current, place }))}
            placeholder="置き場所"
            placeholderTextColor={colors.muted}
            maxLength={itemTextLimits.place}
            style={styles.input}
          />
          <View style={styles.doubleRow}>
            <TextInput
              value={draft.dueDate}
              onChangeText={(dueDate) => setDraft((current) => ({ ...current, dueDate }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={[styles.input, styles.flexInput]}
            />
            <TextInput
              value={String(draft.reminderDays)}
              onChangeText={(value) => setDraft((current) => ({ ...current, reminderDays: Number(value.replace(/\D/g, "")) || 1 }))}
              keyboardType="number-pad"
              placeholder="通知日数"
              placeholderTextColor={colors.muted}
              maxLength={4}
              style={[styles.input, styles.smallInput]}
            />
          </View>
          <View style={styles.datePresetRow}>
            {datePresets.map((preset) => (
              <Pressable
                accessibilityRole="button"
                key={preset.label}
                onPress={() => setDraft((current) => ({ ...current, dueDate: addDays(preset.days) }))}
                style={styles.datePresetButton}
              >
                <Text style={styles.datePresetText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text selectable style={styles.inputHelp}>
            期限は YYYY-MM-DD 形式。迷ったら上のボタンで選べます。
          </Text>
          <View style={styles.categoryPicker}>
            {categories.map((entry) => (
              <Pressable
                accessibilityRole="button"
                key={entry.id}
                onPress={() => setDraft((current) => ({ ...current, category: entry.id }))}
                style={[styles.pickChip, draft.category === entry.id ? styles.pickChipActive : null]}
              >
                <Text style={[styles.pickChipText, draft.category === entry.id ? styles.pickChipTextActive : null]}>{entry.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={draft.notes}
            onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
            placeholder="メモ"
            placeholderTextColor={colors.muted}
            maxLength={itemTextLimits.notes}
            style={[styles.input, styles.memoInput]}
            multiline
          />
          <View style={styles.switchRow}>
            <View>
              <Text selectable style={styles.switchTitle}>
                安全チェック
              </Text>
              <Text selectable style={styles.switchMeta}>
                安全チェックに出す
              </Text>
            </View>
            <Switch
              value={draft.recallWatch}
              onValueChange={(recallWatch) => setDraft((current) => ({ ...current, recallWatch }))}
              trackColor={{ false: colors.lineStrong, true: colors.redSoft }}
              thumbColor={draft.recallWatch ? colors.red : "#fff"}
            />
          </View>
        </View>
        <ActionButton label={canAddMore ? "追加する" : "Plusで追加"} icon={Plus} onPress={submit} />
      </View>

      <View style={styles.listPanel}>
        <SectionHeader title={`アイテム（${results.length}件）`} />
        <View style={styles.itemStack}>
          {results.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              actionLabel={item.recallStatus !== "clear" ? "確認" : item.done ? "戻す" : "完了"}
              onAction={item.recallStatus !== "clear" ? () => clearRecall(item.id) : () => toggleDone(item.id)}
            />
          ))}
          {!results.length ? <EmptyState title="該当するアイテムはありません" detail="条件を変えると表示されます。" /> : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  searchBox: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    minHeight: 50,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 11,
  },
  categoryChipActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#c9e2ff",
  },
  categoryChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryChipTextActive: {
    color: colors.blue,
  },
  formCard: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  inputStack: {
    gap: 10,
  },
  input: {
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  doubleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  flexInput: {
    flex: 1,
    minWidth: 165,
  },
  smallInput: {
    flexBasis: 118,
    flexGrow: 1,
  },
  datePresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  datePresetButton: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderColor: "#c9e2ff",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  datePresetText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
  },
  inputHelp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  categoryPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  pickChipActive: {
    backgroundColor: colors.orangeSoft,
    borderColor: "#ffd58e",
  },
  pickChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  pickChipTextActive: {
    color: "#b96f08",
  },
  memoInput: {
    minHeight: 78,
    paddingTop: 13,
    textAlignVertical: "top",
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 62,
    paddingHorizontal: 14,
  },
  switchTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  switchMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  listPanel: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  itemStack: {
    gap: 10,
  },
});
