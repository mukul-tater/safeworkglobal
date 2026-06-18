import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function PartnerComplianceScreen() {
  return (
    <DataListScreen
      title="Compliance"
      emptyTitle="No records yet"
      emptySubtitle="Your compliance will appear here."
      query={{
        table: 'partner_compliance',
        userColumn: 'partner_id',
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
