import React, { useEffect, useMemo, useState } from 'react';
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
  hint?: string;
  /** Paint at most this many matches. Search still covers the full list. */
  maxVisible?: number;
  loading?: boolean;
  emptyText?: string;
  /** Replaces the local list. Called after two characters, debounced. */
  remoteSearch?: (query: string) => Promise<string[]>;
};

export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled,
  allowCustom,
  hint,
  maxVisible,
  loading = false,
  emptyText = 'No matches',
  remoteSearch,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [remoteOptions, setRemoteOptions] = useState<string[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const localFiltered = useMemo(() => {
    if (remoteSearch) return [];
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, query, remoteSearch]);

  useEffect(() => {
    if (!remoteSearch || !open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteOptions([]);
      setRemoteLoading(false);
      setRemoteFailed(false);
      return;
    }
    let cancel = false;
    setRemoteLoading(true);
    const timer = setTimeout(() => {
      remoteSearch(trimmed)
        .then((rows) => {
          if (cancel) return;
          setRemoteOptions(rows);
          setRemoteFailed(false);
        })
        .catch(() => {
          if (cancel) return;
          setRemoteOptions([]);
          setRemoteFailed(true);
        })
        .finally(() => {
          if (!cancel) setRemoteLoading(false);
        });
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [open, query, remoteSearch]);

  const filtered = remoteSearch ? remoteOptions : localFiltered;
  const visible = maxVisible ? filtered.slice(0, maxVisible) : filtered;
  const hiddenCount = filtered.length - visible.length;
  const busy = loading || remoteLoading;
  const trimmed = query.trim();
  const showCustom =
    allowCustom &&
    trimmed.length > 0 &&
    !filtered.some((option) => option.toLowerCase() === trimmed.toLowerCase()) &&
    !options.some((option) => option.toLowerCase() === trimmed.toLowerCase());

  const statusText = busy
    ? 'Loading…'
    : remoteSearch && trimmed.length < 2
      ? 'Type at least 2 letters'
      : remoteFailed
        ? 'Could not load matches. Type the name to use it.'
        : visible.length === 0
          ? emptyText
          : '';

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const rows = showCustom ? [trimmed, ...visible] : visible;

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
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
            data={rows}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => select(item)}
                style={[styles.row, item === value && styles.rowActive]}
              >
                <Text style={styles.rowText}>
                  {showCustom && index === 0 && item === trimmed && !filtered.includes(item)
                    ? `Use “${item}”`
                    : item}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={statusText ? <Text style={styles.empty}>{statusText}</Text> : null}
            ListFooterComponent={
              hiddenCount > 0 ? (
                <Text style={styles.more}>
                  Showing {visible.length} of {filtered.length}. Keep typing to narrow the list.
                </Text>
              ) : null
            }
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
  hint: { ...typography.caption, marginTop: spacing.sm },
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
  more: { padding: spacing.lg, textAlign: 'center', color: colors.mutedForeground, fontSize: 13 },
});
