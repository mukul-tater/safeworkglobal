import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Stethoscope,
  Globe,
  UserCheck,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  Fingerprint,
  BookOpen,
  Info,
} from 'lucide-react-native';
import {
  CANDIDATE_ACKNOWLEDGEMENT_ITEMS,
  ORIGINAL_DOCS_READY_NOTICE,
  PRE_JOURNEY_COPY,
  type MedicalFitnessDeclaration,
  type PreviousOverseasEmploymentDeclaration,
  type RecruitmentAgentExperienceDeclaration,
  type CandidateAcknowledgements,
  type WorkerPreJourneyDeclaration,
} from '../../types/declarations.types';
import {
  INITIAL_MEDICAL,
  INITIAL_OVERSEAS,
  INITIAL_RECRUITMENT,
  INITIAL_ACKNOWLEDGEMENTS,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  saveWorkerDeclarations,
} from '../../services/declarationService';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Badge, Button, Card, Input } from '../ui';

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (decl: WorkerPreJourneyDeclaration) => void;
  existingDeclaration?: WorkerPreJourneyDeclaration | null;
}

type Step = 0 | 1 | 2 | 3 | 4;

function EnHi({ en, hi }: { en: string; hi: string }) {
  return (
    <View>
      <Text style={styles.questionEn}>{en}</Text>
      <Text style={styles.hindiLine}>{hi}</Text>
    </View>
  );
}

function ChipLabel({ en, hi, active }: { en: string; hi: string; active: boolean }) {
  return (
    <View style={styles.chipLabel}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{en}</Text>
      <Text style={[styles.chipHindi, active && styles.chipHindiActive]}>{hi}</Text>
    </View>
  );
}

function choiceCopy(val: string) {
  if (val === 'yes') return PRE_JOURNEY_COPY.yes;
  if (val === 'not_sure') return PRE_JOURNEY_COPY.notSure;
  return PRE_JOURNEY_COPY.no;
}

export default function WorkerPreJourneyScreeningModal({
  userId,
  isOpen,
  onClose,
  onCompleted,
  existingDeclaration,
}: Props) {
  const [step, setStep] = useState<Step>(0);
  const [medical, setMedical] = useState<MedicalFitnessDeclaration>(
    existingDeclaration?.medical || INITIAL_MEDICAL,
  );
  const [overseas, setOverseas] = useState<PreviousOverseasEmploymentDeclaration>(
    existingDeclaration?.overseas || INITIAL_OVERSEAS,
  );
  const [recruitment, setRecruitment] = useState<RecruitmentAgentExperienceDeclaration>(
    existingDeclaration?.recruitment || INITIAL_RECRUITMENT,
  );
  const [ack, setAck] = useState<CandidateAcknowledgements>(
    existingDeclaration?.acknowledgements || INITIAL_ACKNOWLEDGEMENTS,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrors({});
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      const res = validateStep1(medical);
      if (!res.isValid) {
        setErrors(res.errors);
        Alert.alert('Required', 'Please complete all medical declarations.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const res = validateStep2(overseas);
      if (!res.isValid) {
        setErrors(res.errors);
        Alert.alert('Required', 'Please complete all overseas employment declarations.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const res = validateStep3(recruitment);
      if (!res.isValid) {
        setErrors(res.errors);
        Alert.alert('Required', 'Please complete all recruitment fee & agent experience declarations.');
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    if (step > 0) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setErrors({});
    const res = validateStep4(ack);
    if (!res.isValid) {
      setErrors(res.errors);
      Alert.alert(
        'Required',
        `You must accept all ${CANDIDATE_ACKNOWLEDGEMENT_ITEMS.length} mandatory candidate acknowledgements before proceeding.`,
      );
      return;
    }

    setSaving(true);
    try {
      const result = await saveWorkerDeclarations(userId, medical, overseas, recruitment, ack);
      Alert.alert('Success', 'Pre-journey screening declarations submitted successfully!');
      onCompleted(result);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit declarations.');
    } finally {
      setSaving(false);
    }
  };

  const agreeAllAcknowledgements = () => {
    const next = { ...ack };
    for (const item of CANDIDATE_ACKNOWLEDGEMENT_ITEMS) next[item.key] = true;
    setAck(next);
    setErrors({});
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Badge
              label={step === 0 ? ORIGINAL_DOCS_READY_NOTICE.badgeEn : `Step ${step} of 4`}
              tone="primary"
            />
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {step === 0 ? ORIGINAL_DOCS_READY_NOTICE.titleEn : PRE_JOURNEY_COPY.headerTitle.en}
              </Text>
              <Text style={styles.headerHindi} numberOfLines={1}>
                {step === 0 ? ORIGINAL_DOCS_READY_NOTICE.titleHi : PRE_JOURNEY_COPY.headerTitle.hi}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {step > 0 && (
        <View style={styles.stepperContainer}>
          {[
            { num: 1, label: PRE_JOURNEY_COPY.nav[0], icon: Stethoscope },
            { num: 2, label: PRE_JOURNEY_COPY.nav[1], icon: Globe },
            { num: 3, label: PRE_JOURNEY_COPY.nav[2], icon: UserCheck },
            { num: 4, label: PRE_JOURNEY_COPY.nav[3], icon: FileCheck },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isPast = step > s.num;
            return (
              <Pressable
                key={s.num}
                onPress={() => {
                  if (isPast) setStep(s.num as Step);
                }}
                style={[
                  styles.stepTab,
                  isActive && styles.stepTabActive,
                  isPast && styles.stepTabPast,
                ]}
              >
                <Icon size={14} color={isActive ? colors.surface : isPast ? colors.worker : colors.mutedForeground} />
                <Text
                  style={[
                    styles.stepTabText,
                    isActive && styles.stepTabTextActive,
                    isPast && styles.stepTabTextPast,
                  ]}
                  numberOfLines={1}
                >
                  {s.label.en}
                </Text>
              </Pressable>
            );
          })}
        </View>
        )}

        {/* Form Body */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 0 && (
            <View style={styles.stepBox}>
              <Text style={styles.docsHiTitle}>{ORIGINAL_DOCS_READY_NOTICE.titleHi}</Text>
              <View style={styles.docsNotice}>
                <View style={styles.docsNoticeHeader}>
                  <Info size={18} color={colors.worker} />
                  <Text style={styles.docsEnBody}>{ORIGINAL_DOCS_READY_NOTICE.bodyEn}</Text>
                </View>
                <Text style={styles.docsHiBody}>{ORIGINAL_DOCS_READY_NOTICE.bodyHi}</Text>
              </View>
              {[
                { Icon: CreditCard, ...ORIGINAL_DOCS_READY_NOTICE.items[0] },
                { Icon: Fingerprint, ...ORIGINAL_DOCS_READY_NOTICE.items[1] },
                { Icon: BookOpen, ...ORIGINAL_DOCS_READY_NOTICE.items[2] },
              ].map((item) => {
                const DocIcon = item.Icon;
                return (
                  <View key={item.en} style={styles.docRow}>
                    <View style={styles.docIcon}>
                      <DocIcon size={18} color={colors.worker} />
                    </View>
                    <View style={styles.docTextWrap}>
                      <Text style={styles.docEn}>{item.en}</Text>
                      <Text style={styles.docHi}>{item.hi}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.stepBox}>
            <Text style={styles.sectionHeader}>{PRE_JOURNEY_COPY.medical.title.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.medical.title.hi}</Text>
              <Text style={styles.sectionDesc}>{PRE_JOURNEY_COPY.medical.desc.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.medical.desc.hi}</Text>

              {/* Question 1 */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.medical.q1.en} hi={PRE_JOURNEY_COPY.medical.q1.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'not_sure', copy: PRE_JOURNEY_COPY.notSure },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setMedical({ ...medical, fitForDuties: opt.val as any })}
                      style={[styles.chip, medical.fitForDuties === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={opt.copy.en}
                        hi={opt.copy.hi}
                        active={medical.fitForDuties === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.fitForDuties ? <Text style={styles.errorText}>{errors.fitForDuties}</Text> : null}
              </Card>

              {/* Question 2 */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.medical.q2.en} hi={PRE_JOURNEY_COPY.medical.q2.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', copy: PRE_JOURNEY_COPY.no },
                    { val: 'yes', copy: PRE_JOURNEY_COPY.yes },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setMedical({ ...medical, hasMedicalCondition: opt.val as any })}
                      style={[styles.chip, medical.hasMedicalCondition === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={opt.copy.en}
                        hi={opt.copy.hi}
                        active={medical.hasMedicalCondition === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.hasMedicalCondition ? <Text style={styles.errorText}>{errors.hasMedicalCondition}</Text> : null}

                {medical.hasMedicalCondition === 'yes' ? (
                  <View style={styles.subInputContainer}>
                    <Input
                      label="Medical details & treatment information"
                      value={medical.medicalConditionDetails || ''}
                      onChangeText={(val) => setMedical({ ...medical, medicalConditionDetails: val })}
                      placeholder="Specify medical condition or limitation..."
                      multiline
                    />
                    {errors.medicalConditionDetails ? (
                      <Text style={styles.errorText}>{errors.medicalConditionDetails}</Text>
                    ) : null}
                  </View>
                ) : null}
              </Card>

              <Card elevated={false} style={styles.infoNotice}>
                <Text style={styles.infoNoticeTitle}>{PRE_JOURNEY_COPY.medical.disclaimerTitle.en}</Text>
                <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.medical.disclaimerTitle.hi}</Text>
                <Text style={styles.infoNoticeText}>{PRE_JOURNEY_COPY.medical.disclaimerBody.en}</Text>
                <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.medical.disclaimerBody.hi}</Text>
              </Card>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.stepBox}>
              <Text style={styles.sectionHeader}>{PRE_JOURNEY_COPY.overseas.title.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.overseas.title.hi}</Text>
              <Text style={styles.sectionDesc}>{PRE_JOURNEY_COPY.overseas.desc.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.overseas.desc.hi}</Text>

              {/* Worked outside India */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.overseas.q3.en} hi={PRE_JOURNEY_COPY.overseas.q3.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() =>
                        setOverseas({
                          ...overseas,
                          workedOutsideIndia: opt.val as 'yes' | 'no',
                          gccReturn: opt.val === 'no' ? 'no' : overseas.gccReturn,
                        })
                      }
                      style={[styles.chip, overseas.workedOutsideIndia === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={overseas.workedOutsideIndia === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.workedOutsideIndia ? <Text style={styles.errorText}>{errors.workedOutsideIndia}</Text> : null}
              </Card>

              {/* GCC return */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.overseas.q4.en} hi={PRE_JOURNEY_COPY.overseas.q4.hi} />
                <Text style={styles.sectionDesc}>{PRE_JOURNEY_COPY.overseas.q4Hint.en}</Text>
                <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.overseas.q4Hint.hi}</Text>
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() =>
                        setOverseas({
                          ...overseas,
                          gccReturn: opt.val as 'yes' | 'no',
                          workedOutsideIndia: opt.val === 'yes' ? 'yes' : overseas.workedOutsideIndia,
                        })
                      }
                      style={[styles.chip, overseas.gccReturn === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={overseas.gccReturn === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.gccReturn ? <Text style={styles.errorText}>{errors.gccReturn}</Text> : null}

                {overseas.workedOutsideIndia === 'yes' || overseas.gccReturn === 'yes' ? (
                  <View style={styles.subInputContainer}>
                    <Input
                      label="Country"
                      value={overseas.overseasDetails?.country || ''}
                      onChangeText={(val) =>
                        setOverseas({
                          ...overseas,
                          overseasDetails: { ...overseas.overseasDetails!, country: val },
                        })
                      }
                      placeholder="e.g. UAE"
                    />
                    <Input
                      label="Employer Name"
                      value={overseas.overseasDetails?.employer || ''}
                      onChangeText={(val) =>
                        setOverseas({
                          ...overseas,
                          overseasDetails: { ...overseas.overseasDetails!, employer: val },
                        })
                      }
                      placeholder="e.g. Al Habtoor Contracting"
                    />
                    <Input
                      label="Job / Trade"
                      value={overseas.overseasDetails?.jobTrade || ''}
                      onChangeText={(val) =>
                        setOverseas({
                          ...overseas,
                          overseasDetails: { ...overseas.overseasDetails!, jobTrade: val },
                        })
                      }
                      placeholder="e.g. Electrician, Mason"
                    />
                    <View style={styles.rowInputs}>
                      <View style={styles.flexHalf}>
                        <Input
                          label="Duration"
                          value={overseas.overseasDetails?.duration || ''}
                          onChangeText={(val) =>
                            setOverseas({
                              ...overseas,
                              overseasDetails: { ...overseas.overseasDetails!, duration: val },
                            })
                          }
                          placeholder="e.g. 2 yrs"
                        />
                      </View>
                      <View style={styles.flexHalf}>
                        <Input
                          label="Year"
                          value={overseas.overseasDetails?.year || ''}
                          onChangeText={(val) =>
                            setOverseas({
                              ...overseas,
                              overseasDetails: { ...overseas.overseasDetails!, year: val },
                            })
                          }
                          placeholder="e.g. 2022"
                        />
                      </View>
                    </View>
                  </View>
                ) : null}
              </Card>

              {/* Deported */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.overseas.q5.en} hi={PRE_JOURNEY_COPY.overseas.q5.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setOverseas({ ...overseas, beenDeported: opt.val as any })}
                      style={[styles.chip, overseas.beenDeported === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={overseas.beenDeported === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.beenDeported ? <Text style={styles.errorText}>{errors.beenDeported}</Text> : null}
                {overseas.beenDeported === 'yes' ? (
                  <Input
                    label="Deportation details"
                    value={overseas.deportedDetails || ''}
                    onChangeText={(val) => setOverseas({ ...overseas, deportedDetails: val })}
                    placeholder="Specify country, year, and reason..."
                    multiline
                  />
                ) : null}
              </Card>

              {/* Visa Refusal */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.overseas.q6.en} hi={PRE_JOURNEY_COPY.overseas.q6.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setOverseas({ ...overseas, refusedVisaOrEntry: opt.val as any })}
                      style={[styles.chip, overseas.refusedVisaOrEntry === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={overseas.refusedVisaOrEntry === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.refusedVisaOrEntry ? <Text style={styles.errorText}>{errors.refusedVisaOrEntry}</Text> : null}
                {overseas.refusedVisaOrEntry === 'yes' ? (
                  <Input
                    label="Visa refusal details"
                    value={overseas.refusedVisaDetails || ''}
                    onChangeText={(val) => setOverseas({ ...overseas, refusedVisaDetails: val })}
                    placeholder="Specify country, visa type, and reason..."
                    multiline
                  />
                ) : null}
              </Card>

              {/* Overstayed */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.overseas.q7.en} hi={PRE_JOURNEY_COPY.overseas.q7.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setOverseas({ ...overseas, overstayedVisa: opt.val as any })}
                      style={[styles.chip, overseas.overstayedVisa === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={overseas.overstayedVisa === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.overstayedVisa ? <Text style={styles.errorText}>{errors.overstayedVisa}</Text> : null}
                {overseas.overstayedVisa === 'yes' ? (
                  <Input
                    label="Overstay details"
                    value={overseas.overstayedDetails || ''}
                    onChangeText={(val) => setOverseas({ ...overseas, overstayedDetails: val })}
                    placeholder="Specify duration of overstay and resolution..."
                    multiline
                  />
                ) : null}
              </Card>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View style={styles.stepBox}>
              <Text style={styles.sectionHeader}>{PRE_JOURNEY_COPY.recruitment.title.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.recruitment.title.hi}</Text>
              <Text style={styles.sectionDesc}>{PRE_JOURNEY_COPY.recruitment.desc.en}</Text>
              <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.recruitment.desc.hi}</Text>

              {/* Registered with other agency */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.recruitment.q8.en} hi={PRE_JOURNEY_COPY.recruitment.q8.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setRecruitment({ ...recruitment, registeredWithOtherAgency: opt.val as any })}
                      style={[styles.chip, recruitment.registeredWithOtherAgency === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={recruitment.registeredWithOtherAgency === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.registeredWithOtherAgency ? (
                  <Text style={styles.errorText}>{errors.registeredWithOtherAgency}</Text>
                ) : null}
                {recruitment.registeredWithOtherAgency === 'yes' ? (
                  <Input
                    label="Agency / Agent Details (Optional)"
                    value={recruitment.agencyDetails || ''}
                    onChangeText={(val) => setRecruitment({ ...recruitment, agencyDetails: val })}
                    placeholder="Agency name, location, contact details..."
                  />
                ) : null}
              </Card>

              {/* Paid Money */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.recruitment.q9.en} hi={PRE_JOURNEY_COPY.recruitment.q9.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setRecruitment({ ...recruitment, paidMoneyForJob: opt.val as any })}
                      style={[styles.chip, recruitment.paidMoneyForJob === opt.val && styles.chipActive]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={recruitment.paidMoneyForJob === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.paidMoneyForJob ? <Text style={styles.errorText}>{errors.paidMoneyForJob}</Text> : null}
                {recruitment.paidMoneyForJob === 'yes' ? (
                  <Input
                    label="Amount & Payment Details"
                    value={recruitment.paidAmountDetails || ''}
                    onChangeText={(val) => setRecruitment({ ...recruitment, paidAmountDetails: val })}
                    placeholder="Specify amount in INR, agent name, purpose..."
                    multiline
                  />
                ) : null}
              </Card>

              {/* Promised job for money */}
              <Card elevated={false}>
                <EnHi en={PRE_JOURNEY_COPY.recruitment.q10.en} hi={PRE_JOURNEY_COPY.recruitment.q10.hi} />
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() =>
                        setRecruitment({ ...recruitment, promisedGuaranteedJobForMoney: opt.val as any })
                      }
                      style={[
                        styles.chip,
                        recruitment.promisedGuaranteedJobForMoney === opt.val && styles.chipActive,
                      ]}
                    >
                      <ChipLabel
                        en={choiceCopy(opt.val).en}
                        hi={choiceCopy(opt.val).hi}
                        active={recruitment.promisedGuaranteedJobForMoney === opt.val}
                      />
                    </Pressable>
                  ))}
                </View>
                {errors.promisedGuaranteedJobForMoney ? (
                  <Text style={styles.errorText}>{errors.promisedGuaranteedJobForMoney}</Text>
                ) : null}
                {recruitment.promisedGuaranteedJobForMoney === 'yes' ? (
                  <Input
                    label="Promise Details"
                    value={recruitment.promisedJobDetails || ''}
                    onChangeText={(val) => setRecruitment({ ...recruitment, promisedJobDetails: val })}
                    placeholder="Describe who promised job/visa, requested amount..."
                    multiline
                  />
                ) : null}
              </Card>
            </View>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <View style={styles.stepBox}>
              <View style={styles.ackHeaderRow}>
                <View style={styles.flex}>
                  <Text style={styles.sectionHeader}>{PRE_JOURNEY_COPY.ack.title.en}</Text>
                  <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.ack.title.hi}</Text>
                  <Text style={styles.sectionDesc}>{PRE_JOURNEY_COPY.ack.desc.en}</Text>
                  <Text style={styles.hindiLine}>{PRE_JOURNEY_COPY.ack.desc.hi}</Text>
                </View>
                <Pressable onPress={agreeAllAcknowledgements} style={styles.selectAllBtn}>
                  <CheckCircle2 size={16} color={colors.worker} />
                  <Text style={styles.selectAllText}>
                    {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.every((item) => ack[item.key])
                      ? PRE_JOURNEY_COPY.allAccepted.en
                      : PRE_JOURNEY_COPY.selectAll.en}
                  </Text>
                </Pressable>
              </View>

              {errors._general ? <Text style={styles.errorText}>{errors._general}</Text> : null}

              {CANDIDATE_ACKNOWLEDGEMENT_ITEMS.map((item) => {
                const isChecked = Boolean(ack[item.key]);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setAck({ ...ack, [item.key]: !isChecked })}
                    style={[styles.ackCard, isChecked && styles.ackCardChecked]}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked ? <CheckCircle2 size={16} color={colors.surface} /> : null}
                    </View>
                    <View style={styles.ackTextWrap}>
                      <Text style={styles.ackItemText}>{item.text}</Text>
                      <Text style={styles.hindiLine}>{item.textHi}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {step > 0 ? (
            <View style={styles.footerBtn}>
              <Button title={`${PRE_JOURNEY_COPY.back.en} · ${PRE_JOURNEY_COPY.back.hi}`} onPress={handlePrevStep} variant="outline" fullWidth />
            </View>
          ) : null}
          {step === 0 ? (
            <View style={styles.footerBtnWide}>
              <Button
                title="Continue · आगे बढ़ें"
                onPress={handleNextStep}
                fullWidth
              />
            </View>
          ) : step < 4 ? (
            <View style={styles.footerBtn}>
              <Button title={`${PRE_JOURNEY_COPY.next.en} · ${PRE_JOURNEY_COPY.next.hi}`} onPress={handleNextStep} fullWidth />
            </View>
          ) : (
            <View style={styles.footerBtn}>
              <Button title={`${PRE_JOURNEY_COPY.submit.en}`} onPress={handleSubmit} loading={saving} fullWidth />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  headerHindi: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  questionEn: {
    ...typography.body,
    fontWeight: '600',
    color: colors.foreground,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  stepperContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  stepTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    gap: 4,
  },
  stepTabActive: {
    backgroundColor: colors.worker,
  },
  stepTabPast: {
    backgroundColor: colors.workerLight,
  },
  stepTabText: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    fontSize: 11,
  },
  stepTabTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  stepTabTextPast: {
    color: colors.worker,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  stepBox: {
    gap: spacing.md,
  },
  sectionHeader: {
    ...typography.h2,
    color: colors.foreground,
  },
  sectionDesc: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: -spacing.xs,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.worker,
    backgroundColor: colors.workerLight,
  },
  chipText: {
    ...typography.bodySm,
    color: colors.foreground,
  },
  chipTextActive: {
    color: colors.worker,
    fontWeight: '700',
  },
  chipLabel: {
    alignItems: 'center',
  },
  chipHindi: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  chipHindiActive: {
    color: colors.worker,
  },
  hindiLine: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  subInputContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexHalf: {
    flex: 1,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.destructive,
    marginTop: 4,
  },
  infoNotice: {
    backgroundColor: colors.warningLight ?? colors.workerLight,
    borderColor: colors.border,
  },
  infoNoticeTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.foreground,
  },
  infoNoticeText: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  ackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.worker,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  selectAllText: {
    ...typography.bodySm,
    color: colors.worker,
    fontWeight: '600',
  },
  ackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  ackCardChecked: {
    borderColor: colors.worker,
    backgroundColor: colors.workerLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: colors.worker,
    backgroundColor: colors.worker,
  },
  ackItemText: {
    ...typography.bodySm,
    color: colors.foreground,
    flexShrink: 1,
  },
  ackTextWrap: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
  footerBtnWide: {
    flex: 1,
  },
  docsHiTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  docsNotice: {
    borderWidth: 1,
    borderColor: colors.worker,
    backgroundColor: colors.workerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  docsNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  docsEnBody: {
    ...typography.body,
    color: colors.foreground,
    flex: 1,
    fontWeight: '600',
  },
  docsHiBody: {
    ...typography.body,
    color: colors.foreground,
    lineHeight: 22,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.workerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextWrap: {
    flex: 1,
  },
  docEn: {
    ...typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  docHi: {
    ...typography.bodySm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
