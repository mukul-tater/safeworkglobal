import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Briefcase, Check, HardHat, Users } from 'lucide-react-native';
import type { AppRole } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import type { PublicStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { BrandLogo } from '../../components/layout/AppHeader';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SegmentedControl } from '../../components/ui';

type Props = NativeStackScreenProps<PublicStackParamList, 'Auth'>;

const roles: {
  value: AppRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  accent: string;
}[] = [
  {
    value: 'worker',
    label: 'Worker',
    description: 'Find international job opportunities',
    icon: <HardHat color={colors.worker} size={20} />,
    bg: colors.workerLight,
    accent: colors.worker,
  },
  {
    value: 'employer',
    label: 'Employer',
    description: 'Hire skilled workers globally',
    icon: <Briefcase color={colors.employer} size={20} />,
    bg: colors.employerLight,
    accent: colors.employer,
  },
  {
    value: 'partner',
    label: 'Partner',
    description: 'Register workers from your center',
    icon: <Users color={colors.partner} size={20} />,
    bg: colors.partnerLight,
    accent: colors.partner,
  },
];

export default function AuthScreen({ route }: Props) {
  const initialMode = route.params?.mode ?? 'login';
  const roleHint = route.params?.role;
  const { login, signup, assignRole } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole | null>(roleHint ?? null);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const result = await login(email.trim(), password);
      if (!result.success) setError(result.error ?? 'Login failed');
    } else {
      if (!fullName || !phone || !role) {
        setError('Name, phone, and role are required for signup.');
        setLoading(false);
        return;
      }
      const result = await signup({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role,
      });
      if (!result.success) {
        setError(result.error ?? 'Signup failed');
      } else {
        const loginResult = await login(email.trim(), password);
        if (!loginResult.success) {
          setMode('login');
          setError('Account created. Sign in after verifying your email.');
        } else if (role) {
          await assignRole(role);
        }
      }
    }
    setLoading(false);
  };

  return (
    <ScreenLayout variant="tab" scrollable keyboard contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandLogo size={52} />
        <Text style={styles.heroTitle}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {mode === 'login'
            ? 'Sign in to your SafeWork Global account'
            : 'Join the verified global jobs platform'}
        </Text>
      </View>

      <Card elevated style={styles.formCard}>
        <SegmentedControl
          options={[
            { value: 'login', label: 'Sign In' },
            { value: 'signup', label: 'Sign Up' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {mode === 'signup' ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select your role</Text>
            <View style={styles.roleList}>
              {roles.map((item) => {
                const selected = role === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setRole(item.value)}
                    style={({ pressed }) => [
                      styles.roleCard,
                      selected && styles.roleCardSelected,
                      pressed && styles.roleCardPressed,
                    ]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: item.bg }]}>
                      {item.icon}
                    </View>
                    <View style={styles.roleCopy}>
                      <Text style={styles.roleTitle}>{item.label}</Text>
                      <Text style={styles.roleDesc}>{item.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.roleCheck,
                        selected && { backgroundColor: item.accent, borderColor: item.accent },
                      ]}
                    >
                      {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder="Your full name"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
            />
          </View>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@email.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Min 6 characters"
        />

        <Button
          title={mode === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          fullWidth
        />

        <Text style={styles.footerHint}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Text
            style={styles.footerLink}
            onPress={() => {
              setError('');
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Text>
        </Text>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  heroTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.bodySm,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  formCard: {
    marginBottom: 0,
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  roleList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleCardSelected: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryTint,
  },
  roleCardPressed: {
    opacity: 0.92,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCopy: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  roleDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  roleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: colors.destructiveLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  error: {
    color: colors.destructive,
    fontSize: 14,
  },
  footerHint: {
    ...typography.bodySm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
