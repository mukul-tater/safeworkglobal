import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminComplianceScreen() {
  return (
    <DataListScreen
      title="Compliance"
      emptyTitle="No records yet"
      emptySubtitle="Your compliance will appear here."
      query={{
        table: 'compliance_checks',
        
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
