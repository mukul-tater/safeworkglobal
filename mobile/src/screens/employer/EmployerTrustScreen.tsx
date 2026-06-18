import React from 'react';
import { InfoScreen } from '../../components/DataListScreen';

export default function EmployerTrustScreen() {
  return (
    <InfoScreen
      title="Why SafeWork Global"
      description="Verified workers, escrow-secured payments, and a faster hiring pipeline — without traditional agent fees."
      bullets={[
        'Save up to 95% vs traditional recruitment agents',
        'Every worker is ID and document verified',
        'Escrow holds funds until work is completed',
        'Shortlists delivered in 7–10 days for pilot batches',
      ]}
    />
  );
}
