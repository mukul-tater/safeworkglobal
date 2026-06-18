import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import ScreenLayout from '../../components/layout/ScreenLayout';
import { Button, Card, Input, SectionTitle } from '../../components/ui';

export default function EmployerPostJobScreen() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile?.id || !title || !location || !country) {
      Alert.alert('Missing fields', 'Title, location, and country are required.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('jobs').insert({
      title,
      location,
      country,
      description,
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
      currency: 'USD',
      employer_id: profile.id,
      status: 'PENDING',
      experience_level: 'Mid-Level',
      job_type: 'Full-time',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Failed to post job', error.message);
      return;
    }

    Alert.alert('Job submitted', 'Your job has been submitted for verification.');
    setTitle('');
    setLocation('');
    setCountry('');
    setDescription('');
    setSalaryMin('');
    setSalaryMax('');
  };

  return (
    <ScreenLayout variant="stack" scrollable keyboard>
      <SectionTitle title="Post a Job" subtitle="Submit a new job for verification" />
      <Card>
        <Input label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Construction Supervisor" />
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="City or region" />
        <Input label="Country" value={country} onChangeText={setCountry} placeholder="e.g. UAE" />
        <Input label="Min Salary (USD)" value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" />
        <Input label="Max Salary (USD)" value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" />
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
});
