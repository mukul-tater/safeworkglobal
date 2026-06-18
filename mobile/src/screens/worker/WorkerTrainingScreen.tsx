import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerTrainingScreen() {
  return (
    <DataListScreen
      title="Training & PDOT"
      emptyTitle="No records yet"
      emptySubtitle="Your training & pdot will appear here."
      query={{
        table: 'worker_training',
        userColumn: 'worker_id',
        orderBy: 'status',
        titleKey: 'course_name',
        subtitleKey: 'status',
        statusKey: 'status',
      }}
    />
  );
}
