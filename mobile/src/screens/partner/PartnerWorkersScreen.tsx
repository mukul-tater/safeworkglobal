import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function PartnerWorkersScreen() {
  return (
    <DataListScreen
      title="Workers"
      emptyTitle="No records yet"
      emptySubtitle="Your workers will appear here."
      query={{
        table: 'partner_workers',
        userColumn: 'partner_id',
        orderBy: 'created_at',
        titleKey: 'worker_id',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
