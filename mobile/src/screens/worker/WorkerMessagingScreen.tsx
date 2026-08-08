import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Button, Card, EmptyState, LoadingView, SectionTitle } from '../../components/ui';

type MessageRow = {
  id: string;
  subject: string | null;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean | null;
  created_at: string | null;
};

export default function WorkerMessagingScreen() {
  const { profile } = useAuth();
  const [items, setItems] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id, subject, content, sender_id, receiver_id, is_read, created_at')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (fetchError) throw fetchError;
      setItems((data as MessageRow[]) ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingView message="Loading messages..." />;

  if (error) {
    return (
      <ScreenLayout variant="stack" scrollable>
        <SectionTitle title="Messages" />
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
        ListHeaderComponent={<SectionTitle title="Messages" subtitle={`${items.length} conversations`} />}
        ListEmptyComponent={
          <EmptyState title="No messages yet" subtitle="Employers and partners will appear here." />
        }
        renderItem={({ item }) => {
          const inbound = item.receiver_id === profile?.id;
          return (
            <Card>
              <View style={styles.row}>
                <Text style={styles.title}>{item.subject || (inbound ? 'Incoming message' : 'Sent message')}</Text>
                <Badge label={item.is_read ? 'Read' : 'Unread'} tone={item.is_read ? 'default' : 'warning'} />
              </View>
              <Text style={styles.body} numberOfLines={3}>{item.content}</Text>
              <Text style={styles.meta}>
                {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : ''}
                {inbound ? ' · Inbox' : ' · Sent'}
              </Text>
            </Card>
          );
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center' },
  title: { ...typography.h3, flex: 1 },
  body: { ...typography.body, marginTop: spacing.sm },
  meta: { ...typography.bodySm, color: colors.mutedForeground, marginTop: spacing.sm },
  error: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.md },
});
