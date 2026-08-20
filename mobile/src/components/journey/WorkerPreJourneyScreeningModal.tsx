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
      Alert.alert('Required', 'You must accept all 8 mandatory candidate acknowledgements before proceeding.');
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

  const selectAllAcknowledgements = () => {
    setAck({
      noJobGuarantee: true,
      subjectToEmployerReqs: true,
      subjectToVisaClearance: true,
      tradeTestNoGuarantee: true,
      agreeGenuineInfo: true,
      falseDocConsequences: true,
      agreeMedicalAndTesting: true,
      transparentCharges: true,
    });
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {step === 0 ? 'Documents ready' : 'Pre-Journey Screening'}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {step > 0 && (
        <View style={styles.stepperContainer}>
          {[
            { num: 1, label: 'Medical', icon: Stethoscope },
            { num: 2, label: 'Overseas', icon: Globe },
            { num: 3, label: 'Agent & Fees', icon: UserCheck },
            { num: 4, label: 'Candidate Ack', icon: FileCheck },
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
                  {s.label}
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
              <Text style={styles.sectionHeader}>Medical & Physical Fitness</Text>
              <Text style={styles.sectionDesc}>
                Declare your physical suitability for overseas skilled trade work.
              </Text>

              {/* Question 1 */}
              <Card elevated={false}>
                <Text style={styles.questionText}>
                  1. Do you consider yourself physically fit to perform the essential duties of the trade/job?
                </Text>
                <View style={styles.chipGroup}>
                  {[
                    { val: 'yes', label: 'Yes' },
                    { val: 'no', label: 'No' },
                    { val: 'not_sure', label: 'Not Sure' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setMedical({ ...medical, fitForDuties: opt.val as any })}
                      style={[styles.chip, medical.fitForDuties === opt.val && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, medical.fitForDuties === opt.val && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.fitForDuties ? <Text style={styles.errorText}>{errors.fitForDuties}</Text> : null}
              </Card>

              {/* Question 2 */}
              <Card elevated={false}>
                <Text style={styles.questionText}>
                  2. Do you have any medical condition or physical limitation that may prevent safe job execution?
                </Text>
                <View style={styles.chipGroup}>
                  {[
                    { val: 'no', label: 'No' },
                    { val: 'yes', label: 'Yes' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.val}
                      onPress={() => setMedical({ ...medical, hasMedicalCondition: opt.val as any })}
                      style={[styles.chip, medical.hasMedicalCondition === opt.val && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          medical.hasMedicalCondition === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                <Text style={styles.infoNoticeTitle}>Medical Disclaimer</Text>
                <Text style={styles.infoNoticeText}>
                  This self-declaration does not replace official medical exams required by the destination country or employer.
                </Text>
              </Card>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.stepBox}>
              <Text style={styles.sectionHeader}>Previous Overseas Employment & Immigration</Text>
              <Text style={styles.sectionDesc}>
                Tell us about your prior work experience outside India and immigration history.
              </Text>

              {/* Worked outside India */}
              <Card elevated={false}>
                <Text style={styles.questionText}>3. Have you previously worked outside India?</Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          overseas.workedOutsideIndia === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.workedOutsideIndia ? <Text style={styles.errorText}>{errors.workedOutsideIndia}</Text> : null}
              </Card>

              {/* GCC return */}
              <Card elevated={false}>
                <Text style={styles.questionText}>4. Are you a GCC return worker?</Text>
                <Text style={styles.sectionDesc}>
                  Have you previously worked in a GCC country (UAE, Saudi Arabia, Qatar, Kuwait, Oman or Bahrain)
                  and returned to India?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          overseas.gccReturn === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                <Text style={styles.questionText}>
                  5. Have you ever been deported, removed or repatriated from another country?
                </Text>
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
                      <Text style={[styles.chipText, overseas.beenDeported === opt.val && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
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
                <Text style={styles.questionText}>
                  6. Have you ever been refused entry, refused a work visa, or had a visa cancelled?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          overseas.refusedVisaOrEntry === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                <Text style={styles.questionText}>
                  7. Have you ever overstayed a visa or violated immigration rules in another country?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          overseas.overstayedVisa === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
              <Text style={styles.sectionHeader}>Agent History & Recruitment Fees</Text>
              <Text style={styles.sectionDesc}>
                Help SafeWork protect you against unauthorized agency fees, fraud, or duplicate recruitment.
              </Text>

              {/* Registered with other agency */}
              <Card elevated={false}>
                <Text style={styles.questionText}>
                  8. Have you previously registered with another recruitment agency/agent for this job?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          recruitment.registeredWithOtherAgency === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                <Text style={styles.questionText}>
                  9. Have you already paid money to any person/agency for an overseas job related to this application?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          recruitment.paidMoneyForJob === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                <Text style={styles.questionText}>
                  10. Has anyone promised you a guaranteed overseas job, visa or deployment in exchange for money?
                </Text>
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
                      <Text
                        style={[
                          styles.chipText,
                          recruitment.promisedGuaranteedJobForMoney === opt.val && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
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
                  <Text style={styles.sectionHeader}>Candidate Acknowledgements</Text>
                  <Text style={styles.sectionDesc}>All 8 acknowledgements are mandatory before deployment.</Text>
                </View>
                <Pressable onPress={selectAllAcknowledgements} style={styles.selectAllBtn}>
                  <CheckCircle2 size={16} color={colors.worker} />
                  <Text style={styles.selectAllText}>Select All</Text>
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
                    <Text style={styles.ackItemText}>{item.text}</Text>
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
              <Button title="Back" onPress={handlePrevStep} variant="outline" fullWidth />
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
              <Button title="Next step" onPress={handleNextStep} fullWidth />
            </View>
          ) : (
            <View style={styles.footerBtn}>
              <Button title="Submit declarations" onPress={handleSubmit} loading={saving} fullWidth />
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
  },
  headerTitle: {
    ...typography.h3,
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
  questionText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
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
    flex: 1,
    lineHeight: 18,
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
