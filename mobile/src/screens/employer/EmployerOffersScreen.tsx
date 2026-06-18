import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function EmployerOffersScreen() {
  return (
    <DataListScreen
      title="Offers"
      emptyTitle="No records yet"
      emptySubtitle="Your offers will appear here."
      query={{
        table: 'offers',
        userColumn: 'employer_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
