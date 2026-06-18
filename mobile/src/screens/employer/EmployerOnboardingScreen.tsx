import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

export default function EmployerOnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [businessType, setBusinessType] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('employer_profiles')
        .select('company_name, country, business_type')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCompanyName(data.company_name ?? '');
        setCountry(data.country ?? '');
        setBusinessType(data.business_type ?? '');
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const handleComplete = async () => {
    if (!user?.id || !fullName.trim() || !phone.trim() || !companyName.trim()) {
      Alert.alert('Missing fields', 'Name, phone, and company name are required.');
      return;
    }

    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      const { error: employerErr } = await supabase.from('employer_profiles').upsert(
        {
          user_id: user.id,
          company_name: companyName.trim(),
          country: country.trim() || null,
          business_type: businessType.trim() || null,
          onboarding_completed: true,
        },
        { onConflict: 'user_id' },
      );
      if (employerErr) throw employerErr;

      await refreshProfile();
      navigation.navigate('EmployerDashboard');
      Alert.alert('Welcome!', 'Your employer profile is ready. You can now post jobs and search workers.');
    } catch (error) {
      Alert.alert(
        'Setup failed',
        error instanceof Error ? error.message : 'Could not save your profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle
        title="Set Up Your Business"
        subtitle="Complete your employer profile to access hiring tools."
      />
      <Card>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 98765 43210" />
        <Input label="Company Name" value={companyName} onChangeText={setCompanyName} placeholder="Your company" />
        <Input label="Country" value={country} onChangeText={setCountry} placeholder="e.g. UAE" />
        <Input label="Business Type" value={businessType} onChangeText={setBusinessType} placeholder="e.g. Construction" />
        <Button title="Complete Setup" onPress={handleComplete} loading={saving} size="lg" />
      </Card>
    </ScreenLayout>
  );
}
