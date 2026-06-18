import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminDocumentVerificationScreen() {
  return (
    <DataListScreen
      title="Documents"
      emptyTitle="No records yet"
      emptySubtitle="Your documents will appear here."
      query={{
        table: 'worker_documents',
        
        orderBy: 'status',
        titleKey: 'document_type',
        subtitleKey: 'status',
        statusKey: 'status',
      }}
    />
  );
}
