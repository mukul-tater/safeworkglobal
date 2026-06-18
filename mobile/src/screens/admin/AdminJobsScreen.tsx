import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminJobsScreen() {
  return (
    <DataListScreen
      title="All Jobs"
      emptyTitle="No records yet"
      emptySubtitle="Your all jobs will appear here."
      query={{
        table: 'jobs',
        
        orderBy: 'created_at',
        titleKey: 'title',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
