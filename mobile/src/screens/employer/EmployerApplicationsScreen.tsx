import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerApplicationsScreen() {
  return (
    <DataListScreen
      title="Applications"
      emptyTitle="No records yet"
      emptySubtitle="Your applications will appear here."
      query={{
        table: 'job_applications',
        userColumn: 'employer_id',
        orderBy: 'applied_at',
        titleKey: 'status',
        subtitleKey: 'applied_at',
        statusKey: 'status',
      }}
    />
  );
}
