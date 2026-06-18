import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerDocumentsScreen() {
  return (
    <DataListScreen
      title="Documents"
      emptyTitle="No records yet"
      emptySubtitle="Your documents will appear here."
      query={{
        table: 'worker_documents',
        userColumn: 'worker_id',
        orderBy: 'uploaded_at',
        titleKey: 'document_type',
        subtitleKey: 'uploaded_at',
        statusKey: 'status',
      }}
    />
  );
}
