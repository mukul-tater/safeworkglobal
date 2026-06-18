import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import ScreenLayout from './layout/ScreenLayout';
import { Badge, Card, EmptyState, LoadingView, SectionTitle } from './ui';

type QueryConfig = {
  table: string;
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  userColumn?: string;
  titleKey?: string;
  subtitleKey?: string;
  statusKey?: string;
};

export function DataListScreen({
  title,
  query,
  emptyTitle,
  emptySubtitle,
  onItemPress,
  variant = 'stack',
}: {
  title: string;
  query: QueryConfig;
  emptyTitle: string;
  emptySubtitle?: string;
  onItemPress?: (item: Record<string, unknown>) => void;
  variant?: 'tab' | 'stack' | 'full';
}) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      let request = (supabase as any).from(query.table).select(query.select ?? '*');

      if (query.userColumn && profile?.id) {
        request = request.eq(query.userColumn, profile.id);
      }

      if (query.orderBy) {
        request = request.order(query.orderBy, { ascending: query.ascending ?? false });
      }

      const { data, error } = await request;
      if (error) throw error;
      setItems((data as Record<string, unknown>[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, query]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <LoadingView message={`Loading ${title.toLowerCase()}...`} />;

  return (
    <ScreenLayout variant={variant}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id ?? index)}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchItems(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <SectionTitle title={title} subtitle={`${items.length} records`} />
        }
        ListEmptyComponent={<EmptyState title={emptyTitle} subtitle={emptySubtitle} />}
        renderItem={({ item }) => {
          const titleKey = query.titleKey ?? 'title';
          const subtitleKey = query.subtitleKey ?? 'created_at';
          const statusKey = query.statusKey;
          const rowTitle = String(item[titleKey] ?? item.name ?? item.id ?? 'Item');
          const rowSubtitle = item[subtitleKey]
            ? new Date(String(item[subtitleKey])).toLocaleString('en-IN')
            : undefined;
          const status = statusKey ? String(item[statusKey] ?? '') : undefined;

          return (
            <Card>
              <Text style={styles.rowTitle}>{rowTitle}</Text>
              {rowSubtitle ? <Text style={styles.rowSubtitle}>{rowSubtitle}</Text> : null}
              {status ? <Badge label={status} tone="primary" /> : null}
              {onItemPress ? (
                <Text style={styles.link} onPress={() => onItemPress(item)}>
                  View details →
                </Text>
              ) : null}
            </Card>
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
});
