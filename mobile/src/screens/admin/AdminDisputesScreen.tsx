import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminDisputesScreen() {
  return (
    <DataListScreen
      title="Disputes"
      emptyTitle="No records yet"
      emptySubtitle="Your disputes will appear here."
      query={{
        table: 'disputes',
        
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
