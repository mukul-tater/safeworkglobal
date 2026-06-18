import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerInterviewsScreen() {
  return (
    <DataListScreen
      title="Interviews"
      emptyTitle="No records yet"
      emptySubtitle="Your interviews will appear here."
      query={{
        table: 'interviews',
        userColumn: 'worker_id',
        orderBy: 'scheduled_at',
        titleKey: 'status',
        subtitleKey: 'scheduled_at',
        statusKey: 'status',
      }}
    />
  );
}
