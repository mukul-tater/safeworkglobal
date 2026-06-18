import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminECRManagementScreen() {
  return (
    <DataListScreen
      title="ECR Management"
      emptyTitle="No records yet"
      emptySubtitle="Your ecr management will appear here."
      query={{
        table: 'ecr_records',
        
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
