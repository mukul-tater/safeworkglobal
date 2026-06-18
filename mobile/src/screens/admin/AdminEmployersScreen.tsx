import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminEmployersScreen() {
  return (
    <DataListScreen
      title="Employers"
      emptyTitle="No records yet"
      emptySubtitle="Your employers will appear here."
      query={{
        table: 'employer_profiles',
        
        orderBy: 'updated_at',
        titleKey: 'company_name',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
