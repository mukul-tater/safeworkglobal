import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerApplicationTrackingScreen() {
  return (
    <DataListScreen
      title="Application Tracking"
      emptyTitle="No records yet"
      emptySubtitle="Your application tracking will appear here."
      query={{
        table: 'job_applications',
        userColumn: 'worker_id',
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
