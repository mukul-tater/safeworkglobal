import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerVerificationStage, isWorkerGccReady } from '../../lib/workerPortalAccess';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Card, LoadingView, SectionTitle } from '../../components/ui';

export default function WorkerTrustScreen() {
  const { user, profile, isMobileVerified } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gccReady, setGccReady] = useState(false);
  const [stage, setStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [ready, currentStage] = await Promise.all([
        isWorkerGccReady(user.id),
        getWorkerVerificationStage(user.id),
      ]);
      setGccReady(ready);
      setStage(currentStage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingView message="Loading trust status..." />;

  return (
    <ScreenLayout variant="stack">
      <ScrollView
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
      >
        <SectionTitle title="Trust & readiness" subtitle="Signals employers see about you" />
        <Card>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile verified</Text>
            <Badge label={isMobileVerified ? 'Yes' : 'No'} tone={isMobileVerified ? 'success' : 'warning'} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GCC ready</Text>
            <Badge label={gccReady ? 'Ready' : 'In progress'} tone={gccReady ? 'success' : 'primary'} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Journey stage</Text>
            <Text style={styles.value}>{stage || 'essentials'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Profile</Text>
            <Text style={styles.value}>{profile?.full_name || 'Incomplete'}</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { ...typography.body },
  value: { ...typography.bodySm, color: colors.mutedForeground, fontWeight: '600' },
});
