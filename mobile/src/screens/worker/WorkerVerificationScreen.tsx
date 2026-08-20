import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {
  EDUCATION_LEVELS,
  JOURNEY_STEPS,
  MEDICAL_TEST_SCREENING_NOTE,
  PRIMARY_SKILLS,
  acceptTerms,
  getOrCreateVerification,
  saveEssentials,
  stageIndex,
  submitIdentity,
  type WorkerVerification,
} from '../../services/verificationService';
import { getWorkerDeclarations } from '../../services/declarationService';
import type { WorkerPreJourneyDeclaration } from '../../types/declarations.types';
import WorkerDeclarationsSummary from '../../components/journey/WorkerDeclarationsSummary';
import WorkerPreJourneyScreeningModal from '../../components/journey/WorkerPreJourneyScreeningModal';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Badge, Button, Card, Input, LoadingView, SectionTitle } from '../../components/ui';

export default function WorkerVerificationScreen() {
  const { profile, user } = useAuth();
  const [row, setRow] = useState<WorkerVerification | null>(null);
  const [declaration, setDeclaration] = useState<WorkerPreJourneyDeclaration | null>(null);
  const completedDeclRef = useRef<WorkerPreJourneyDeclaration | null>(null);
  const loadGen = useRef(0);
  const [declModalOpen, setDeclModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [education, setEducation] = useState<string>(EDUCATION_LEVELS[2]);
  const [skill, setSkill] = useState<string>(PRIMARY_SKILLS[0]);
  const [tenthPass, setTenthPass] = useState<boolean | null>(null);
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [passport, setPassport] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    const gen = ++loadGen.current;
    try {
      setError('');
      const [data, declData] = await Promise.all([
        getOrCreateVerification(user.id),
        getWorkerDeclarations(user.id),
      ]);
      if (gen !== loadGen.current) return;
      setRow(data);
      const completed =
        declData?.completed_at
          ? declData
          : completedDeclRef.current?.completed_at
            ? completedDeclRef.current
            : null;
      if (completed?.completed_at) {
        completedDeclRef.current = completed;
        setDeclaration(completed);
        setDeclModalOpen(false);
      } else {
        setDeclaration(null);
      }
      setEmail(data.email || profile?.email || '');
      setCity(data.city || '');
      setStateName(data.state || '');
      setEducation(data.education_level || EDUCATION_LEVELS[2]);
      setSkill(data.primary_skill || PRIMARY_SKILLS[0]);
      if (data.education_level === 'Below 10th') setTenthPass(false);
      else if (data.education_level) setTenthPass(true);
    } catch (e) {
      if (gen !== loadGen.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load journey');
    } finally {
      if (gen === loadGen.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user?.id, profile?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const currentIdx = stageIndex(row?.stage);

  const onAcceptTerms = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await acceptTerms(user.id);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not accept terms');
    } finally {
      setSaving(false);
    }
  };

  const onSaveEssentials = async () => {
    if (!user?.id) return;
    if (tenthPass === null) {
      Alert.alert('Required', 'Select whether you have passed Class 10.');
      return;
    }
    setSaving(true);
    try {
      const updated = await saveEssentials(user.id, {
        email,
        city,
        state: stateName,
        education_level: education,
        primary_skill: skill,
        tenth_pass: tenthPass,
      });
      setRow(updated);
      Alert.alert('Saved', 'Essentials saved. Continue to the next journey step.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitKyc = async () => {
    if (!user?.id) return;
    if (!pan && !aadhaar && !passport) {
      Alert.alert('KYC required', 'Provide at least PAN, Aadhaar last 4, or passport number.');
      return;
    }
    setSaving(true);
    try {
      await submitIdentity(user.id, {
        pan_number: pan.trim() || undefined,
        aadhaar_last4: aadhaar.trim() || undefined,
        passport_number: passport.trim() || undefined,
      });
      await load();
      Alert.alert('Submitted', 'KYC submitted for review. Interview scheduling is next.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit KYC');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView message="Loading GCC journey..." />;

  return (
    <ScreenLayout variant="tab" header={{ title: 'GCC Journey', subtitle: 'Become job-ready' }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card elevated={false} style={styles.progressCard}>
          <Text style={styles.progressLabel}>Current stage</Text>
          <Text style={styles.progressValue}>
            {JOURNEY_STEPS[currentIdx]?.label ?? row?.stage ?? 'Essentials'}
          </Text>
          <View style={styles.dots}>
            {JOURNEY_STEPS.map((step, idx) => (
              <View
                key={step.id}
                style={[
                  styles.dot,
                  idx < currentIdx && styles.dotDone,
                  idx === currentIdx && styles.dotCurrent,
                ]}
              />
            ))}
          </View>
        </Card>

        <SectionTitle title="Roadmap" subtitle="Complete each step to unlock job applications" />
        {JOURNEY_STEPS.map((step, idx) => {
          const status =
            idx < currentIdx ? 'Done' : idx === currentIdx ? 'Current' : 'Upcoming';
          const tone = status === 'Done' ? 'success' : status === 'Current' ? 'primary' : 'default';
          return (
            <Card key={step.id} elevated={false}>
              <View style={styles.stepRow}>
                <View style={styles.flex}>
                  <Text style={styles.stepTitle}>{step.label}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
                <Badge label={status} tone={tone as any} />
              </View>
            </Card>
          );
        })}

        {/* Pre-Journey Screening Declarations */}
        {declaration?.completed_at ? (
          <WorkerDeclarationsSummary
            declaration={declaration}
            onEdit={() => setDeclModalOpen(true)}
          />
        ) : (
          <Card>
            <SectionTitle
              title="Pre-journey screening declarations"
              subtitle="Mandatory health, overseas work, recruitment fee & candidate compliance checks"
            />
            <Text style={styles.body}>
              Before starting your journey, please declare your medical fitness, previous overseas work,
              agent history, and accept 8 candidate legal acknowledgements.
            </Text>
            <Button
              title="Complete screening declarations"
              onPress={() => setDeclModalOpen(true)}
              fullWidth
            />
          </Card>
        )}

        {!row?.terms_accepted_at ? (
          <Card>
            <SectionTitle title="Accept terms" subtitle="Required before essentials" />
            <Text style={styles.body}>
              I confirm I am medically fit for overseas work, will provide truthful information, and
              will not pay unauthorized placement fees.
            </Text>
            <Button title="Accept worker terms" onPress={onAcceptTerms} loading={saving} fullWidth />
          </Card>
        ) : null}

        {(row?.stage === 'essentials' || !row?.primary_skill) && row?.terms_accepted_at ? (
          <Card>
            <SectionTitle title="Essentials" />
            <Input label="Contact email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="City" value={city} onChangeText={setCity} />
            <Input label="State" value={stateName} onChangeText={setStateName} />
            <Text style={styles.chipLabel}>Have you passed Class 10 (matric)?</Text>
            <View style={styles.chips}>
              {(
                [
                  { value: true, label: 'Yes — 10th pass (ECNR)' },
                  { value: false, label: 'No — below 10th (ECR)' },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    setTenthPass(option.value);
                    if (!option.value) setEducation('Below 10th');
                    else if (education === 'Below 10th') setEducation('10th Pass');
                  }}
                  style={[styles.chip, tenthPass === option.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, tenthPass === option.value && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tenthPass !== null ? (
              <Text style={styles.body}>
                {tenthPass
                  ? 'You will be categorised as ECNR — no emigration clearance required.'
                  : 'You will be categorised as ECR — emigration clearance required.'}
              </Text>
            ) : null}
            <Text style={styles.chipLabel}>Education</Text>
            <View style={styles.chips}>
              {(tenthPass === false
                ? EDUCATION_LEVELS.filter((level) => level === 'Below 10th')
                : tenthPass === true
                  ? EDUCATION_LEVELS.filter((level) => level !== 'Below 10th')
                  : EDUCATION_LEVELS
              ).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setEducation(level)}
                  style={[styles.chip, education === level && styles.chipActive]}
                >
                  <Text style={[styles.chipText, education === level && styles.chipTextActive]}>{level}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.chipLabel}>Primary skill</Text>
            <View style={styles.chips}>
              {PRIMARY_SKILLS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSkill(s)}
                  style={[styles.chip, skill === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, skill === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Save essentials" onPress={onSaveEssentials} loading={saving} fullWidth />
          </Card>
        ) : null}

        {row?.stage === 'identity' ? (
          <Card>
            <SectionTitle title="Identity (KYC)" subtitle="Submit for verification before interviews" />
            <Input label="PAN" value={pan} onChangeText={setPan} autoCapitalize="characters" />
            <Input label="Aadhaar last 4" value={aadhaar} onChangeText={setAadhaar} keyboardType="number-pad" maxLength={4} />
            <Input
              label="Passport number (optional)"
              value={passport}
              onChangeText={setPassport}
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>
              Passport (if available). If you have a passport, upload first page and last page
              photos on the web journey. Don't have a passport yet? You can still continue.
            </Text>
            <Text style={styles.hintHi}>
              अभी पासपोर्ट नहीं है? आप फिर भी ट्रेड टेस्ट दे सकते हैं। विदेश यात्रा के लिए वैध पासपोर्ट आवश्यक है।
            </Text>
            <Button title="Submit KYC" onPress={onSubmitKyc} loading={saving} fullWidth />
          </Card>
        ) : null}

        {row?.stage === 'medical' ? (
          <Card>
            <SectionTitle
              title="Medical test"
              subtitle="Complete screening at any nearest laboratory"
            />
            <Text style={styles.body}>{MEDICAL_TEST_SCREENING_NOTE}</Text>
            <Text style={styles.hint}>
              Upload your HIV blood report, TB chest X-ray report, and X-ray photo on the web journey.
            </Text>
          </Card>
        ) : null}

        {row?.stage === 'gcc_ready' ? (
          <Card>
            <Text style={styles.readyTitle}>You are GCC ready</Text>
            <Text style={styles.body}>You can apply to verified overseas jobs from the Jobs tab.</Text>
          </Card>
        ) : (
          <Card elevated={false}>
            <Text style={styles.body}>
              Quiz, media upload, interview scheduling, Razorpay payment, trade test, medical, bond,
              and PDOT continue on the web portal for steps that need desktop tools. Your progress
              syncs here automatically.
            </Text>
          </Card>
        )}

        {user?.id ? (
          <WorkerPreJourneyScreeningModal
            userId={user.id}
            isOpen={declModalOpen}
            onClose={() => setDeclModalOpen(false)}
            onCompleted={(declRes) => {
              completedDeclRef.current = declRes;
              setDeclaration(declRes);
              setDeclModalOpen(false);
            }}
            existingDeclaration={declaration}
          />
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  error: { ...typography.bodySm, color: colors.destructive },
  progressCard: { backgroundColor: colors.workerLight, borderColor: colors.successBorder ?? colors.border },
  progressLabel: { ...typography.bodySm, color: colors.mutedForeground },
  progressValue: { ...typography.h2, color: colors.worker, marginTop: 4 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { backgroundColor: colors.worker, transform: [{ scale: 1.2 }] },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  stepTitle: { ...typography.h3 },
  stepDesc: { ...typography.bodySm, marginTop: 2 },
  body: { ...typography.body, marginBottom: spacing.md },
  hint: { ...typography.bodySm, marginBottom: spacing.xs, color: colors.mutedForeground },
  hintHi: { ...typography.caption, marginBottom: spacing.md, color: colors.mutedForeground },
  chipLabel: { ...typography.bodySm, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.worker, backgroundColor: colors.workerLight },
  chipText: { ...typography.bodySm, color: colors.foreground },
  chipTextActive: { color: colors.worker, fontWeight: '700' },
  readyTitle: { ...typography.h2, color: colors.success, marginBottom: spacing.sm },
});
