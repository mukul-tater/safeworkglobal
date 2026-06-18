import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminJobVerificationScreen() {
  return (
    <DataListScreen
      title="Job Verification"
      emptyTitle="No records yet"
      emptySubtitle="Your job verification will appear here."
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
