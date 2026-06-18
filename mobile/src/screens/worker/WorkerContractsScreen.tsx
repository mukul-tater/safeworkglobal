import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerContractsScreen() {
  return (
    <DataListScreen
      title="Contracts"
      emptyTitle="No records yet"
      emptySubtitle="Your contracts will appear here."
      query={{
        table: 'contracts',
        userColumn: 'worker_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
