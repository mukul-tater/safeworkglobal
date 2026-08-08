import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Button, Card, EmptyState, LoadingView, SectionTitle } from '../../components/ui';

type AppRow = {
  id: string;
  status: string | null;
  applied_at: string | null;
  jobs: { title: string | null; location: string | null; country: string | null } | null;
};

export default function WorkerApplicationsScreen() {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('job_applications')
        .select('id, status, applied_at, jobs:job_id (title, location, country)')
        .eq('worker_id', profile.id)
        .order('applied_at', { ascending: false });
      if (fetchError) throw fetchError;
      setItems((data as unknown as AppRow[]) ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingView message="Loading applications..." />;

  if (error) {
    return (
      <ScreenLayout variant="stack" scrollable>
        <SectionTitle title="Applications" />
        <Card>
          <Text style={styles.error}>{error}</Text>
          <Button title="Retry" onPress={() => { setLoading(true); load(); }} />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout variant="stack">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          <SectionTitle title="My applications" subtitle={`${items.length} total`} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No applications yet"
            subtitle="Browse jobs and apply once you are GCC ready."
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.title}>{item.jobs?.title || 'Job'}</Text>
              <Badge label={item.status || 'PENDING'} tone="primary" />
            </View>
            <Text style={styles.sub}>
              {[item.jobs?.location, item.jobs?.country].filter(Boolean).join(', ') || 'Location TBA'}
            </Text>
            <Text style={styles.meta}>
              {item.applied_at ? new Date(item.applied_at).toLocaleString('en-IN') : ''}
            </Text>
          </Card>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center' },
  title: { ...typography.h3, flex: 1 },
  sub: { ...typography.bodySm, marginTop: spacing.xs },
  meta: { ...typography.bodySm, color: colors.mutedForeground, marginTop: spacing.sm },
  error: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.md },
});
