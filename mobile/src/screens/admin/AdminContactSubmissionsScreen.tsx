import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminContactSubmissionsScreen() {
  return (
    <DataListScreen
      title="Contact Submissions"
      emptyTitle="No records yet"
      emptySubtitle="Your contact submissions will appear here."
      query={{
        table: 'contact_submissions',
        
        orderBy: 'created_at',
        titleKey: 'subject',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
