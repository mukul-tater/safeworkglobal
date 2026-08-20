import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatExpectedSalary } from '@/lib/utils';
import { employerNavGroups, employerProfileMenu } from "@/config/employerNav";
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Award, Globe, Mail, Star, Check, Play, ShieldCheck, Video, Languages, X, GitCompareArrows } from 'lucide-react';
import WorkerSearchFilters, { type WorkerFilters } from '@/components/search/WorkerSearchFilters';
import SavedSearchDialog from '@/components/search/SavedSearchDialog';
import WorkerComparisonDrawer, { type CompareWorker } from '@/components/employer/WorkerComparisonDrawer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { fetchEmployerVisibleFields, fetchEmployerWorkers, toVisibilityMap, type FieldVisibilityMap } from '@/services/employerWorkerAccessService';
import { Link } from 'react-router-dom';
import { WorkerListSkeleton } from '@/components/ui/page-skeleton';
import PortalBreadcrumb from "@/components/PortalBreadcrumb";
import EmployerFlowStepper from "@/components/employer/EmployerFlowStepper";
import SendJobRequestDialog from "@/components/employer/SendJobRequestDialog";
import { ArrowRight } from "lucide-react";
import { WORKER_SORT_OPTIONS } from "@/lib/constants";

interface Worker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  nationality: string | null;
  current_location: string | null;
  years_of_experience: number | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  currency: string;
  availability: string | null;
  has_passport: boolean;
  has_visa: boolean;
  primary_work_type: string | null;
  skill_level: string | null;
  skills: Array<{ skill_name: string }>;
  // New trust fields
  video_url: string | null;
  verified_documents: string[];
  certifications_count: number;
  languages: string[];
  open_to_relocation: boolean;
  preferred_shift: string | null;
  ecr_status: string | null;
  last_active_at: string | null;
}

const DEFAULT_FILTERS: WorkerFilters = {
  keyword: '',
  nationality: 'All Nationalities',
  currentLocation: '',
  skills: [],
  experienceYears: [0, 30],
  salaryMin: 0,
  salaryMax: 10000,
  hasPassport: false,
  hasVisa: false,
  availability: 'All',
  hasVideo: false,
  verifiedDocs: [],
  hasCertifications: false,
  certificationKeyword: '',
  ecrStatus: 'all',
  primaryWorkType: 'All',
  skillLevel: 'All',
  languages: [],
  openToRelocation: false,
  preferredShift: 'All',
};

export default function SearchWorkers() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<WorkerFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState<{ url: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState<string>('best_match');

  useEffect(() => {
    loadWorkers();
    if (user) loadShortlistedWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadShortlistedWorkers = async () => {
    if (!user) return;
    const { data } = await supabase.from('shortlisted_workers').select('worker_id').eq('employer_id', user.id);
    if (data) setShortlistedIds(new Set(data.map(s => s.worker_id)));
  };

  const handleShortlist = async (workerId: string) => {
    if (!user) { toast.error('Please log in to shortlist workers'); return; }
    setShortlistingId(workerId);
    const isCurrentlyShortlisted = shortlistedIds.has(workerId);
    try {
      if (isCurrentlyShortlisted) {
        const { error } = await supabase.from('shortlisted_workers').delete().eq('employer_id', user.id).eq('worker_id', workerId);
        if (error) throw error;
        setShortlistedIds(prev => { const next = new Set(prev); next.delete(workerId); return next; });
        toast.success('Worker removed from shortlist');
      } else {
        const { error } = await supabase.from('shortlisted_workers').insert({ employer_id: user.id, worker_id: workerId });
        if (error) throw error;
        setShortlistedIds(prev => new Set(prev).add(workerId));
        toast.success('Worker added to shortlist');
      }
    } catch (error) {
      console.error('Error updating shortlist:', error);
      toast.error('Failed to update shortlist');
    } finally {
      setShortlistingId(null);
    }
  };

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const [rows, fields] = await Promise.all([
        fetchEmployerWorkers({ limit: 100 }),
        fetchEmployerVisibleFields().catch(() => []),
      ]);
      setVisibleFields(toVisibilityMap(fields));
      const formatted: Worker[] = rows.map((w) => ({
        id: w.worker_user_id,
        full_name: w.full_name || 'Worker',
        avatar_url: w.avatar_url,
        nationality: w.nationality,
        current_location: w.current_location,
        years_of_experience: w.years_of_experience != null ? Number(w.years_of_experience) : null,
        expected_salary_min: w.expected_salary_min != null ? Number(w.expected_salary_min) : null,
        expected_salary_max: w.expected_salary_max != null ? Number(w.expected_salary_max) : null,
        currency: w.currency || 'INR',
        availability: w.availability,
        has_passport: !!w.has_passport,
        has_visa: false,
        primary_work_type: w.trade,
        skill_level: w.skill_level,
        skills: (w.skills || []).map((s: string) => ({ skill_name: s })),
        video_url: null,
        verified_documents: [],
        certifications_count: 0,
        languages: w.languages || [],
        open_to_relocation: !!w.open_to_relocation,
        preferred_shift: null,
        ecr_status: w.ecr_status,
        last_active_at: null,
      }));
      setAllWorkers(formatted);
      setWorkers(formatted);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list: Worker[]): Worker[] => {
    let filtered = [...list];

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      filtered = filtered.filter(w =>
        w.full_name.toLowerCase().includes(kw) ||
        (w.primary_work_type ?? '').toLowerCase().includes(kw) ||
        w.skills.some(s => s.skill_name.toLowerCase().includes(kw))
      );
    }
    if (filters.nationality && filters.nationality !== 'All Nationalities') {
      filtered = filtered.filter(w => w.nationality === filters.nationality);
    }
    if (filters.currentLocation) {
      const loc = filters.currentLocation.toLowerCase();
      filtered = filtered.filter(w => (w.current_location ?? '').toLowerCase().includes(loc));
    }
    if (filters.hasPassport) filtered = filtered.filter(w => w.has_passport);
    if (filters.hasVisa) filtered = filtered.filter(w => w.has_visa);
    if (filters.availability && filters.availability !== 'All') {
      filtered = filtered.filter(w => w.availability === filters.availability);
    }
    if (filters.skills.length > 0) {
      filtered = filtered.filter(w =>
        filters.skills.some(skill => w.skills.some(s => s.skill_name.toLowerCase() === skill.toLowerCase()))
      );
    }
    filtered = filtered.filter(w =>
      (w.years_of_experience || 0) >= filters.experienceYears[0] &&
      (w.years_of_experience || 0) <= filters.experienceYears[1]
    );

    // New filters
    if (filters.hasVideo) filtered = filtered.filter(w => !!w.video_url);
    if (filters.verifiedDocs.length > 0) {
      filtered = filtered.filter(w =>
        filters.verifiedDocs.every(d => w.verified_documents.includes(d))
      );
    }
    if (filters.hasCertifications) filtered = filtered.filter(w => w.certifications_count > 0);
    if (filters.ecrStatus && filters.ecrStatus !== 'all') {
      filtered = filtered.filter(w => (w.ecr_status || 'not_checked') === filters.ecrStatus);
    }
    if (filters.primaryWorkType && filters.primaryWorkType !== 'All') {
      filtered = filtered.filter(w => w.primary_work_type === filters.primaryWorkType);
    }
    if (filters.skillLevel && filters.skillLevel !== 'All') {
      filtered = filtered.filter(w => w.skill_level === filters.skillLevel);
    }
    if (filters.languages.length > 0) {
      filtered = filtered.filter(w => filters.languages.some(l => w.languages.includes(l)));
    }
    if (filters.openToRelocation) filtered = filtered.filter(w => w.open_to_relocation);
    if (filters.preferredShift && filters.preferredShift !== 'All') {
      filtered = filtered.filter(w => w.preferred_shift === filters.preferredShift);
    }

    return filtered;
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filtered = applyFilters(allWorkers);
      setWorkers(filtered);
      toast.success(`Found ${filtered.length} worker${filtered.length === 1 ? '' : 's'} matching your criteria`);
    } catch (error) {
      console.error('Error searching workers:', error);
      toast.error('Failed to search workers');
    } finally {
      setLoading(false);
    }
  };

  const sortedWorkers = useMemo(() => {
    const list = [...workers];
    switch (sortBy) {
      case 'experience_desc':
        return list.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0));
      case 'recently_active':
        return list.sort((a, b) =>
          new Date(b.last_active_at || 0).getTime() - new Date(a.last_active_at || 0).getTime()
        );
      case 'most_verified':
        return list.sort((a, b) => {
          const score = (w: Worker) =>
            (w.video_url ? 2 : 0) + w.verified_documents.length + (w.certifications_count > 0 ? 1 : 0) +
            (w.has_passport ? 1 : 0) + (w.has_visa ? 1 : 0);
          return score(b) - score(a);
        });
      default:
        return list;
    }
  }, [workers, sortBy]);

  const handleSaveSearch = async (name: string, alertsEnabled: boolean, alertFrequency: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id, search_type: 'workers', name, filters: filters as any,
        alerts_enabled: alertsEnabled, alert_frequency: alertFrequency
      } as any);
      if (error) throw error;
      toast.success('Search saved successfully!');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
      throw error;
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) {
        toast.error('You can compare up to 4 workers at a time');
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareWorkers: CompareWorker[] = useMemo(
    () => sortedWorkers
      .filter(w => compareIds.includes(w.id))
      .map(w => ({
        id: w.id,
        full_name: w.full_name,
        avatar_url: w.avatar_url,
        nationality: w.nationality,
        current_location: w.current_location,
        primary_work_type: w.primary_work_type,
        skill_level: w.skill_level,
        years_of_experience: w.years_of_experience,
        availability: w.availability,
        has_passport: w.has_passport,
        has_visa: w.has_visa,
        has_video: !!w.video_url,
        video_url: w.video_url,
        certifications_count: w.certifications_count,
        verified_documents: w.verified_documents,
        languages: w.languages,
        open_to_relocation: w.open_to_relocation,
        preferred_shift: w.preferred_shift,
        ecr_status: w.ecr_status,
        skills: w.skills,
      })),
    [sortedWorkers, compareIds]
  );

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; reset: () => void }[] = [];
    if (filters.keyword) chips.push({ key: 'keyword', label: `"${filters.keyword}"`, reset: () => setFilters(f => ({ ...f, keyword: '' })) });
    if (filters.nationality !== 'All Nationalities') chips.push({ key: 'nat', label: filters.nationality, reset: () => setFilters(f => ({ ...f, nationality: 'All Nationalities' })) });
    if (filters.currentLocation) chips.push({ key: 'loc', label: filters.currentLocation, reset: () => setFilters(f => ({ ...f, currentLocation: '' })) });
    if (filters.hasPassport) chips.push({ key: 'pass', label: 'Has Passport', reset: () => setFilters(f => ({ ...f, hasPassport: false })) });
    if (filters.hasVisa) chips.push({ key: 'visa', label: 'Has Visa', reset: () => setFilters(f => ({ ...f, hasVisa: false })) });
    if (filters.availability !== 'All') chips.push({ key: 'avail', label: filters.availability, reset: () => setFilters(f => ({ ...f, availability: 'All' })) });
    if (filters.hasVideo) chips.push({ key: 'vid', label: 'Has Video', reset: () => setFilters(f => ({ ...f, hasVideo: false })) });
    filters.verifiedDocs.forEach(d => chips.push({ key: `doc-${d}`, label: `Verified: ${d}`, reset: () => setFilters(f => ({ ...f, verifiedDocs: f.verifiedDocs.filter(x => x !== d) })) }));
    if (filters.hasCertifications) chips.push({ key: 'certs', label: 'Has certifications', reset: () => setFilters(f => ({ ...f, hasCertifications: false })) });
    if (filters.ecrStatus !== 'all') chips.push({ key: 'ecr', label: `ECR: ${filters.ecrStatus}`, reset: () => setFilters(f => ({ ...f, ecrStatus: 'all' })) });
    if (filters.primaryWorkType !== 'All') chips.push({ key: 'pwt', label: filters.primaryWorkType, reset: () => setFilters(f => ({ ...f, primaryWorkType: 'All' })) });
    if (filters.skillLevel !== 'All') chips.push({ key: 'sl', label: filters.skillLevel, reset: () => setFilters(f => ({ ...f, skillLevel: 'All' })) });
    filters.languages.forEach(l => chips.push({ key: `lang-${l}`, label: l, reset: () => setFilters(f => ({ ...f, languages: f.languages.filter(x => x !== l) })) }));
    if (filters.openToRelocation) chips.push({ key: 'reloc', label: 'Open to relocation', reset: () => setFilters(f => ({ ...f, openToRelocation: false })) });
    if (filters.preferredShift !== 'All') chips.push({ key: 'shift', label: `${filters.preferredShift} shift`, reset: () => setFilters(f => ({ ...f, preferredShift: 'All' })) });
    filters.skills.forEach(s => chips.push({ key: `skill-${s}`, label: s, reset: () => setFilters(f => ({ ...f, skills: f.skills.filter(x => x !== s) })) }));
    return chips;
  }, [filters]);

  return (
    <DashboardLayout navGroups={employerNavGroups} portalLabel="Employer Portal" portalName="Employer Portal" profileMenuItems={employerProfileMenu}>
      <PortalBreadcrumb />
      <EmployerFlowStepper current="search" />
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Find Skilled Workers</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse verified workers and post a job to start hiring — no upfront fees.
          </p>
        </div>
        <Link to="/employer/quick-post-job">
          <Button size="lg" className="gap-2 shadow-primary">
            Post a Job <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-4 md:gap-6">
        <aside className="order-2 lg:order-1">
          <WorkerSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            onSaveSearch={() => setShowSaveDialog(true)}
            loading={loading}
          />
          <Card className="mt-4 p-4">
            <Link to="/employer/saved-searches">
              <Button variant="outline" className="w-full">View Saved Searches</Button>
            </Link>
          </Card>
        </aside>

        <div className="space-y-4 order-1 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold">{sortedWorkers.length} Workers Found</h2>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-card w-full sm:w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {WORKER_SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Sort by: {o.label}</option>
              ))}
            </select>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {activeChips.map(c => (
                <Badge key={c.key} variant="secondary" className="gap-1">
                  {c.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={c.reset} />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => { setFilters(DEFAULT_FILTERS); setWorkers(allWorkers); }}
              >
                Clear all
              </Button>
            </div>
          )}

          {loading ? (
            <WorkerListSkeleton count={4} />
          ) : sortedWorkers.length === 0 ? (
            <Card className="p-12 text-center">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workers found</h3>
              <p className="text-muted-foreground mb-4">
                Try removing some filters or broadening your criteria.
              </p>
              <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setWorkers(allWorkers); }}>
                Reset all filters
              </Button>
            </Card>
          ) : (
            sortedWorkers.map((worker) => (
              <Card key={worker.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  {/* Left: Avatar + optional Video thumbnail */}
                  <div className="flex sm:flex-col gap-3 items-start shrink-0">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20">
                      <AvatarImage src={worker.avatar_url || ''} />
                      <AvatarFallback className="text-xl md:text-2xl">
                        {worker.full_name?.split(' ').map(n => n[0]).join('') || 'W'}
                      </AvatarFallback>
                    </Avatar>
                    {worker.video_url && (
                      <button
                        type="button"
                        onClick={() => setVideoOpen({ url: worker.video_url!, name: worker.full_name })}
                        className="relative h-16 w-20 md:h-14 md:w-20 rounded-md overflow-hidden bg-muted border group flex items-center justify-center"
                        aria-label="Play intro video"
                      >
                        <Video className="h-5 w-5 text-muted-foreground" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-90 group-hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold mb-1 truncate">{worker.full_name || 'Worker'}</h3>
                        {(worker.primary_work_type || worker.skill_level) && (
                          <p className="text-xs md:text-sm text-primary font-medium mb-1.5">
                            {[worker.primary_work_type, worker.skill_level].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                          {worker.nationality && (
                            <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{worker.nationality}</span>
                          )}
                          {worker.current_location && (
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{worker.current_location}</span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs cursor-pointer shrink-0">
                        <Checkbox
                          checked={compareIds.includes(worker.id)}
                          onCheckedChange={() => toggleCompare(worker.id)}
                        />
                        Compare
                      </label>
                    </div>

                    {/* Verification Badges Row */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {worker.has_passport && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
                          <Check className="h-3 w-3" /> Passport
                        </Badge>
                      )}
                      {worker.has_visa && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
                          <Check className="h-3 w-3" /> Visa
                        </Badge>
                      )}
                      {worker.verified_documents.includes('id') && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1 text-xs">
                          <ShieldCheck className="h-3 w-3" /> ID
                        </Badge>
                      )}
                      {worker.certifications_count > 0 && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
                          <Award className="h-3 w-3" /> {worker.certifications_count} cert{worker.certifications_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {worker.video_url && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
                          <Video className="h-3 w-3" /> Video
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4 mb-4 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Award className="h-4 w-4" />{worker.years_of_experience || 0} years
                        </p>
                      </div>
                      {worker.availability && (
                        <div>
                          <p className="text-muted-foreground">Availability</p>
                          <p className="font-semibold">{worker.availability}</p>
                        </div>
                      )}
                      {worker.languages.length > 0 && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Languages className="h-3 w-3" /> Languages
                          </p>
                          <p className="font-semibold truncate">{worker.languages.slice(0, 3).join(', ')}</p>
                        </div>
                      )}
                      {(worker.expected_salary_min != null || worker.expected_salary_max != null) && (
                        <div>
                          <p className="text-muted-foreground">Expected Salary</p>
                          <p className="font-semibold">
                            {formatExpectedSalary(worker.expected_salary_min, worker.expected_salary_max, worker.currency)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {worker.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline">{skill.skill_name}</Badge>
                      ))}
                      {worker.skills.length > 5 && (
                        <Badge variant="secondary">+{worker.skills.length - 5} more</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <Link to={`/worker-profile/${worker.id}`}>
                        <Button size="sm" className="text-xs md:text-sm">View Profile</Button>
                      </Link>
                      <SendJobRequestDialog
                        workerId={worker.id}
                        workerName={worker.full_name}
                        trigger={
                          <Button variant="outline" size="sm" className="text-xs md:text-sm">
                            <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />Send Job Request
                          </Button>
                        }
                      />
                      <Button
                        variant={shortlistedIds.has(worker.id) ? "default" : "outline"}
                        size="sm"
                        className="text-xs md:text-sm"
                        onClick={() => handleShortlist(worker.id)}
                        disabled={shortlistingId === worker.id}
                      >
                        {shortlistedIds.has(worker.id) ? (
                          <><Check className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />Shortlisted</>
                        ) : (
                          <><Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />Shortlist</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Compare button */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button size="lg" onClick={() => setCompareOpen(true)} className="shadow-lg gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Compare ({compareIds.length})
          </Button>
        </div>
      )}

      <WorkerComparisonDrawer
        open={compareOpen}
        onOpenChange={setCompareOpen}
        workers={compareWorkers}
        onRemove={(id) => setCompareIds(prev => prev.filter(x => x !== id))}
        onClearAll={() => { setCompareIds([]); setCompareOpen(false); }}
      />

      {/* Video preview modal */}
      <Dialog open={!!videoOpen} onOpenChange={(o) => !o && setVideoOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{videoOpen?.name} — intro video</DialogTitle>
          </DialogHeader>
          {videoOpen && (
            <video src={videoOpen.url} controls className="w-full rounded-md bg-black" autoPlay />
          )}
        </DialogContent>
      </Dialog>

      <SavedSearchDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} onSave={handleSaveSearch} />
    </DashboardLayout>
  );
}
