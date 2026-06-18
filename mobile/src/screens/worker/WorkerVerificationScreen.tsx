import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerVerificationScreen() {
  return (
    <DataListScreen
      title="Verification"
      emptyTitle="No records yet"
      emptySubtitle="Your verification will appear here."
      query={{
        table: 'worker_documents',
        userColumn: 'worker_id',
        orderBy: 'status',
        titleKey: 'document_type',
        subtitleKey: 'status',
        statusKey: 'status',
      }}
    />
  );
}
