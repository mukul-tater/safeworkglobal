import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import ComplianceGate from '../components/ComplianceGate';
import { getPartnerProfile, isComplianceAcknowledged } from '../services/emitraService';
import type { PartnerProfile } from '../types/emitra.types';
import ChangePasswordCard from '@/components/ChangePasswordCard';

const RULES = [
  'Do NOT promise jobs or guarantee employment',
  'Do NOT guarantee visas or immigration outcomes',
  'Do NOT collect unauthorized fees from workers',
  'Do NOT modify or falsify worker documents',
];

export default function EmitraCompliancePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    getPartnerProfile(user.id).then(setProfile);
  }, [user]);

  if (!profile) return null;

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <h1 className="text-2xl font-bold mb-6">Partner Compliance</h1>

      {!isComplianceAcknowledged(profile) ? (
        <ComplianceGate
          partnerProfileId={profile.id}
          onAcknowledged={() => getPartnerProfile(user!.id).then(setProfile)}
        />
      ) : (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-semibold">Compliance Acknowledged</p>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.compliance_acknowledged_at!).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {RULES.map(rule => (
              <div key={rule} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
                {rule}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8">
        <ChangePasswordCard />
      </div>
    </DashboardLayout>
  );
}
