import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerEscrowScreen() {
  return (
    <DataListScreen
      title="Payments"
      emptyTitle="No records yet"
      emptySubtitle="Your payments will appear here."
      query={{
        table: 'payments',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
