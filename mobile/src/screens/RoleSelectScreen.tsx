import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Briefcase, HardHat, Users } from 'lucide-react-native';
import type { AppRole } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import HeroBanner from '../components/HeroBanner';
import ScreenLayout from '../components/layout/ScreenLayout';
import { Button, Card, IconCircle } from '../components/ui';

const roles: {
  value: AppRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
}[] = [
  {
    value: 'worker',
    label: 'Worker',
    description: 'Find international job opportunities',
    icon: <HardHat color={colors.worker} size={22} />,
    bg: colors.workerLight,
  },
  {
    value: 'employer',
    label: 'Employer',
    description: 'Hire skilled workers globally',
    icon: <Briefcase color={colors.employer} size={22} />,
    bg: colors.employerLight,
  },
  {
    value: 'partner',
    label: 'Partner (e-Mitra)',
    description: 'Register workers from your service center',
    icon: <Users color={colors.partner} size={22} />,
    bg: colors.partnerLight,
  },
];

export default function RoleSelectScreen() {
  const { assignRole } = useAuth();
  const [loading, setLoading] = useState<AppRole | null>(null);
  const [error, setError] = useState('');

  const handleSelect = async (role: AppRole) => {
    setLoading(role);
    setError('');
    const result = await assignRole(role);
    if (!result.success) setError(result.error ?? 'Failed to assign role');
    setLoading(null);
  };

  return (
    <ScreenLayout
      variant="full"
      scrollable
      header={{ title: 'SafeWork Global', subtitle: 'Complete your setup' }}
    >
      <HeroBanner
        compact
        title="Choose your role"
        subtitle="Select how you'll use SafeWork Global to get the right dashboard and features."
      />

      {roles.map((role) => (
        <Card key={role.value}>
          <IconCircle color={role.bg} size={48}>{role.icon}</IconCircle>
          <Text style={styles.roleTitle}>{role.label}</Text>
          <Text style={styles.roleDesc}>{role.description}</Text>
          <Button
            title={`Continue as ${role.label}`}
            onPress={() => handleSelect(role.value)}
            loading={loading === role.value}
          />
        </Card>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  roleTitle: { ...typography.h3, marginTop: spacing.md },
  roleDesc: { ...typography.bodySm, marginVertical: spacing.sm },
  error: { ...typography.bodySm, color: colors.destructive },
});
