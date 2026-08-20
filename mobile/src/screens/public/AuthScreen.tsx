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
  const { login, signup, assignRole, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole | null>(roleHint ?? null);

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleForgotPassword = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter your account email to reset password.');
      return;
    }
    setLoading(true);
    const { supabase } = await import('../../integrations/supabase/client');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) setError(resetError.message);
    else setError('Password reset email sent (if the account exists).');
  };

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError(mode === 'login'
        ? 'Email/mobile and password are required.'
        : 'Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
      if (role === 'worker' && !acceptedTerms) {
        setError('Accept the worker terms to continue.');
        setLoading(false);
        return;
      }
      if (!email.includes('@')) {
        setError('Use a real email for signup. You can sign in later with mobile or email.');
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success && !result.cancelled) {
      setError(result.error ?? 'Google sign-in failed');
    }
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
              accessibilityLabel="Full name"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              accessibilityLabel="Phone number"
            />
            {role === 'worker' ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                onPress={() => setAcceptedTerms((v) => !v)}
                style={styles.termsRow}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}>
                  {acceptedTerms ? <Check size={12} color="#fff" /> : null}
                </View>
                <Text style={styles.termsText}>
                  I agree to SafeWork worker terms, privacy policy, and fair recruitment rules.
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Input
          label={mode === 'login' ? 'Email or mobile' : 'Email'}
          value={email}
          onChangeText={setEmail}
          keyboardType={mode === 'login' ? 'default' : 'email-address'}
          autoCapitalize="none"
          placeholder={mode === 'login' ? 'email@example.com or 10-digit mobile' : 'you@email.com'}
          accessibilityLabel={mode === 'login' ? 'Email or mobile' : 'Email'}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Min 6 characters"
          accessibilityLabel="Password"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPassword((v) => !v)}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </Pressable>
        {mode === 'login' ? (
          <Pressable accessibilityRole="button" onPress={handleForgotPassword} style={styles.linkBtn}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        ) : null}

        <Button
          title={mode === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          fullWidth
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.googleBtnPressed,
            loading && styles.googleBtnDisabled,
          ]}
        >
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>

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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginHorizontal: spacing.sm,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  googleBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleBtnText: {
    ...typography.button,
    color: colors.foreground,
    fontWeight: '600',
  },
  linkBtn: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  linkText: { ...typography.bodySm, color: colors.primary, fontWeight: '600' },
  termsRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.worker, borderColor: colors.worker },
  termsText: { ...typography.bodySm, flex: 1 },
});
