import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerFormalitiesScreen() {
  return (
    <DataListScreen
      title="Formalities"
      emptyTitle="No records yet"
      emptySubtitle="Your formalities will appear here."
      query={{
        table: 'job_formalities',
        userColumn: 'employer_id',
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
