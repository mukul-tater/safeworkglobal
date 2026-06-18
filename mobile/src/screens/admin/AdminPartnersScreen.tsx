import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminPartnersScreen() {
  return (
    <DataListScreen
      title="Partners"
      emptyTitle="No records yet"
      emptySubtitle="Your partners will appear here."
      query={{
        table: 'partner_profiles',
        
        orderBy: 'updated_at',
        titleKey: 'center_name',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
