import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerComplianceScreen() {
  return (
    <DataListScreen
      title="Compliance"
      emptyTitle="No records yet"
      emptySubtitle="Your compliance will appear here."
      query={{
        table: 'compliance_checks',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'report_type',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
