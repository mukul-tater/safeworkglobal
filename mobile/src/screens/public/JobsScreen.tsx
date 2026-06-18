import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Briefcase, MapPin, Search, SlidersHorizontal } from 'lucide-react-native';
import JobListCard, { type JobListItem } from '../../components/JobListCard';
import ScreenLayout from '../../components/layout/ScreenLayout';
import type { PublicStackParamList } from '../../navigation/types';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Card, Input, LoadingView } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'Jobs'>;
type SortOption = 'recent' | 'salary-high' | 'salary-low';

const POPULAR_COUNTRIES = ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman'];

export default function JobsScreen({ navigation }: Props) {
  const route = useRoute<RouteProp<PublicStackParamList, 'Jobs'>>();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState(route.params?.keyword ?? '');
  const [country, setCountry] = useState(route.params?.country ?? '');
  const [sort, setSort] = useState<SortOption>('recent');

  useEffect(() => {
    if (route.params?.keyword) setKeyword(route.params.keyword);
    if (route.params?.country) setCountry(route.params.country);
  }, [route.params?.keyword, route.params?.country]);

  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(
          'id, slug, title, location, country, salary_min, salary_max, currency, experience_level, job_type, created_at',
        )
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setJobs(data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = jobs.filter((job) => {
      const matchesKeyword =
        !kw ||
        job.title.toLowerCase().includes(kw) ||
        job.location.toLowerCase().includes(kw) ||
        job.country.toLowerCase().includes(kw);
      const matchesCountry =
        !country.trim() || job.country.toLowerCase().includes(country.trim().toLowerCase());
      return matchesKeyword && matchesCountry;
    });

    return [...list].sort((a, b) => {
      if (sort === 'salary-high') {
        return (b.salary_max ?? b.salary_min ?? 0) - (a.salary_max ?? a.salary_min ?? 0);
      }
      if (sort === 'salary-low') {
        return (a.salary_min ?? a.salary_max ?? 0) - (b.salary_min ?? b.salary_max ?? 0);
      }
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [jobs, keyword, country, sort]);

  if (loading) return <LoadingView message="Loading jobs..." />;

  return (
    <ScreenLayout variant="tab" contentStyle={styles.screenContent}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchJobs();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Find Your Next Opportunity</Text>
            <Text style={styles.pageSubtitle}>
              Browse verified international jobs with salary protection
            </Text>

            <Card elevated style={styles.searchCard}>
              <Input
                placeholder="Search title, skill, or location"
                value={keyword}
                onChangeText={setKeyword}
                icon={<Search size={18} color={colors.textMuted} />}
              />
              <Input
                placeholder="Filter by country"
                value={country}
                onChangeText={setCountry}
                icon={<MapPin size={18} color={colors.textMuted} />}
              />

              <Text style={styles.filterLabel}>Popular destinations</Text>
              <View style={styles.chipRow}>
                {POPULAR_COUNTRIES.map((name) => {
                  const active = country.toLowerCase() === name.toLowerCase();
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setCountry(active ? '' : name)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <View style={styles.resultsRow}>
              <Text style={styles.resultsCount}>
                {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} found
              </Text>
              <View style={styles.sortRow}>
                <SlidersHorizontal size={14} color={colors.mutedForeground} />
                <Pressable
                  onPress={() =>
                    setSort(
                      sort === 'recent'
                        ? 'salary-high'
                        : sort === 'salary-high'
                          ? 'salary-low'
                          : 'recent',
                    )
                  }
                  style={styles.sortButton}
                >
                  <Text style={styles.sortText}>
                    {sort === 'recent'
                      ? 'Most recent'
                      : sort === 'salary-high'
                        ? 'Salary: high to low'
                        : 'Salary: low to high'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card elevated={false} style={styles.emptyCard}>
            <Briefcase size={32} color={colors.textLight} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or pick a different destination.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <JobListCard
            job={item}
            onPress={() =>
              navigation.navigate('JobDetail', { jobId: item.id, slug: item.slug })
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingTop: spacing.md },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  header: { marginBottom: spacing.sm },
  pageTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    ...typography.bodySm,
    marginBottom: spacing.lg,
  },
  searchCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  filterLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryMuted,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.bodySm, textAlign: 'center' },
});
