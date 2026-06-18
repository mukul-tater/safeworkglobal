import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminApplicationsScreen() {
  return (
    <DataListScreen
      title="Applications"
      emptyTitle="No records yet"
      emptySubtitle="Your applications will appear here."
      query={{
        table: 'job_applications',
        
        orderBy: 'applied_at',
        titleKey: 'status',
        subtitleKey: 'applied_at',
        statusKey: 'status',
      }}
    />
  );
}
