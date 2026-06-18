import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

export default function PartnerRegisterWorkerScreen() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile?.id || !fullName || !phone) {
      Alert.alert('Missing fields', 'Name and phone are required.');
      return;
    }

    setLoading(true);
    const { error } = await (supabase as any).from('partner_workers').insert({
      partner_id: profile.id,
      full_name: fullName,
      phone,
      email: email || null,
      status: 'REGISTERED',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error.message);
      return;
    }

    Alert.alert('Worker registered', 'The worker has been added to your center.');
    setFullName('');
    setPhone('');
    setEmail('');
  };

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle title="Register Worker" subtitle="Add a new worker to your E-Mitra center" />
      <Card>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Worker's full name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 XXXXX XXXXX" />
        <Input label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="worker@email.com" />
        <Button title="Register Worker" onPress={handleSubmit} loading={loading} size="lg" />
      </Card>
    </ScreenLayout>
  );
}
