import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerOffersScreen() {
  return (
    <DataListScreen
      title="Job Offers"
      emptyTitle="No records yet"
      emptySubtitle="Your job offers will appear here."
      query={{
        table: 'job_offers',
        userColumn: 'worker_id',
        orderBy: 'created_at',
        titleKey: 'status',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
