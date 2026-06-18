import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerApplicationsScreen() {
  return (
    <DataListScreen
      title="Applications"
      emptyTitle="No records yet"
      emptySubtitle="Your applications will appear here."
      query={{
        table: 'job_applications',
        userColumn: 'worker_id',
        orderBy: 'applied_at',
        titleKey: 'status',
        subtitleKey: 'applied_at',
        statusKey: 'status',
      }}
    />
  );
}
