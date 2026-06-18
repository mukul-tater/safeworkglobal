import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerSavedSearchesScreen() {
  return (
    <DataListScreen
      title="Saved Searches"
      emptyTitle="No records yet"
      emptySubtitle="Your saved searches will appear here."
      query={{
        table: 'saved_searches',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'name',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
