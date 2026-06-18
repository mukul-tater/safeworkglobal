import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminWorkersScreen() {
  return (
    <DataListScreen
      title="Workers"
      emptyTitle="No records yet"
      emptySubtitle="Your workers will appear here."
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
