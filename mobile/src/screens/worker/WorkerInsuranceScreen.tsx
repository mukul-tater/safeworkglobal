import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerInsuranceScreen() {
  return (
    <DataListScreen
      title="Insurance"
      emptyTitle="No records yet"
      emptySubtitle="Your insurance will appear here."
      query={{
        table: 'insurance_policies',
        userColumn: 'worker_id',
        orderBy: 'status',
        titleKey: 'policy_type',
        subtitleKey: 'status',
        statusKey: 'status',
      }}
    />
  );
}
