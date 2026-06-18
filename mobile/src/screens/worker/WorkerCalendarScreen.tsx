import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerCalendarScreen() {
  return (
    <DataListScreen
      title="Calendar"
      emptyTitle="No records yet"
      emptySubtitle="Your calendar will appear here."
      query={{
        table: 'calendar_events',
        userColumn: 'user_id',
        orderBy: 'start_time',
        titleKey: 'title',
        subtitleKey: 'start_time',
        statusKey: 'status',
      }}
    />
  );
}
