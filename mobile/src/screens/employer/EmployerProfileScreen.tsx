import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerProfileScreen() {
  return (
    <DataListScreen
      title="My Profile"
      emptyTitle="No records yet"
      emptySubtitle="Your my profile will appear here."
      query={{
        table: 'employer_profiles',
        userColumn: 'user_id',
        orderBy: 'updated_at',
        titleKey: 'company_name',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
