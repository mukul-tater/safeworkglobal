import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerSearchWorkersScreen() {
  return (
    <DataListScreen
      title="Search Workers"
      emptyTitle="No records yet"
      emptySubtitle="Your search workers will appear here."
      query={{
        table: 'worker_profiles',
        
        orderBy: 'updated_at',
        titleKey: 'headline',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
