import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerShortlistScreen() {
  return (
    <DataListScreen
      title="Shortlist"
      emptyTitle="No records yet"
      emptySubtitle="Your shortlist will appear here."
      query={{
        table: 'shortlisted_workers',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'worker_id',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
