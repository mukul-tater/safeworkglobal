import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminPartnerWorkersScreen() {
  return (
    <DataListScreen
      title="E-Mitra Workers"
      emptyTitle="No records yet"
      emptySubtitle="Your e-mitra workers will appear here."
      query={{
        table: 'partner_workers',
        
        orderBy: 'created_at',
        titleKey: 'worker_id',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
