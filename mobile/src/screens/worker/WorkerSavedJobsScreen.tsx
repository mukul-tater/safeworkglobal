import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerSavedJobsScreen() {
  return (
    <DataListScreen
      title="Saved Jobs"
      emptyTitle="No records yet"
      emptySubtitle="Your saved jobs will appear here."
      query={{
        table: 'saved_jobs',
        userColumn: 'user_id',
        orderBy: 'created_at',
        titleKey: 'job_id',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
