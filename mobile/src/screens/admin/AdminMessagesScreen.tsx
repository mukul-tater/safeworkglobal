import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminMessagesScreen() {
  return (
    <DataListScreen
      title="Messages"
      emptyTitle="No records yet"
      emptySubtitle="Your messages will appear here."
      query={{
        table: 'messages',
        
        orderBy: 'created_at',
        titleKey: 'subject',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
