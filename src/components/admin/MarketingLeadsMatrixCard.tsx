import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Instagram,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  buildWhatsAppInviteUrl,
  getMarketingMatrixStats,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  listMarketingLeads,
  markMarketingLeadInvited,
  updateMarketingLeadStatus,
  type MarketingLead,
  type MarketingLeadSource,
  type MarketingLeadStatus,
  type MarketingMatrixStats,
} from '@/services/marketingLeadService';
import AddAdLeadDialog from './AddAdLeadDialog';

export default function MarketingLeadsMatrixCard() {
  const [stats, setStats] = useState<MarketingMatrixStats | null>(null);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'channels' | 'campaigns'>('leads');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, leadsData] = await Promise.all([
        getMarketingMatrixStats(),
        listMarketingLeads(),
      ]);
      setStats(statsData);
      setLeads(leadsData);
    } catch (err) {
      console.error('Failed to load marketing matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        l.phone.includes(q) ||
        (l.full_name && l.full_name.toLowerCase().includes(q)) ||
        (l.campaign_name && l.campaign_name.toLowerCase().includes(q)) ||
        (l.job_interest && l.job_interest.toLowerCase().includes(q))
      );
    });
  }, [leads, search, sourceFilter, statusFilter]);

  const handleSendInvite = (lead: MarketingLead) => {
    const invite = buildWhatsAppInviteUrl({
      phone: lead.phone,
      name: lead.full_name,
      job: lead.job_interest,
      campaign: lead.campaign_name,
      source: lead.source,
    });
    void markMarketingLeadInvited(lead.id);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'invited', invite_sent_at: new Date().toISOString() } : l)),
    );
    window.open(invite.url, '_blank', 'noopener,noreferrer');
  };

  const handleStatusChange = async (leadId: string, nextStatus: MarketingLeadStatus) => {
    try {
      await updateMarketingLeadStatus(leadId, nextStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)),
      );
      toast.success('Lead status updated');
    } catch {
      toast.error('Could not update status');
    }
  };

  const copyCampaignTrackingLink = (campaignName: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://safeworkglobal.com';
    const cleanCamp = campaignName.replace(/\s+/g, '_').toLowerCase();
    const link = `${baseUrl}/jobs?utm_source=influencer&utm_campaign=${encodeURIComponent(cleanCamp)}`;
    navigator.clipboard.writeText(link);
    toast.success(`Copied tracking link for "${campaignName}"`);
  };

  const getSourceIcon = (src: MarketingLeadSource) => {
    switch (src) {
      case 'instagram_dm':
      case 'instagram_ad':
        return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
      case 'whatsapp_dm':
        return <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'influencer':
        return <Flame className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ad &amp; Influencer Leads Matrix
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              Live funnel performance for candidates arriving from Instagram Ads, Influencer DMs, and WhatsApp.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:opacity-95 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Ad / DM Lead
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Funnel KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">Total Leads</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.totalLeads ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground">From Ads &amp; DMs</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">Invited</span>
              <Send className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.invitedCount ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground">WhatsApp invite sent</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">Portal Active</span>
              <UserCheck className="h-4 w-4 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.registeredCount ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground">Registered worker</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">Test 1 Passed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.quizPassedCount ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground">Trade screening</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">KYC Verified</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.kycVerifiedCount ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground">Dossier verified</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">Conversion</span>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats?.conversionRate ?? 0}%
            </p>
            <p className="text-[11px] text-muted-foreground">Lead ➔ Registered</p>
          </div>
        </div>

        {/* Tabs for Detailed Matrix Views */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-2">
            <TabsList className="bg-muted/60">
              <TabsTrigger value="leads" className="text-xs sm:text-sm">
                Candidate Leads ({filteredLeads.length})
              </TabsTrigger>
              <TabsTrigger value="channels" className="text-xs sm:text-sm">
                Channels ({stats?.sources.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
                Influencers &amp; Campaigns ({stats?.campaigns.length ?? 0})
              </TabsTrigger>
            </TabsList>

            {activeTab === 'leads' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[160px] sm:min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search phone, name, campaign…"
                    className="h-8 pl-8 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                    <SelectItem value="whatsapp_dm">WhatsApp DM</SelectItem>
                    <SelectItem value="instagram_ad">Instagram Ad</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="facebook_ad">Facebook Ad</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="lead_created">Lead Logged</SelectItem>
                    <SelectItem value="invited">Invite Sent</SelectItem>
                    <SelectItem value="registered">Active on Portal</SelectItem>
                    <SelectItem value="converted">KYC Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tab 1: Leads Table */}
          <TabsContent value="leads" className="space-y-4 pt-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading leads matrix…
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-foreground">No ad leads found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When candidates inquire on Instagram DMs or WhatsApp, tap &quot;Add Ad / DM Lead&quot; above to log them.
                </p>
                <Button size="sm" onClick={() => setAddDialogOpen(true)} className="mt-2">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Lead
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Candidate</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Campaign / Influencer</TableHead>
                      <TableHead>Trade Interest</TableHead>
                      <TableHead>Portal Journey</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const v = lead.worker_verification;
                      const hasQuiz = Boolean(v?.quiz_completed_at);
                      const isKyc = v?.kyc_status === 'verified';
                      return (
                        <TableRow key={lead.id} className="text-xs">
                          <TableCell className="font-medium">
                            <div className="space-y-0.5">
                              <p className="text-foreground font-semibold">
                                {lead.full_name || 'Candidate'}
                              </p>
                              <p className="font-mono text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> +91 {lead.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                              {getSourceIcon(lead.source)}
                              {LEAD_SOURCE_LABELS[lead.source]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground font-medium">
                              {lead.campaign_name || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {lead.job_interest || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.worker_user_id ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] text-success font-semibold">
                                  <UserCheck className="h-3 w-3" /> Registered
                                </span>
                                <p className="text-[10px] text-muted-foreground">
                                  {isKyc
                                    ? 'KYC Verified'
                                    : hasQuiz
                                      ? `Test 1: ${v?.quiz_score ?? 0}%`
                                      : `Stage: ${v?.stage || 'Essentials'}`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                Not registered yet
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lead.status}
                              onValueChange={(val) => handleStatusChange(lead.id, val as MarketingLeadStatus)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-[115px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead_created">Lead Logged</SelectItem>
                                <SelectItem value="invited">Invite Sent</SelectItem>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="converted">KYC Verified</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvite(lead)}
                              className="h-7 text-xs gap-1 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="Open pre-filled WhatsApp message for this candidate"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Channel Breakdown */}
          <TabsContent value="channels" className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.sources.map((s) => (
                <div
                  key={s.source}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      {getSourceIcon(s.source)}
                      {s.label}
                    </span>
                    <Badge variant="secondary" className="tabular-nums">
                      {s.percentage}% of leads
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <span className="text-muted-foreground block">Leads</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <span className="text-muted-foreground block">Registered</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {s.registered}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${s.count > 0 ? Math.min(100, Math.round((s.registered / s.count) * 100)) : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Portal conversion</span>
                    <span className="font-medium text-foreground">
                      {s.count > 0 ? Math.round((s.registered / s.count) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tab 3: Influencer & Campaign Performance */}
          <TabsContent value="campaigns" className="space-y-4 pt-1">
            {stats?.campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No campaigns tagged yet. Add an influencer name when logging leads.
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Campaign / Influencer</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className="tabular-nums">Total Leads</TableHead>
                      <TableHead className="tabular-nums">Registered</TableHead>
                      <TableHead className="tabular-nums">Test 1 Passed</TableHead>
                      <TableHead className="tabular-nums">Conversion Rate</TableHead>
                      <TableHead className="text-right">Tracking Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.campaigns.map((c) => (
                      <TableRow key={c.campaign_name} className="text-xs">
                        <TableCell className="font-semibold text-foreground">
                          {c.campaign_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.source}</TableCell>
                        <TableCell className="tabular-nums font-bold text-foreground">
                          {c.leads}
                        </TableCell>
                        <TableCell className="tabular-nums text-foreground">{c.registered}</TableCell>
                        <TableCell className="tabular-nums text-foreground">{c.quizPassed}</TableCell>
                        <TableCell className="tabular-nums">
                          <Badge
                            variant="secondary"
                            className={
                              c.conversionRate >= 40
                                ? 'bg-success/15 text-success'
                                : c.conversionRate >= 20
                                  ? 'bg-warning/15 text-warning'
                                  : ''
                            }
                          >
                            {c.conversionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCampaignTrackingLink(c.campaign_name)}
                            className="h-7 text-xs gap-1"
                            title="Copy custom tracking link to share with this influencer"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Link
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AddAdLeadDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onLeadAdded={() => void loadData()}
      />
    </Card>
  );
}

