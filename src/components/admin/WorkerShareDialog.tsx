import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  createWorkerShare,
  listShareRecipients,
  listWorkerShares,
  revokeWorkerShare,
  workerShareUrl,
  type ShareRecipient,
  type ShareRecipientType,
  type WorkerShareRow,
} from '@/services/workerShareService';
import { Copy, Link2, Loader2, Search, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
}

export default function WorkerShareDialog({ open, onOpenChange, workerId, workerName }: Props) {
  const [tab, setTab] = useState<ShareRecipientType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [shares, setShares] = useState<WorkerShareRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (search = query) => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([listShareRecipients(search), listWorkerShares(workerId)]);
      setRecipients(r);
      setShares(s);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to load share options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setQuery('');
    setTab('all');
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workerId]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => void load(query), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(
    () => (tab === 'all' ? recipients : recipients.filter((r) => r.recipient_type === tab)),
    [recipients, tab],
  );

  const activeShares = shares.filter((s) => !s.revoked_at);
  const keyOf = (r: ShareRecipient) => `${r.recipient_type}:${r.recipient_id}`;

  const toggle = (r: ShareRecipient, next: boolean) => {
    const key = keyOf(r);
    setSelected((prev) => (next ? [...prev, key] : prev.filter((k) => k !== key)));
  };

  const copyLink = async (token: string) => {
    const url = workerShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied');
    } catch {
      toast.message(url);
    }
  };

  const handleShare = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one employer or RA');
      return;
    }
    setSaving(true);
    try {
      const created: string[] = [];
      for (const key of selected) {
        const [type, id] = key.split(':') as [ShareRecipientType, string];
        const row = await createWorkerShare(workerId, type, id);
        created.push(row.share_token);
      }
      toast.success(`Shared with ${selected.length} recipient(s)`);
      setSelected([]);
      await load(query);
      if (created[0]) await copyLink(created[0]);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to share worker');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await revokeWorkerShare(shareId);
      toast.success('Access revoked');
      await load(query);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to revoke');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share {workerName}
          </DialogTitle>
          <DialogDescription>
            Grant an employer or MEA licensed RA the full worker dossier, including ID cards and trade-test videos. Copy the login-gated link to send on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Who already has access</p>
            {activeShares.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>
            ) : (
              <div className="space-y-2">
                {activeShares.map((s) => (
                  <div key={s.share_id} className="flex items-start justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{s.recipient_name}</p>
                        <Badge variant="outline">{s.recipient_type === 'ra' ? 'RA' : 'Employer'}</Badge>
                      </div>
                      {s.recipient_detail && (
                        <p className="text-xs text-muted-foreground truncate">{s.recipient_detail}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyLink(s.share_token)} title="Copy link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRevoke(s.share_id)} title="Revoke">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Share with</p>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="mb-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="employer">Employers</TabsTrigger>
                <TabsTrigger value="ra">RAs</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, email, mobile…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching employers or RAs.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 border rounded-lg p-1">
                {filtered.map((r) => {
                  const key = keyOf(r);
                  const already = activeShares.some(
                    (s) => s.recipient_type === r.recipient_type && s.recipient_id === r.recipient_id,
                  );
                  return (
                    <label key={key} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                      <Checkbox
                        checked={already || selected.includes(key)}
                        disabled={already}
                        onCheckedChange={(v) => toggle(r, v === true)}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{r.name}</span>
                          <Badge variant="outline">{r.recipient_type === 'ra' ? 'RA' : 'Employer'}</Badge>
                        </span>
                        {r.detail && <span className="block text-xs text-muted-foreground truncate">{r.detail}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleShare} disabled={saving || selected.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
            Share and copy link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
