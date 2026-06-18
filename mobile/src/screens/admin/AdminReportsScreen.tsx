import { InfoScreen } from '../../components/DataListScreen';

export default function AdminReportsScreen() {
  return (
    <InfoScreen
      title="Reports"
      description="Generate and review platform reports for operations, compliance, and investor updates."
      bullets={[
        'User growth and retention',
        'Job posting and application funnel',
        'Verification backlog',
        'Partner compliance scores',
      ]}
    />
  );
}
