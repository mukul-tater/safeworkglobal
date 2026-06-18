import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerTravelScreen() {
  return (
    <DataListScreen
      title="Travel & Visa"
      emptyTitle="No records yet"
      emptySubtitle="Your travel & visa will appear here."
      query={{
        table: 'travel_status',
        userColumn: 'worker_id',
        orderBy: 'updated_at',
        titleKey: 'status',
        subtitleKey: 'updated_at',
        statusKey: 'status',
      }}
    />
  );
}
