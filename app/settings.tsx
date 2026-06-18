import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { ComponentType } from "react";
import { BellRing, Crown, Lock, RefreshCw, ShieldCheck, Users } from "lucide-react-native";
import { freeItemLimit, plans, useAppState } from "@/src/app-state";
import { paidPlansUnavailableMessage } from "@/src/billing";
import { ActionButton, NoticeBar, Screen, SectionHeader } from "@/src/components";
import { formatNotificationStatus } from "@/src/due-notifications";
import { colors, radius, shadows } from "@/src/theme";
import type { PlanId } from "@/src/app-state";

export default function SettingsScreen() {
  const {
    arePaidPlansEnabled,
    activeItems,
    choosePlan,
    currentPlan,
    disableDueNotifications,
    dueNotifications,
    enableDueNotifications,
    isEasyMode,
    isFamilyPlan,
    isPaidPlan,
    isSyncingDueNotifications,
    notice,
    plan,
    setEasyMode,
    setNotice,
    syncDueNotifications,
  } = useAppState();

  return (
    <Screen>
      <NoticeBar message={notice} onClose={() => setNotice("")} />

      <View style={styles.header}>
        <Text selectable style={styles.title}>
          設定
        </Text>
        <Text selectable style={styles.subTitle}>
          現在のプラン：{currentPlan.name}
        </Text>
      </View>

      <View style={styles.currentCard}>
        <View style={styles.currentIcon}>
          <Crown color={colors.orange} size={26} strokeWidth={2.3} />
        </View>
        <View style={styles.currentBody}>
          <Text selectable style={styles.currentTitle}>
            {currentPlan.name}
          </Text>
          <Text selectable style={styles.currentMeta}>
            {currentPlan.price}・{currentPlan.limitLabel}
          </Text>
        </View>
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>利用中</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeader title="期限通知" />
        <View style={styles.notificationRow}>
          <View style={styles.notificationIcon}>
            <BellRing color={colors.blue} size={25} strokeWidth={2.4} />
          </View>
          <View style={styles.notificationCopy}>
            <Text selectable style={styles.notificationTitle}>
              期限が近い日に知らせる
            </Text>
            <Text selectable style={styles.notificationText}>
              各アイテムの通知日数に合わせて、朝9時に端末通知を予約します。
            </Text>
          </View>
          <Switch
            value={dueNotifications.enabled}
            disabled={isSyncingDueNotifications}
            onValueChange={(enabled) => {
              if (enabled) {
                void enableDueNotifications();
              } else {
                void disableDueNotifications();
              }
            }}
            trackColor={{ false: colors.lineStrong, true: colors.blueSoft }}
            thumbColor={dueNotifications.enabled ? colors.blue : "#fff"}
          />
        </View>
        <Text selectable style={styles.helpText}>
          {formatNotificationStatus(dueNotifications)}
        </Text>
        {dueNotifications.lastError ? (
          <Text selectable style={styles.warningText}>
            {dueNotifications.lastError}
          </Text>
        ) : null}
        <ActionButton
          label={isSyncingDueNotifications ? "再設定中" : "通知を再設定"}
          icon={RefreshCw}
          onPress={() => {
            void syncDueNotifications();
          }}
          variant="secondary"
          disabled={!dueNotifications.enabled || isSyncingDueNotifications}
        />
      </View>

      <View style={styles.panel}>
        <SectionHeader title="かんたんモード" />
        {isEasyMode ? (
          <Pressable accessibilityRole="button" delayLongPress={900} onLongPress={() => setEasyMode(false)} style={styles.easyModeRow}>
            <Lock color={colors.green} size={25} strokeWidth={2.4} />
            <View style={styles.easyModeCopy}>
              <Text selectable style={styles.easyModeTitle}>
                こども向けホーム中
              </Text>
              <Text selectable style={styles.easyModeText}>
                通常モードに戻すには大人がここを長押し
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.easyModeRow}>
            <View style={styles.easyModeCopy}>
              <Text selectable style={styles.easyModeTitle}>
                こども向けホーム
              </Text>
              <Text selectable style={styles.easyModeText}>
                大きなカードと短い言葉だけにします
              </Text>
            </View>
            <Switch
              value={isEasyMode}
              onValueChange={setEasyMode}
              trackColor={{ false: colors.lineStrong, true: colors.greenSoft }}
              thumbColor={isEasyMode ? colors.green : "#fff"}
            />
          </View>
        )}
      </View>

      {isEasyMode ? (
        <View style={styles.noteCard}>
          <Text selectable style={styles.noteTitle}>
            大人用の設定はロック中
          </Text>
          <Text selectable style={styles.noteText}>
            プラン変更は通常モードで操作できます。
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.panel}>
            <SectionHeader title="プラン" />
            <View style={styles.planStack}>
              {plans.map((entry) => (
                <PlanCard key={entry.id} id={entry.id} selected={plan === entry.id} disabled={entry.id !== "free" && !arePaidPlansEnabled} onPress={() => choosePlan(entry.id)} />
              ))}
            </View>
            {!arePaidPlansEnabled ? (
              <Text selectable style={styles.helpText}>
                {paidPlansUnavailableMessage}
              </Text>
            ) : null}
          </View>

          <View style={styles.panel}>
            <SectionHeader title="機能" />
            <View style={styles.featureGrid}>
              <FeatureCard icon={ShieldCheck} title="未完了枠" value={isPaidPlan ? "無制限" : `${activeItems.length}/${freeItemLimit}`} active={isPaidPlan} />
              <FeatureCard icon={Users} title="家族共有" value={isFamilyPlan ? "有効" : "準備中"} active={isFamilyPlan} />
            </View>
          </View>
        </>
      )}

      <View style={styles.noteCard}>
        <Text selectable style={styles.noteTitle}>
          プライバシーとストア申告
        </Text>
        <Text selectable style={styles.noteText}>
          現在は外部送信なし、アカウントなし、カメラ・位置情報なし、端末内保存のみです。バーコード読み取りや家族同期を追加する場合は、App Storeのプライバシー情報とGoogle PlayのData safety申告を更新してください。
        </Text>
      </View>

      <View style={styles.noteCard}>
        <Text selectable style={styles.noteTitle}>
          無料公開モード
        </Text>
        <Text selectable style={styles.noteText}>
          決済はまだ接続していないため、Plus/Familyは有効化できません。App Store / Google Playの商品作成後にアプリ内課金へ接続します。
        </Text>
      </View>
    </Screen>
  );
}

function PlanCard({ id, selected, disabled, onPress }: { id: PlanId; selected: boolean; disabled: boolean; onPress: () => void }) {
  const plan = plans.find((entry) => entry.id === id) ?? plans[0];

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }} onPress={onPress} style={[styles.planCard, selected ? styles.planCardActive : null, disabled ? styles.planCardDisabled : null]}>
      <View style={styles.planHeader}>
        <View>
          <Text selectable style={styles.planName}>
            {plan.name}
          </Text>
          <Text selectable style={styles.planDescription}>
            {plan.description}
          </Text>
        </View>
        <Text selectable style={styles.planPrice}>
          {disabled ? "準備中" : plan.price}
        </Text>
      </View>
      <View style={styles.featureRow}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.planFeature}>
            <Text style={styles.planFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  value,
  active,
}: {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  title: string;
  value: string;
  active: boolean;
}) {
  return (
    <View style={[styles.featureCard, active ? styles.featureCardActive : null]}>
      <Icon color={active ? colors.blue : colors.muted} size={23} strokeWidth={2.3} />
      <Text selectable style={styles.featureTitle}>
        {title}
      </Text>
      <Text selectable style={[styles.featureValue, active ? styles.featureValueActive : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
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
  },
  currentCard: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.orangeSoft,
    borderColor: "#ffd58e",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    minHeight: 94,
    padding: 16,
  },
  currentIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  currentBody: {
    flex: 1,
    minWidth: 0,
  },
  currentTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  currentMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  currentBadge: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentBadgeText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900",
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
  notificationRow: {
    alignItems: "center",
    backgroundColor: colors.blueSoft,
    borderColor: "#c9e2ff",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    minHeight: 88,
    padding: 14,
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 15,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  notificationTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  notificationText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  easyModeRow: {
    alignItems: "center",
    backgroundColor: colors.greenSoft,
    borderColor: "#c5eddc",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 82,
    padding: 14,
  },
  easyModeCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  easyModeTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  easyModeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  planStack: {
    gap: 10,
  },
  planCard: {
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  planCardActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#9bc9ff",
  },
  planCardDisabled: {
    opacity: 0.72,
  },
  planHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  planName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  planDescription: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
    maxWidth: 190,
  },
  planPrice: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  planFeature: {
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  planFeatureText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  featureGrid: {
    flexDirection: "row",
    gap: 10,
  },
  featureCard: {
    alignItems: "flex-start",
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    minHeight: 104,
    padding: 14,
  },
  featureCardActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#c9e2ff",
  },
  featureTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  featureValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  featureValueActive: {
    color: colors.blue,
  },
  helpText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  warningText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
  },
  noteTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  noteText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
});
