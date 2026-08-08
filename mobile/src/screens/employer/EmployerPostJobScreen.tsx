import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

const JOB_TYPES = ['Full-time', 'Contract', 'Temporary'] as const;
const EXPERIENCE = ['Entry-Level', 'Mid-Level', 'Senior', 'Supervisor'] as const;
const CURRENCIES = ['USD', 'AED', 'SAR', 'QAR', 'INR'] as const;

export default function EmployerPostJobScreen() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('UAE');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState<string>('AED');
  const [jobType, setJobType] = useState<string>('Full-time');
  const [experience, setExperience] = useState<string>('Mid-Level');
  const [visaSponsorship, setVisaSponsorship] = useState(true);
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile?.id || !title || !location || !country || !description) {
      Alert.alert('Missing fields', 'Title, location, country, and description are required.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('jobs').insert({
      title: title.trim(),
      location: location.trim(),
      country: country.trim(),
      description: description.trim(),
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
      currency,
      employer_id: profile.id,
      status: 'PENDING',
      experience_level: experience,
      job_type: jobType,
      visa_sponsorship: visaSponsorship,
      skills_required: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    } as any);
    setLoading(false);

    if (error) {
      Alert.alert('Failed to post job', error.message);
      return;
    }

    Alert.alert('Job submitted', 'Your job has been submitted for verification.');
    setTitle('');
    setLocation('');
    setDescription('');
    setSalaryMin('');
    setSalaryMax('');
    setSkills('');
  };

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle title="Post a Job" subtitle="Submit a new job for verification" />
      <Card>
        <Input label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Construction Supervisor" />
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="City or region" />
        <Input label="Country" value={country} onChangeText={setCountry} placeholder="e.g. UAE" />
        <Text style={styles.label}>Job type</Text>
        <View style={styles.chips}>
          {JOB_TYPES.map((t) => (
            <Pressable key={t} onPress={() => setJobType(t)} style={[styles.chip, jobType === t && styles.chipOn]}>
              <Text style={[styles.chipText, jobType === t && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Experience</Text>
        <View style={styles.chips}>
          {EXPERIENCE.map((t) => (
            <Pressable key={t} onPress={() => setExperience(t)} style={[styles.chip, experience === t && styles.chipOn]}>
              <Text style={[styles.chipText, experience === t && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Currency</Text>
        <View style={styles.chips}>
          {CURRENCIES.map((t) => (
            <Pressable key={t} onPress={() => setCurrency(t)} style={[styles.chip, currency === t && styles.chipOn]}>
              <Text style={[styles.chipText, currency === t && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Input label={`Min Salary (${currency})`} value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" />
        <Input label={`Max Salary (${currency})`} value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" />
        <Input
          label="Skills (comma separated)"
          value={skills}
          onChangeText={setSkills}
          placeholder="Electrician, Welding, Scaffolding"
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: visaSponsorship }}
          onPress={() => setVisaSponsorship((v) => !v)}
          style={styles.visaRow}
        >
          <View style={[styles.box, visaSponsorship && styles.boxOn]} />
          <Text style={styles.visaText}>Visa sponsorship available</Text>
        </Pressable>
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={styles.textarea}
          placeholder="Describe the role, requirements, and benefits"
        />
        <Button title="Submit Job" onPress={handleSubmit} loading={loading} size="lg" />
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  label: { ...typography.bodySm, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipOn: { backgroundColor: colors.employerLight, borderColor: colors.employer },
  chipText: { ...typography.bodySm },
  chipTextOn: { color: colors.employer, fontWeight: '700' },
  visaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border },
  boxOn: { backgroundColor: colors.employer, borderColor: colors.employer },
  visaText: { ...typography.bodySm },
});
