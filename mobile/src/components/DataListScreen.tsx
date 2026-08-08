import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import ScreenLayout from './layout/ScreenLayout';
import { Badge, Button, Card, EmptyState, LoadingView, SectionTitle } from './ui';

type QueryConfig = {
  table: string;
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  userColumn?: string;
  titleKey?: string;
  subtitleKey?: string;
  statusKey?: string;
  limit?: number;
  orFilter?: string;
};

export function DataListScreen({
  title,
  query,
  emptyTitle,
  emptySubtitle,
  onItemPress,
  variant = 'stack',
  transformItem,
}: {
  title: string;
  query: QueryConfig;
  emptyTitle: string;
  emptySubtitle?: string;
  onItemPress?: (item: Record<string, unknown>) => void;
  variant?: 'tab' | 'stack' | 'full';
  transformItem?: (item: Record<string, unknown>) => {
    title: string;
    subtitle?: string;
    status?: string;
  };
}) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      let request = (supabase as any).from(query.table).select(query.select ?? '*');

      if (query.userColumn && profile?.id) {
        request = request.eq(query.userColumn, profile.id);
      }
      if (query.orFilter && profile?.id) {
        request = request.or(query.orFilter.replaceAll('__UID__', profile.id));
      }
      if (query.orderBy) {
        request = request.order(query.orderBy, { ascending: query.ascending ?? false });
      }
      if (query.limit) {
        request = request.limit(query.limit);
      }

      const { data, error: fetchError } = await request;
      if (fetchError) throw fetchError;
      setItems((data as Record<string, unknown>[]) ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, query]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <LoadingView message={`Loading ${title.toLowerCase()}...`} />;

  if (error) {
    return (
      <ScreenLayout variant={variant} scrollable>
        <SectionTitle title={title} />
        <Card>
          <Text style={styles.errorTitle}>Couldn’t load {title.toLowerCase()}</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Button title="Retry" onPress={() => { setLoading(true); fetchItems(); }} />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout variant={variant}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id ?? `row-${index}`)}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchItems();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <SectionTitle title={title} subtitle={`${items.length} records`} />
        }
        ListEmptyComponent={<EmptyState title={emptyTitle} subtitle={emptySubtitle} />}
        renderItem={({ item }) => {
          const mapped = transformItem?.(item);
          const titleKey = query.titleKey ?? 'title';
          const subtitleKey = query.subtitleKey ?? 'created_at';
          const statusKey = query.statusKey;
          const rowTitle =
            mapped?.title ??
            String(item[titleKey] ?? item.name ?? item.subject ?? item.id ?? 'Item');
          const rawSubtitle = mapped?.subtitle ?? (item[subtitleKey] ? String(item[subtitleKey]) : undefined);
          const rowSubtitle = rawSubtitle
            ? Number.isNaN(Date.parse(rawSubtitle))
              ? rawSubtitle
              : new Date(rawSubtitle).toLocaleString('en-IN')
            : undefined;
          const status = mapped?.status ?? (statusKey ? String(item[statusKey] ?? '') : undefined);

          const content = (
            <Card>
              <Text style={styles.rowTitle}>{rowTitle}</Text>
              {rowSubtitle ? <Text style={styles.rowSubtitle}>{rowSubtitle}</Text> : null}
              {status ? (
                <View style={styles.badgeWrap}>
                  <Badge label={status} tone="primary" />
                </View>
              ) : null}
              {onItemPress ? <Text style={styles.link}>View details →</Text> : null}
            </Card>
          );

          if (!onItemPress) return content;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rowTitle}
              onPress={() => onItemPress(item)}
            >
              {content}
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenLayout>
  );
}

export function InfoScreen({
  title,
  description,
  bullets,
  variant = 'stack',
}: {
  title: string;
  description: string;
  bullets?: string[];
  variant?: 'tab' | 'stack' | 'full';
}) {
  return (
    <ScreenLayout variant={variant} scrollable>
      <SectionTitle title={title} />
      <Card>
        <Text style={styles.description}>{description}</Text>
      </Card>
      {bullets?.map((bullet) => (
        <Card key={bullet} elevated={false}>
          <Text style={styles.bullet}>• {bullet}</Text>
        </Card>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  rowTitle: { ...typography.h3 },
  rowSubtitle: { ...typography.bodySm, marginTop: spacing.xs },
  link: { color: colors.mutedForeground, marginTop: spacing.md, fontWeight: '600' },
  description: { ...typography.body },
  bullet: { ...typography.body },
  badgeWrap: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  errorTitle: { ...typography.h3, marginBottom: spacing.sm },
  errorBody: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.md },
});
