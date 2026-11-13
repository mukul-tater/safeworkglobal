import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  UserPlus,
} from 'lucide-react';
import {
  buildWhatsAppInviteUrl,
  COMMON_POPULAR_TRADES,
  createMarketingLead,
  LEAD_SOURCE_LABELS,
  markMarketingLeadInvited,
  type MarketingLead,
  type MarketingLeadSource,
} from '@/services/marketingLeadService';
import { isValidIndianMobile, normalizeIndianMobile } from '@/lib/validations/common';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadAdded?: (lead: MarketingLead) => void;
}

export default function AddAdLeadDialog({ open, onOpenChange, onLeadAdded }: Props) {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [source, setSource] = useState<MarketingLeadSource>('instagram_dm');
  const [campaignName, setCampaignName] = useState('');
  const [jobInterest, setJobInterest] = useState('Security Guard');
  const [customJob, setCustomJob] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success view state
  const [savedLead, setSavedLead] = useState<MarketingLead | null>(null);
  const [inviteData, setInviteData] = useState<{ url: string; messageText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setPhone('');
    setFullName('');
    setSource('instagram_dm');
    setCampaignName('');
    setJobInterest('Security Guard');
    setCustomJob('');
    setNotes('');
    setSavedLead(null);
    setInviteData(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeIndianMobile(phone);
    if (!isValidIndianMobile(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const trade = jobInterest === 'Other' ? customJob.trim() : jobInterest;

    setSubmitting(true);
    try {
      const lead = await createMarketingLead({
        phone: cleanPhone,
        full_name: fullName.trim() || undefined,
        source,
        campaign_name: campaignName.trim() || undefined,
        job_interest: trade || undefined,
        notes: notes.trim() || undefined,
      });

      const invite = buildWhatsAppInviteUrl({
        phone: cleanPhone,
        name: lead.full_name,
        job: lead.job_interest,
        campaign: lead.campaign_name,
        source: lead.source,
      });

      setSavedLead(lead);
      setInviteData(invite);
      toast.success('Lead added to portal successfully');
      onLeadAdded?.(lead);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!inviteData || !savedLead) return;
    void markMarketingLeadInvited(savedLead.id);
    window.open(inviteData.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyInvite = async () => {
    if (!inviteData) return;
    try {
      await navigator.clipboard.writeText(inviteData.messageText);
      setCopied(true);
      toast.success('Invite message copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {savedLead ? 'Lead Saved & Invite Ready' : 'Add Ad / DM Lead'}
          </DialogTitle>
          <DialogDescription>
            {savedLead
              ? 'Lead is logged in the matrix. Send the candidate their direct WhatsApp invite below.'
              : 'Enter incoming candidate inquiries from Instagram DMs, WhatsApp, or Influencer campaigns.'}
          </DialogDescription>
        </DialogHeader>

        {savedLead && inviteData ? (
          <div className="space-y-4 pt-1">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {savedLead.full_name || 'Candidate'} (+91 {savedLead.phone})
                </span>
                <Badge variant="outline" className="bg-background">
                  {LEAD_SOURCE_LABELS[savedLead.source]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Trade: <span className="font-medium text-foreground">{savedLead.job_interest || 'Gulf Jobs'}</span>
                {savedLead.campaign_name ? ` · Campaign: ${savedLead.campaign_name}` : ''}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pre-filled WhatsApp Invite Message
              </Label>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground max-h-48 overflow-y-auto">
                {inviteData.messageText}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyInvite}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Another Lead
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open in WhatsApp
                  <ExternalLink className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile Number *</Label>
                <div className="flex items-center">
                  <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-xs text-muted-foreground font-mono">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    className="rounded-l-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Candidate Name (Optional)</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="source">Lead Source *</Label>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as MarketingLeadSource)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                    <SelectItem value="whatsapp_dm">WhatsApp DM</SelectItem>
                    <SelectItem value="instagram_ad">Instagram Ad</SelectItem>
                    <SelectItem value="influencer">Influencer Collaboration</SelectItem>
                    <SelectItem value="facebook_ad">Facebook Ad</SelectItem>
                    <SelectItem value="other">Other Channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campaignName">Influencer / Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g. Rahul Reel, Dubai Driver Ad 1"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobInterest">Job / Trade Interest</Label>
              <Select
                value={jobInterest}
                onValueChange={(v) => setJobInterest(v)}
              >
                <SelectTrigger id="jobInterest">
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_POPULAR_TRADES.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other Trade (Specify below)</SelectItem>
                </SelectContent>
              </Select>
              {jobInterest === 'Other' && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom trade title"
                  value={customJob}
                  onChange={(e) => setCustomJob(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Inflow Details (Optional)</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="e.g. Has 2 years Gulf license, asked about accommodation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Save Lead &amp; Generate Invite
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

