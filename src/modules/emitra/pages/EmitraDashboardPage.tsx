import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Users, FileWarning, CalendarCheck, Wrench, CheckCircle2, Plane,
  IndianRupee, UserPlus, Clock, ShieldAlert, ArrowRight, Trophy, Store,
} from 'lucide-react';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import ComplianceGate from '../components/ComplianceGate';
import PartnerTierBadge from '../components/PartnerTierBadge';
import {
  getPartnerProfile, getDashboardStats, getPartnerActivities,
  getPartnerIncentives, getLeaderboardRank, isPartnerOperational,
  isComplianceAcknowledged,
} from '../services/emitraService';
import type { PartnerActivity, PartnerIncentive, PartnerProfile } from '../types/emitra.types';
import { INCENTIVE_AMOUNTS } from '../config/constants';

export default function EmitraDashboardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState({
    totalRegistered: 0,
    documentsPending: 0,
    interviewsScheduled: 0,
    tradeTestsBooked: 0,
    workersSelected: 0,
    workersDeployed: 0,
    earnings: 0,
    verified: 0,
    interviewed: 0,
    selected: 0,
    placed: 0,
    incentivesEarned: 0,
  });
  const [activities, setActivities] = useState<PartnerActivity[]>([]);
  const [incentives, setIncentives] = useState<PartnerIncentive[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const p = await getPartnerProfile(user.id);
    setRow(p);
    if (!p?.submitted_at) {
      navigate('/emitra/register', { replace: true });
      return;
    }
    if (p && await isPartnerOperational(p)) {
      const [s, a, i, r] = await Promise.all([
        getDashboardStats(p.id),
        getPartnerActivities(p.id),
        getPartnerIncentives(p.id),
        getLeaderboardRank(p.id),
      ]);
      setStats(s);
      setActivities(a);
      setIncentives(i);
      setRank(r);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, navigate]);

  if (loading || !row) {
    return (
      <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
        <div className="py-12 text-center text-muted-foreground">Loading dashboard…</div>
      </DashboardLayout>
    );
  }

  const operational = row.status === 'approved' || row.status === 'active';
  const needsCompliance = operational && !isComplianceAcknowledged(row);

  if (needsCompliance) {
    return (
      <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
        <ComplianceGate partnerProfileId={row.id} onAcknowledged={load} />
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Workers Registered', value: stats.totalRegistered, icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Documents Pending', value: stats.documentsPending, icon: FileWarning, color: 'text-amber-600 bg-amber-50' },
    { label: 'Interviews Scheduled', value: stats.interviewsScheduled, icon: CalendarCheck, color: 'text-violet-600 bg-violet-50' },
    { label: 'Trade Tests Booked', value: stats.tradeTestsBooked, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
    { label: 'Workers Selected', value: stats.workersSelected, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Workers Deployed', value: stats.workersDeployed, icon: Plane, color: 'text-sky-600 bg-sky-50' },
    { label: 'Earnings', value: `₹${stats.earnings}`, icon: IndianRupee, color: 'text-amber-700 bg-amber-50' },
  ];

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Partner'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={operational ? 'default' : 'secondary'}>{row.status.replace('_', ' ')}</Badge>
            {row.partner_code && <Badge variant="outline">{row.partner_code}</Badge>}
            <PartnerTierBadge tier={row.tier} />
            {row.center_name && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Store className="h-3.5 w-3.5" /> {row.center_name}
              </span>
            )}
          </div>
        </div>
        {row.status !== 'rejected' && row.status !== 'suspended' && (
          <Button asChild>
            <Link to="/partner/add-worker"><UserPlus className="h-4 w-4 mr-1" /> Add Worker</Link>
          </Button>
        )}
      </div>

      {!operational && (
        <Alert className="mb-6">
          {row.status === 'rejected' ? <ShieldAlert className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <AlertTitle>
            {row.status === 'under_review' ? 'Application Under Review' : `Status: ${row.status}`}
          </AlertTitle>
          <AlertDescription>
            {row.status === 'under_review' && 'Our team is reviewing your application. You will be notified when approved.'}
            {row.info_request_message && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <span className="font-medium">Additional info requested:</span> {row.info_request_message}
              </div>
            )}
            {row.rejection_reason && <div className="mt-2">Reason: {row.rejection_reason}</div>}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex justify-between gap-2 text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-4">
            {rank ? (
              <>
                <p className="text-4xl font-bold text-primary">#{rank}</p>
                <p className="text-sm text-muted-foreground mt-1">Your ranking among partners</p>
                <p className="text-xs text-muted-foreground mt-2">{row.workers_placed || 0} placements</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Rank available after first placement</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Incentive Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Verified worker</span><span>₹{INCENTIVE_AMOUNTS.verified}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Interview qualified</span><span>₹{INCENTIVE_AMOUNTS.interview_qualified}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Successful placement</span><span>₹{INCENTIVE_AMOUNTS.placement}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Earned</span><span>₹{stats.earnings}</span>
            </div>
            {incentives.slice(0, 3).map((inc) => (
              <div key={inc.id} className="text-xs text-muted-foreground flex justify-between">
                <span>{inc.description}</span><span>+₹{inc.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" asChild className="justify-between h-11">
              <Link to="/partner/add-worker">
                <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Add Worker</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-between h-11">
              <Link to="/emitra/workers">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Manage Workers</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-between h-11">
              <Link to="/emitra/notifications">
                <span>View Notifications</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
