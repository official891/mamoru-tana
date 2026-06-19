import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { ComponentType } from "react";
import { BellRing, Clock3, Crown, Lock, RefreshCw, Repeat2, ShieldCheck, Users } from "lucide-react-native";
import { freeItemLimit, plans, useAppState } from "@/src/app-state";
import { paidPlansUnavailableMessage } from "@/src/billing";
import { ActionButton, NoticeBar, Screen, SectionHeader } from "@/src/components";
import { dueReminderHourChoices, formatNotificationStatus } from "@/src/due-notifications";
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
    setDueNotificationHour,
    setDueNotificationOverdueFollowUp,
    setEasyMode,
    setNotice,
    syncDueNotifications,
  } = useAppState();
  const premiumNotificationLocked = !isPaidPlan;

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
              基本通知
            </Text>
            <Text selectable style={styles.notificationText}>
              Freeでも期限前に1回知らせます。
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
          {formatNotificationStatus(dueNotifications, isPaidPlan)}
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

        <View style={[styles.premiumNotificationBox, isPaidPlan ? styles.premiumNotificationBoxActive : null]}>
          <View style={styles.premiumNotificationHeader}>
            <View style={styles.premiumNotificationIcon}>
              <Crown color={colors.orange} size={22} strokeWidth={2.4} />
            </View>
            <View style={styles.premiumNotificationCopy}>
              <Text selectable style={styles.premiumNotificationTitle}>
                Plusの安心通知
              </Text>
              <Text selectable style={styles.premiumNotificationText}>
                前日・当日・期限切れ後もフォロー。時間も選べます。
              </Text>
            </View>
            <View style={[styles.premiumBadge, isPaidPlan ? styles.premiumBadgeActive : null]}>
              <Text style={[styles.premiumBadgeText, isPaidPlan ? styles.premiumBadgeTextActive : null]}>{isPaidPlan ? "利用中" : "Plus"}</Text>
            </View>
          </View>

          <View style={styles.premiumFeatureGrid}>
            <View style={styles.premiumFeatureCard}>
              <Clock3 color={isPaidPlan ? colors.blue : colors.muted} size={18} strokeWidth={2.4} />
              <Text selectable style={styles.premiumFeatureText}>
                前日・当日
              </Text>
            </View>
            <View style={styles.premiumFeatureCard}>
              <Repeat2 color={isPaidPlan ? colors.blue : colors.muted} size={18} strokeWidth={2.4} />
              <Text selectable style={styles.premiumFeatureText}>
                期限切れ後
              </Text>
            </View>
          </View>

          <View style={styles.hourButtonGrid}>
            {dueReminderHourChoices.map((hour) => {
              const selected = dueNotifications.reminderHour === hour;
              const disabled = premiumNotificationLocked || isSyncingDueNotifications;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  disabled={disabled}
                  key={hour}
                  onPress={() => setDueNotificationHour(hour)}
                  style={[styles.hourButton, selected ? styles.hourButtonActive : null, disabled ? styles.lockedControl : null]}
                >
                  <Text style={[styles.hourButtonText, selected ? styles.hourButtonTextActive : null]}>{hour}:00</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.premiumSwitchRow, premiumNotificationLocked ? styles.lockedControl : null]}>
            <View style={styles.premiumSwitchCopy}>
              <Text selectable style={styles.premiumSwitchTitle}>
                期限切れ後も知らせる
              </Text>
              <Text selectable style={styles.premiumSwitchText}>
                期限後3日までフォローします。
              </Text>
            </View>
            <Switch
              value={isPaidPlan && dueNotifications.overdueFollowUp}
              disabled={premiumNotificationLocked || isSyncingDueNotifications}
              onValueChange={setDueNotificationOverdueFollowUp}
              trackColor={{ false: colors.lineStrong, true: colors.orangeSoft }}
              thumbColor={isPaidPlan && dueNotifications.overdueFollowUp ? colors.orange : "#fff"}
            />
          </View>
          {premiumNotificationLocked ? (
            <Text selectable style={styles.helpText}>
              安心通知はPlus/Family接続後に使えます。基本通知はFreeのまま使えます。
            </Text>
          ) : null}
        </View>
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
              <FeatureCard icon={BellRing} title="安心通知" value={isPaidPlan ? "有効" : "Plus"} active={isPaidPlan} />
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
  premiumNotificationBox: {
    backgroundColor: colors.page,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  premiumNotificationBoxActive: {
    backgroundColor: colors.orangeSoft,
    borderColor: "#ffd58e",
  },
  premiumNotificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  premiumNotificationIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  premiumNotificationCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  premiumNotificationTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  premiumNotificationText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  premiumBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  premiumBadgeActive: {
    borderColor: "#ffd58e",
  },
  premiumBadgeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  premiumBadgeTextActive: {
    color: colors.orange,
  },
  premiumFeatureGrid: {
    flexDirection: "row",
    gap: 8,
  },
  premiumFeatureCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  premiumFeatureText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
  },
  hourButtonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hourButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    minWidth: 70,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  hourButtonActive: {
    backgroundColor: colors.blueSoft,
    borderColor: "#9bc9ff",
  },
  hourButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  hourButtonTextActive: {
    color: colors.blue,
  },
  premiumSwitchRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    padding: 12,
  },
  premiumSwitchCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  premiumSwitchTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  premiumSwitchText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  lockedControl: {
    opacity: 0.55,
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
    flexWrap: "wrap",
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
    minWidth: "46%",
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
