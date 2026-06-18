import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerContractHistoryScreen() {
  return (
    <DataListScreen
      title="Contract History"
      emptyTitle="No records yet"
      emptySubtitle="Your contract history will appear here."
      query={{
        table: 'contract_history',
        userColumn: 'worker_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
