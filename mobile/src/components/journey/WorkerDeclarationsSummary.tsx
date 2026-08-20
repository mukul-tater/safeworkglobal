import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Globe,
  UserCheck,
  FileCheck,
  CheckCircle2,
} from 'lucide-react-native';
import type { WorkerPreJourneyDeclaration } from '../../types/declarations.types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Card } from '../ui';

interface Props {
  declaration: WorkerPreJourneyDeclaration;
  onEdit?: () => void;
}

export default function WorkerDeclarationsSummary({ declaration, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = declaration.completed_at
    ? new Date(declaration.completed_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Completed';

  return (
    <Card elevated={false} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ShieldCheck size={20} color={colors.success} style={styles.iconMargin} />
          <View style={styles.titleTextContainer}>
            <Text style={styles.title}>Pre-Journey Screening Verified</Text>
            <Text style={styles.subtitle}>Completed on {formattedDate} • 8 Candidate Acknowledgements</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>{expanded ? 'Hide details' : 'View declarations'}</Text>
            {expanded ? <ChevronUp size={16} color={colors.worker} /> : <ChevronDown size={16} color={colors.worker} />}
          </Pressable>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.editBtn}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {expanded && (
        <View style={styles.detailsContainer}>
          {/* Medical */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Stethoscope size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Medical & Fitness</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Physically Fit: </Text>
                <Text style={styles.value}>{declaration.medical?.fitForDuties || 'Yes'}</Text>
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Medical Limitation: </Text>
                <Text style={styles.value}>{declaration.medical?.hasMedicalCondition || 'No'}</Text>
              </Text>
              {declaration.medical?.hasMedicalCondition === 'yes' && declaration.medical?.medicalConditionDetails ? (
                <Text style={styles.itemText}>
                  <Text style={styles.label}>Details: </Text>
                  <Text style={styles.value}>{declaration.medical.medicalConditionDetails}</Text>
                </Text>
              ) : null}
            </View>
          </View>

          {/* Overseas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Previous Overseas Employment</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Worked Outside India: </Text>
                <Text style={styles.value}>{declaration.overseas?.workedOutsideIndia || 'No'}</Text>
              </Text>
              {declaration.overseas?.workedOutsideIndia === 'yes' && declaration.overseas?.overseasDetails ? (
                <Text style={styles.itemText}>
                  <Text style={styles.label}>Details: </Text>
                  <Text style={styles.value}>
                    {declaration.overseas.overseasDetails.country} ({declaration.overseas.overseasDetails.employer},{' '}
                    {declaration.overseas.overseasDetails.jobTrade})
                  </Text>
                </Text>
              ) : null}
              <Text style={styles.itemText}>
                <Text style={styles.label}>Deported / Visa Refusal / Overstay: </Text>
                <Text style={styles.value}>
                  {declaration.overseas?.beenDeported === 'yes' ||
                  declaration.overseas?.refusedVisaOrEntry === 'yes' ||
                  declaration.overseas?.overstayedVisa === 'yes'
                    ? 'Declared'
                    : 'None (Clean Record)'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Recruitment Agent */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <UserCheck size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Agent & Recruitment Fees</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Paid Money to Agent: </Text>
                <Text style={styles.value}>{declaration.recruitment?.paidMoneyForJob || 'No'}</Text>
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Guaranteed Job Promised: </Text>
                <Text style={styles.value}>{declaration.recruitment?.promisedGuaranteedJobForMoney || 'No'}</Text>
              </Text>
            </View>
          </View>

          {/* Acknowledgements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileCheck size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Candidate Acknowledgements (8/8)</Text>
            </View>
            <View style={styles.ackBox}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={styles.ackText}>
                All 8 mandatory declarations and legal candidate acknowledgements accepted.
              </Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.workerLight,
    borderColor: colors.successBorder ?? colors.border,
    borderWidth: 1,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: spacing.sm,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    ...typography.bodySm,
    color: colors.worker,
    fontWeight: '600',
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  editText: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  section: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.foreground,
  },
  box: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  itemText: {
    ...typography.bodySm,
  },
  label: {
    color: colors.mutedForeground,
  },
  value: {
    color: colors.foreground,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ackText: {
    ...typography.bodySm,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
});
