import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerReportsScreen() {
  return (
    <DataListScreen
      title="Analytics"
      emptyTitle="No records yet"
      emptySubtitle="Your analytics will appear here."
      query={{
        table: 'jobs',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'metric',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
