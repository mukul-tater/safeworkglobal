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
import { useI18n } from '../i18n';

export default function RoleSelectScreen() {
  const { t } = useI18n();
  const { assignRole } = useAuth();
  const [loading, setLoading] = useState<AppRole | null>(null);
  const [error, setError] = useState('');

  const roles: {
    value: AppRole;
    label: string;
    description: string;
    icon: React.ReactNode;
    bg: string;
  }[] = [
    {
      value: 'worker',
      label: t('auth.worker'),
      description: t('role.workerDesc'),
      icon: <HardHat color={colors.worker} size={22} />,
      bg: colors.workerLight,
    },
    {
      value: 'employer',
      label: t('auth.employer'),
      description: t('role.employerDesc'),
      icon: <Briefcase color={colors.employer} size={22} />,
      bg: colors.employerLight,
    },
    {
      value: 'partner',
      label: t('auth.partner'),
      description: t('role.partnerDesc'),
      icon: <Users color={colors.partner} size={22} />,
      bg: colors.partnerLight,
    },
  ];

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
      header={{ title: 'SafeWork Global', subtitle: t('role.setup') }}
    >
      <HeroBanner
        compact
        title={t('role.choose')}
        subtitle={t('role.subtitle')}
      />

      {roles.map((role) => (
        <Card key={role.value}>
          <IconCircle color={role.bg} size={48}>{role.icon}</IconCircle>
          <Text style={styles.roleTitle}>{role.label}</Text>
          <Text style={styles.roleDesc}>{role.description}</Text>
          <Button
            title={t('role.continueAs', { name: role.label })}
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
