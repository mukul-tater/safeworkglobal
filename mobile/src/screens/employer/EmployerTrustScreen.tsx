import React from 'react';
import { InfoScreen } from '../../components/DataListScreen';

export default function EmployerTrustScreen() {
  return (
    <InfoScreen
      title="Why employers choose SafeWork Global"
      description="Access India's skilled workforce through a structured, skill-first pipeline — built for UAE hiring, without traditional agent fees."
      bullets={[
        "Access skilled workers across India via E-Mitra/CSC, ITIs, and skill-verification partners",
        'Hire for the actual skill — technical screening, interviews, and physical trade tests',
        "Simple 1% of the worker's monthly gross salary for the duration of employment",
        'Share trade, experience, salary, location, and joining timeline — we build the pipeline around it',
        'Sourcing, verification, trade testing, documentation, and licensed-partner deployment in one workflow',
      ]}
    />
  );
}
