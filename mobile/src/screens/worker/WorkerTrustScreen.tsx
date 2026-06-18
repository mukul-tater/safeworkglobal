import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerTrustScreen() {
  return (
    <DataListScreen
      title="Trust Score"
      emptyTitle="No records yet"
      emptySubtitle="Your trust score will appear here."
      query={{
        table: 'worker_trust_scores',
        userColumn: 'worker_id',
        orderBy: 'updated_at',
        titleKey: 'score',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
