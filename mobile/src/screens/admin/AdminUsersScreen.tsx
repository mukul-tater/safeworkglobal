import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminUsersScreen() {
  return (
    <DataListScreen
      title="All Users"
      emptyTitle="No records yet"
      emptySubtitle="Your all users will appear here."
      query={{
        table: 'profiles',
        
        orderBy: 'created_at',
        titleKey: 'full_name',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
