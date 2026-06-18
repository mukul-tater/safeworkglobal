import { InfoScreen } from '../../components/DataListScreen';

export default function AdminInvestorDashboardScreen() {
  return (
    <InfoScreen
      title="Investor Dashboard"
      description="Track platform growth, verified placements, escrow volume, and compliance metrics."
      bullets={[
        'Monthly active workers and employers',
        'Verified job placements',
        'Escrow payment volume',
        'Dispute resolution rate',
      ]}
    />
  );
}
