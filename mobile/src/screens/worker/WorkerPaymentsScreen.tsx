import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerPaymentsScreen() {
  return (
    <DataListScreen
      title="Payments"
      emptyTitle="No records yet"
      emptySubtitle="Your payments will appear here."
      query={{
        table: 'worker_payments',
        userColumn: 'worker_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
