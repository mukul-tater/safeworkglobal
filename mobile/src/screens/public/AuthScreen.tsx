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
import { Button, Card, Input } from '../../components/ui';
import { useI18n } from '../../i18n';
import { isSyntheticAuthEmail, workerAuthEmailFromIdentifier } from '../../lib/workerAuthEmail';
import { SAFEWORK_CONTACT } from '../../config/workerSupport';
import { passwordSignupIssue, sanitizePasswordInput, PASSWORD_HINT } from '../../lib/password';
import { continueAuth, parseAuthIdentifier, type AuthPortalRole } from '../../lib/authContinue';

type Props = NativeStackScreenProps<PublicStackParamList, 'Auth'>;

export default function AuthScreen({ route }: Props) {
  const { t } = useI18n();
  const roleHint = route.params?.role;
  const { login, signup, assignRole, loginWithGoogle } = useAuth();

  const [phase, setPhase] = useState<'identifier' | 'login' | 'signup'>('identifier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole | null>(roleHint ?? null);

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
      label: t('auth.worker'),
      description: t('auth.workerDesc'),
      icon: <HardHat color={colors.worker} size={20} />,
      bg: colors.workerLight,
      accent: colors.worker,
    },
    {
      value: 'employer',
      label: t('auth.employer'),
      description: t('auth.employerDesc'),
      icon: <Briefcase color={colors.employer} size={20} />,
      bg: colors.employerLight,
      accent: colors.employer,
    },
    {
      value: 'partner',
      label: t('auth.partner'),
      description: t('auth.partnerDesc'),
      icon: <Users color={colors.partner} size={20} />,
      bg: colors.partnerLight,
      accent: colors.partner,
    },
  ];

  const handleContinue = async () => {
    setError('');
    if (!role) {
      setError('Select Worker, Employer, or Partner to continue.');
      return;
    }
    const parsed = parseAuthIdentifier(email || phone);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setLoading(true);
    const result = await continueAuth({
      role: role as AuthPortalRole,
      email: parsed.method === 'email' ? parsed.email : undefined,
      mobile: parsed.method === 'mobile' ? parsed.mobile : undefined,
    });
    setLoading(false);
    if (parsed.method === 'email') setEmail(parsed.email);
    if (parsed.method === 'mobile') setPhone(parsed.mobile);
    if (result.nextStep === 'RATE_LIMITED' || result.nextStep === 'ERROR') {
      setError(result.error ?? 'Something went wrong. Please try again.');
      return;
    }
    if (result.nextStep === 'ACCOUNT_CONFLICT' || result.nextStep === 'WRONG_PORTAL') {
      setError(result.error ?? 'This identifier belongs to a different account.');
      return;
    }
    if (result.nextStep === 'SIGNUP') {
      setPhase('signup');
      return;
    }
    setPhase('login');
  };

  const handleForgotPassword = async () => {
    setError('');
    const resolved = workerAuthEmailFromIdentifier(email);
    if (!resolved || !resolved.includes('@')) {
      setError('Enter the email you use to sign in. Password reset is sent by email.');
      return;
    }
    if (isSyntheticAuthEmail(resolved)) {
      setError(
        'This account was created with mobile only and has no email inbox. Use the email from signup, or contact SafeWork support.',
      );
      return;
    }
    setLoading(true);
    const { supabase } = await import('../../integrations/supabase/client');
    const rolePath =
      role === 'employer' ? '/employer/login' : role === 'partner' ? '/partner/login' : '/worker/login';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolved, {
      redirectTo: `${SAFEWORK_CONTACT.websiteUrl}/reset-password?next=${encodeURIComponent(rolePath)}`,
    });
    setLoading(false);
    if (resetError) setError(resetError.message);
    else setError('If an account exists for that email, a reset link has been sent. Open it in your browser, then sign in here.');
  };

  const handleSubmit = async () => {
    setError('');
    if (phase === 'login' && !password) {
      setError('Password is required.');
      return;
    }
    if (phase === 'signup') {
      const passwordIssue = passwordSignupIssue(password);
      if (passwordIssue) {
        setError(passwordIssue);
        return;
      }
    } else if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    if (phase === 'login') {
      const identifier = email.includes('@') ? email.trim() : workerAuthEmailFromIdentifier(phone || email) || email.trim();
      const result = await login(identifier, password);
      if (!result.success) setError(result.error ?? 'Login failed');
    } else {
      if (!fullName || !phone || !role) {
        setError('Name, phone, and role are required to create your account.');
        setLoading(false);
        return;
      }
      if (role === 'worker' && !acceptedTerms) {
        setError('Accept the worker terms to continue.');
        setLoading(false);
        return;
      }
      if (!email.includes('@')) {
        setError('Use a real email to create your account. You can continue later with mobile or email.');
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
          setPhase('login');
          setError('Account created. Continue after verifying your email.');
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
          {phase === 'signup'
            ? t('auth.createAccount')
            : phase === 'login'
              ? t('auth.welcomeBack')
              : 'Continue'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {phase === 'identifier'
            ? 'Enter your mobile number or email. We’ll take you to the next step.'
            : phase === 'login'
              ? t('auth.signInBody')
              : t('auth.signUpBody')}
        </Text>
      </View>

      <Card elevated style={styles.formCard}>
        {phase === 'identifier' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('auth.selectRole')}</Text>
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
            </View>
            <Input
              label={t('auth.emailOrMobile')}
              value={email || phone}
              onChangeText={(v) => {
                if (v.includes('@') || /[a-zA-Z]/.test(v)) {
                  setEmail(v);
                  setPhone('');
                } else {
                  setPhone(v.replace(/\D/g, '').slice(0, 10));
                  setEmail('');
                }
              }}
              keyboardType="default"
              autoCapitalize="none"
              placeholder="email@example.com or 10-digit mobile"
              accessibilityLabel="Email or mobile"
            />
          </>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {phase === 'signup' ? (
          <View style={styles.section}>
            <Input
              label={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder={t('auth.fullNamePlaceholder')}
              accessibilityLabel="Full name"
            />
            <Input
              label={t('auth.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              accessibilityLabel="Phone number"
            />
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
              accessibilityLabel="Email"
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
                  {t('auth.terms')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {phase !== 'identifier' ? (
          <>
            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={(v) => setPassword(phase === 'signup' ? sanitizePasswordInput(v) : v)}
              secureTextEntry={!showPassword}
              placeholder={phase === 'signup' ? PASSWORD_HINT : t('auth.passwordPlaceholder')}
              accessibilityLabel="Password"
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPassword((v) => !v)}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</Text>
            </Pressable>
          </>
        ) : null}
        {phase === 'login' ? (
          <Pressable accessibilityRole="button" onPress={handleForgotPassword} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('auth.forgot')}</Text>
          </Pressable>
        ) : null}

        <Button
          title={phase === 'identifier' ? 'Continue' : phase === 'login' ? 'Continue' : t('home.createAccount')}
          onPress={phase === 'identifier' ? handleContinue : handleSubmit}
          loading={loading}
          size="lg"
          fullWidth
        />

        {phase !== 'identifier' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError('');
              setPhase('identifier');
              setPassword('');
            }}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>Use a different mobile or email</Text>
          </Pressable>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
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
          <Text style={styles.googleBtnText}>{t('auth.google')}</Text>
        </Pressable>
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
    maxWidth: 340,
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
