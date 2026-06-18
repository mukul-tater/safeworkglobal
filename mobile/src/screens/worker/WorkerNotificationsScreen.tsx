import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function WorkerNotificationsScreen() {
  return (
    <DataListScreen
      title="Notifications"
      emptyTitle="No records yet"
      emptySubtitle="Your notifications will appear here."
      query={{
        table: 'notifications',
        userColumn: 'user_id',
        orderBy: 'created_at',
        titleKey: 'title',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
