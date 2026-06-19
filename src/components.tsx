import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Pill,
  ShieldCheck,
  Utensils,
  X,
} from "lucide-react-native";
import { categoryMap } from "./data";
import { daysUntil, formatShortDate } from "./date";
import { statusLabel } from "./app-state";
import { catMascotImages } from "./mascot-assets";
import { colors, radius, shadows } from "./theme";
import type { CatMascotMood } from "./mascot-assets";
import type { Category, ShelfItem } from "./types";

type IconComponent = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

export type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

type Tone = "blue" | "orange" | "red" | "green" | "yellow" | "gray";

const toneColors: Record<Tone, { bg: string; fg: string; soft: string; border: string }> = {
  blue: { bg: colors.blue, fg: colors.blue, soft: colors.blueSoft, border: "#c9e2ff" },
  orange: { bg: colors.orange, fg: colors.orange, soft: colors.orangeSoft, border: "#ffdba3" },
  red: { bg: colors.red, fg: colors.red, soft: colors.redSoft, border: "#ffcdd3" },
  green: { bg: colors.green, fg: colors.green, soft: colors.greenSoft, border: "#c5eddc" },
  yellow: { bg: "#b98500", fg: "#b98500", soft: colors.yellowSoft, border: "#ffe08a" },
  gray: { bg: colors.muted, fg: colors.muted, soft: "#f1f3f6", border: colors.lineStrong },
};

export function Screen({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 18, 56);
  const bottomPadding = Math.max(insets.bottom + 118, 136);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.screenContent, { paddingTop: topPadding, paddingBottom: bottomPadding }, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}

export function NoticeBar({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;

  return (
    <View style={styles.notice}>
      <Text selectable style={styles.noticeText}>
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10} style={styles.noticeClose}>
        <X color={colors.blue} size={18} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={styles.sectionTitle}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function SummaryCard({
  title,
  count,
  icon: Icon,
  tone,
}: {
  title: string;
  count: number;
  icon: IconComponent;
  tone: Tone;
}) {
  const { width } = useWindowDimensions();
  const palette = toneColors[tone];
  const compact = width < 430;

  return (
    <View style={[styles.summaryCard, compact ? styles.summaryCardCompact : null, { backgroundColor: palette.soft, borderColor: palette.border }]}>
      <View style={styles.summaryTop}>
        <View style={[styles.roundIcon, compact ? styles.roundIconCompact : null, { backgroundColor: palette.bg }]}>
          <Icon color="#fff" size={compact ? 14 : 16} strokeWidth={2.6} />
        </View>
        <Text selectable adjustsFontSizeToFit minimumFontScale={0.76} style={[styles.summaryTitle, compact ? styles.summaryTitleCompact : null]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text selectable style={[styles.summaryCount, compact ? styles.summaryCountCompact : null, { color: palette.fg }]}>
        {count}
        <Text style={[styles.summaryUnit, compact ? styles.summaryUnitCompact : null]}>件</Text>
      </Text>
    </View>
  );
}

export function FilterTabs({
  options,
  active,
  onChange,
}: {
  options: FilterOption[];
  active: string;
  onChange: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const narrow = width < 340;

  return (
    <View style={[styles.filterWrap, narrow ? styles.filterWrapNarrow : null]}>
      {options.map((option) => {
        const selected = active === option.id;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.filterButton, narrow ? styles.filterButtonNarrow : null, selected ? styles.filterButtonActive : null]}
          >
            <Text selectable style={[styles.filterText, selected ? styles.filterTextActive : null]} numberOfLines={1}>
              {option.label}
              {typeof option.count === "number" ? `（${option.count}）` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  const meta = categoryMap.get(category);
  return (
    <View style={styles.categoryBadge}>
      <CategoryIcon category={category} size={16} />
      <Text selectable style={styles.categoryBadgeText}>
        {meta?.shortLabel ?? "他"}
      </Text>
    </View>
  );
}

export function CategoryIcon({ category, size = 22 }: { category: Category; size?: number }) {
  const iconColor = iconColorForCategory(category);
  const Icon = iconForCategory(category);

  return (
    <View style={[styles.itemIcon, { width: size + 22, height: size + 22, backgroundColor: iconSoftForCategory(category) }]}>
      <Icon color={iconColor} size={size} strokeWidth={2.25} />
    </View>
  );
}

export function ItemRow({
  item,
  actionLabel,
  onAction,
  onPress,
  compact = false,
}: {
  item: ShelfItem;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
  compact?: boolean;
}) {
  const { width } = useWindowDimensions();
  const palette = statusPalette(item);
  const Wrapper = onPress ? Pressable : View;
  const narrow = width < 370;

  return (
    <Wrapper
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={[styles.itemRow, compact ? styles.itemRowCompact : null, narrow ? styles.itemRowNarrow : null]}
    >
      <CategoryIcon category={item.category} />
      <View style={styles.itemBody}>
        <Text selectable style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.itemMetaLine}>
          <Text selectable style={styles.itemMeta} numberOfLines={1}>
            {categoryMap.get(item.category)?.label ?? "その他"}
          </Text>
          <Text style={styles.metaDot}>・</Text>
          <Text selectable style={styles.itemMeta} numberOfLines={1}>
            {formatShortDate(item.dueDate)}
          </Text>
        </View>
      </View>
      <View style={[styles.rowRight, narrow ? styles.rowRightNarrow : null]}>
        <View style={[styles.statusPill, { backgroundColor: palette.soft, borderColor: palette.border }]}>
          <Text selectable style={[styles.statusText, { color: palette.fg }]} numberOfLines={1}>
            {statusLabel(item)}
          </Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={[styles.inlineButton, { borderColor: palette.fg }]}>
            <Text style={[styles.inlineButtonText, { color: palette.fg }]} numberOfLines={1}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <ChevronRight color={colors.muted} size={21} strokeWidth={2.25} />
        )}
      </View>
    </Wrapper>
  );
}

export function CollapsibleRow({
  title,
  icon: Icon,
  open,
  onPress,
  children,
}: {
  title: string;
  icon: IconComponent;
  open: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.collapsible}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.collapsibleHeader}>
        <Icon color={colors.blue} size={21} strokeWidth={2.3} />
        <Text selectable style={styles.collapsibleTitle}>
          {title}
        </Text>
        <ChevronDown color={colors.ink} size={22} strokeWidth={2.3} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
      </Pressable>
      {open ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  icon: Icon,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const isPrimary = variant === "primary";
  const color = variant === "danger" ? colors.red : colors.blue;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        isPrimary ? { backgroundColor: color, borderColor: color } : { backgroundColor: colors.surface, borderColor: color },
        disabled ? styles.disabled : null,
      ]}
    >
      {Icon ? <Icon color={isPrimary ? "#fff" : color} size={18} strokeWidth={2.4} /> : null}
      <Text style={[styles.actionButtonText, { color: isPrimary ? "#fff" : color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.empty}>
      <CheckCircle2 color={colors.green} size={30} strokeWidth={2.3} />
      <Text selectable style={styles.emptyTitle}>
        {title}
      </Text>
      {detail ? (
        <Text selectable style={styles.emptyDetail}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export function Mascot({ mood = "wave", size = 96 }: { mood?: CatMascotMood; size?: number }) {
  return (
    <View style={[styles.mascotWrap, { height: size, width: size }]} accessibilityLabel="まもる棚の案内ねこ">
      <Image accessibilityIgnoresInvertColors resizeMode="contain" source={catMascotImages[mood]} style={styles.mascotImage} />
    </View>
  );
}

function iconForCategory(category: Category): IconComponent {
  if (category === "food") return Utensils;
  if (category === "warranty") return ShieldCheck;
  if (category === "document") return FileText;
  if (category === "emergency") return Package;
  if (category === "health") return Pill;
  return Archive;
}

function iconColorForCategory(category: Category) {
  if (category === "food") return colors.green;
  if (category === "warranty") return colors.blue;
  if (category === "document") return "#b98500";
  if (category === "emergency") return colors.orange;
  if (category === "health") return "#2f9b69";
  return colors.muted;
}

function iconSoftForCategory(category: Category) {
  if (category === "food") return colors.greenSoft;
  if (category === "warranty") return colors.blueSoft;
  if (category === "document") return colors.yellowSoft;
  if (category === "emergency") return colors.orangeSoft;
  if (category === "health") return "#e7f8ee";
  return "#f1f3f6";
}

function statusPalette(item: ShelfItem) {
  const days = daysUntil(item.dueDate);
  if (item.done) return toneColors.green;
  if (item.recallStatus !== "clear") return toneColors.red;
  if (days <= 3) return toneColors.orange;
  if (days <= 7) return toneColors.yellow;
  return toneColors.blue;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  screenContent: {
    paddingLeft: 18,
    paddingRight: 18,
    rowGap: 14,
  },
  notice: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderColor: "#c9e2ff",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  noticeClose: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "800",
  },
  summaryCard: {
    ...shadows.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 106,
    padding: 14,
  },
  summaryCardCompact: {
    minHeight: 88,
    padding: 11,
  },
  summaryTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  roundIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  roundIconCompact: {
    height: 24,
    width: 24,
  },
  summaryTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryTitleCompact: {
    fontSize: 12,
  },
  summaryCount: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 10,
    textAlign: "center",
  },
  summaryCountCompact: {
    fontSize: 31,
    marginTop: 8,
  },
  summaryUnit: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryUnitCompact: {
    fontSize: 15,
  },
  filterWrap: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 8,
  },
  filterWrapNarrow: {
    flexDirection: "column",
  },
  filterButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 126,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterButtonNarrow: {
    alignSelf: "stretch",
    flexBasis: "auto",
    width: "100%",
  },
  filterButtonActive: {
    backgroundColor: colors.orangeSoft,
    borderColor: "#ffd58e",
  },
  filterText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  filterTextActive: {
    color: "#b96f08",
  },
  categoryBadge: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingLeft: 6,
    paddingRight: 10,
  },
  categoryBadgeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  itemIcon: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
  },
  itemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemRowNarrow: {
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  itemRowCompact: {
    minHeight: 68,
  },
  itemBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  itemName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  itemMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  metaDot: {
    color: colors.muted,
    fontSize: 13,
    marginHorizontal: 2,
  },
  rowRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  rowRightNarrow: {
    flexBasis: "100%",
    paddingLeft: 56,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 62,
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
  },
  inlineButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inlineButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  collapsible: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  collapsibleHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 18,
  },
  collapsibleTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  collapsibleBody: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 10,
    padding: 14,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
    minHeight: 128,
    justifyContent: "center",
    padding: 22,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDetail: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  mascotImage: {
    height: "100%",
    width: "100%",
  },
});
