import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerOnboardingScreen() {
  return (
    <DataListScreen
      title="Onboarding"
      emptyTitle="No records yet"
      emptySubtitle="Your onboarding will appear here."
      query={{
        table: 'worker_onboarding',
        userColumn: 'user_id',
        orderBy: 'updated_at',
        titleKey: 'step',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
