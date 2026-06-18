import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerManageJobsScreen() {
  return (
    <DataListScreen
      title="Manage Jobs"
      emptyTitle="No records yet"
      emptySubtitle="Your manage jobs will appear here."
      query={{
        table: 'jobs',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'title',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
