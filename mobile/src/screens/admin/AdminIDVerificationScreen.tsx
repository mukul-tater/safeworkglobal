import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminIDVerificationScreen() {
  return (
    <DataListScreen
      title="ID Verification"
      emptyTitle="No records yet"
      emptySubtitle="Your id verification will appear here."
      query={{
        table: 'id_verifications',
        
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
