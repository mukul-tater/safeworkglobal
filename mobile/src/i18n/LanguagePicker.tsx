import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, Languages } from 'lucide-react-native';
import { APP_LOCALES, localeLabel, type AppLocale } from './locales';
import { useI18n } from './LocaleContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type LanguagePickerProps = {
  compact?: boolean;
};

export default function LanguagePicker({ compact }: LanguagePickerProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  const select = (value: AppLocale) => {
    setLocale(value);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lang.aria')}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, compact && styles.triggerCompact, pressed && styles.triggerPressed]}
      >
        <Languages size={compact ? 14 : 16} color={colors.mutedForeground} />
        <Text numberOfLines={1} style={[styles.triggerText, compact && styles.triggerTextCompact]}>
          {localeLabel(locale)}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('lang.pickerTitle')}</Text>
            <ScrollView style={styles.list} bounces={false}>
              {APP_LOCALES.map((option) => {
                const selected = option.value === locale;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => select(option.value)}
                    style={({ pressed }) => [
                      styles.item,
                      selected && styles.itemSelected,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <View style={styles.checkSlot}>
                      {selected ? <Check size={16} color={colors.primary} strokeWidth={3} /> : null}
                    </View>
                    <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxWidth: 148,
  },
  triggerCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 128,
  },
  triggerPressed: { opacity: 0.85 },
  triggerText: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.foreground,
    flexShrink: 1,
  },
  triggerTextCompact: { fontSize: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.mutedForeground,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { paddingBottom: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  itemSelected: { backgroundColor: colors.primaryTint },
  itemPressed: { backgroundColor: colors.primaryTint },
  checkSlot: { width: 20, alignItems: 'center' },
  itemLabel: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: '500',
  },
  itemLabelSelected: { fontWeight: '700' },
});
