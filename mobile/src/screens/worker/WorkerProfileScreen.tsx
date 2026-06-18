import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerProfileScreen() {
  return (
    <DataListScreen
      title="Profile"
      emptyTitle="No records yet"
      emptySubtitle="Your profile will appear here."
      query={{
        table: 'worker_profiles',
        userColumn: 'user_id',
        orderBy: 'updated_at',
        titleKey: 'title',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
