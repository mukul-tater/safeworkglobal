import React from 'react';
import { DataListScreen } from '../../components/DataListScreen';

export default function AdminContentModerationScreen() {
  return (
    <DataListScreen
      title="Content Moderation"
      emptyTitle="No records yet"
      emptySubtitle="Your content moderation will appear here."
      query={{
        table: 'content_flags',
        
        orderBy: 'created_at',
        titleKey: 'reason',
        subtitleKey: 'created_at',
        statusKey: 'status',
      }}
    />
  );
}
