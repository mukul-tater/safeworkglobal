import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerCompanyScreen() {
  return (
    <DataListScreen
      title="Company & KYC"
      emptyTitle="No records yet"
      emptySubtitle="Your company & kyc will appear here."
      query={{
        table: 'employer_profiles',
        userColumn: 'employer_id',
        orderBy: 'updated_at',
        titleKey: 'company_name',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
