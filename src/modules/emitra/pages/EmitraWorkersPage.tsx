import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Eye, Users } from 'lucide-react';
import { emitraNavGroups, emitraProfileMenu } from '../config/emitraNav';
import { getPartnerProfile, getPartnerWorkers, isPartnerOperational } from '../services/emitraService';
import { WORKER_SKILLS, WORKER_STATUS_LABELS, WORKER_STATUSES } from '../config/constants';
import type { PartnerWorker } from '../types/emitra.types';
import { MIGRATION_CATEGORY_LABELS } from '../config/constants';

export default function EmitraWorkersPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<PartnerWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('all');
  const [status, setStatus] = useState('all');
  const [passport, setPassport] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const p = await getPartnerProfile(user.id);
      if (!p || !(await isPartnerOperational(p))) {
        setLoading(false);
        return;
      }
      const list = await getPartnerWorkers(p.id, {
        search, skill, status, passportAvailable: passport,
        state: stateFilter, district: districtFilter,
      });
      setWorkers(list);
      setLoading(false);
    })();
  }, [user, search, skill, status, passport, stateFilter, districtFilter]);

  const states = [...new Set(workers.map(w => w.state).filter(Boolean))];
  const districts = [...new Set(workers.map(w => w.district).filter(Boolean))];

  return (
    <DashboardLayout navGroups={emitraNavGroups} portalLabel="E-Mitra Portal" portalName="SafeWork Global" profileMenuItems={emitraProfileMenu}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Workers</h1>
          <p className="text-sm text-muted-foreground">Search and manage registered workers</p>
        </div>
        <Button asChild><Link to="/emitra/onboard-worker"><UserPlus className="h-4 w-4 mr-1" /> Register Worker</Link></Button>
      </div>

      <Card className="p-4 mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, mobile, skill…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger><SelectValue placeholder="Skill" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {WORKER_SKILLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {WORKER_STATUSES.map(s => <SelectItem key={s} value={s}>{WORKER_STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={passport} onValueChange={setPassport}>
            <SelectTrigger><SelectValue placeholder="Passport" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Has Passport</SelectItem>
              <SelectItem value="no">No Passport</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map(d => <SelectItem key={d!} value={d!}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">Loading…</p>
      ) : workers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No workers found</p>
          <Button asChild className="mt-4"><Link to="/emitra/onboard-worker">Register First Worker</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {workers.map(w => (
            <Card key={w.id} className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{w.full_name}</h3>
                    <Badge variant="outline">{WORKER_STATUS_LABELS[w.status]}</Badge>
                    <Badge variant="secondary">{w.skill}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{w.mobile} · {w.district}, {w.state}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Migration: {MIGRATION_CATEGORY_LABELS[w.migration_category]} ({w.migration_readiness_score}/100)
                    {w.passport_available && ' · Passport ✓'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/emitra/workers/${w.id}`}><Eye className="h-4 w-4 mr-1" /> View Profile</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
