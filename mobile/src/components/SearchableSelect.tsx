import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
};

export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled,
  allowCustom,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query]);

  const showCustom =
    allowCustom &&
    query.trim().length > 0 &&
    !options.some((option) => option.toLowerCase() === query.trim().toLowerCase());

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, disabled && styles.disabled]}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${label.toLowerCase()}`}
            placeholderTextColor={colors.mutedForeground}
            style={styles.search}
            autoFocus
          />
          <FlatList
            data={showCustom ? [query.trim(), ...filtered] : filtered}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => select(item)}
                style={[styles.row, item === value && styles.rowActive]}
              >
                <Text style={styles.rowText}>
                  {showCustom && index === 0 && !options.includes(item) ? `Use “${item}”` : item}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  triggerText: { fontSize: 16, color: colors.text },
  placeholder: { color: colors.mutedForeground },
  modal: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2 },
  done: { color: colors.primary, fontWeight: '600', fontSize: 16 },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  row: { paddingHorizontal: spacing.lg, paddingVertical: 14 },
  rowActive: { backgroundColor: colors.muted },
  rowText: { fontSize: 16, color: colors.text },
  empty: { padding: spacing.lg, color: colors.mutedForeground },
});
