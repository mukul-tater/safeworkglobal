import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isErrorWithCode, pick, types, errorCodes } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Button, Card, EmptyState, LoadingView, SectionTitle } from '../../components/ui';

type DocRow = {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  verification_status: string | null;
  uploaded_at: string | null;
};

export default function WorkerDocumentsScreen() {
  const { profile, user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('worker_documents')
        .select('id, document_type, document_name, file_url, verification_status, uploaded_at')
        .eq('worker_id', profile.id)
        .order('uploaded_at', { ascending: false });
      if (fetchError) throw fetchError;
      setDocs((data as DocRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
      setDocs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadUri = async (uri: string, name: string, mime: string, documentType: string) => {
    if (!user?.id || !profile?.id) return;
    setUploading(true);
    try {
      const ext = name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}-${documentType}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('worker-documents')
        .upload(path, blob, { contentType: mime, upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('worker-documents').getPublicUrl(path);
      const { error: insertError } = await supabase.from('worker_documents').insert({
        worker_id: profile.id,
        document_type: documentType,
        document_name: name,
        file_url: publicUrl.publicUrl,
        verification_status: 'pending',
      });
      if (insertError) throw insertError;
      await load();
      Alert.alert('Uploaded', 'Document uploaded for verification.');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload');
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const [file] = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
      });
      if (!file?.uri) return;
      await uploadUri(
        file.uri,
        file.name || 'document',
        file.type || 'application/octet-stream',
        'general',
      );
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Picker error', e instanceof Error ? e.message : 'Could not open picker');
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    await uploadUri(
      asset.uri!,
      asset.fileName || 'photo.jpg',
      asset.type || 'image/jpeg',
      'identity',
    );
  };

  if (loading) return <LoadingView message="Loading documents..." />;

  return (
    <ScreenLayout variant="stack">
      <FlatList
        data={docs}
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
          <View style={styles.header}>
            <SectionTitle title="Documents" subtitle="Upload KYC and skill proofs" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Button title="Upload file" onPress={pickDocument} loading={uploading} />
              <Button title="Upload photo" variant="outline" onPress={pickImage} disabled={uploading} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="No documents yet" subtitle="Upload passport, Aadhaar, or skill proofs." />
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>{item.document_name || item.document_type || 'Document'}</Text>
            <Text style={styles.sub}>{item.document_type || 'general'}</Text>
            {item.verification_status ? (
              <View style={styles.badge}>
                <Badge label={item.verification_status} tone="primary" />
              </View>
            ) : null}
          </Card>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  header: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  error: { ...typography.bodySm, color: colors.destructive, marginBottom: spacing.sm },
  title: { ...typography.h3 },
  sub: { ...typography.bodySm, marginTop: 4 },
  badge: { marginTop: spacing.sm, alignSelf: 'flex-start' },
});
