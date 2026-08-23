import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Award, MapPin, Globe, ShieldCheck, Video, Languages, Briefcase, Check, Play, FileCheck, FileX } from 'lucide-react';

export interface CompareWorker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  nationality: string | null;
  current_location: string | null;
  primary_work_type: string | null;
  skill_level: string | null;
  years_of_experience: number | null;
  availability: string | null;
  has_passport: boolean;
  has_visa: boolean;
  has_video: boolean;
  video_url?: string | null;
  certifications_count: number;
  verified_documents: string[];
  languages: string[];
  open_to_relocation: boolean;
  preferred_shift: string | null;
  ecr_status: string | null;
  skills: { skill_name: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: CompareWorker[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const documentTypes = [
  { key: 'passport', label: 'Passport' },
  { key: 'visa', label: 'Visa' },
  { key: 'id', label: 'ID' },
  { key: 'police_clearance', label: 'Police' },
  { key: 'medical', label: 'Medical' },
];

const fields = [
  { key: 'video', label: 'Intro Video', icon: Video },
  { key: 'docs', label: 'Documents', icon: ShieldCheck },
  { key: 'certs', label: 'Certifications', icon: Award },
  { key: 'experience', label: 'Experience', icon: Award },
  { key: 'role', label: 'Role', icon: Briefcase },
  { key: 'skills', label: 'Top Skills', icon: Briefcase },
  { key: 'languages', label: 'Languages', icon: Languages },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'nationality', label: 'Nationality', icon: Globe },
  { key: 'shift', label: 'Preferred Shift', icon: Briefcase },
  { key: 'relocation', label: 'Relocation', icon: MapPin },
  { key: 'ecr', label: 'ECR Status', icon: ShieldCheck },
];

const hasDocument = (worker: CompareWorker, key: string) => {
  if (key === 'passport') return worker.has_passport || worker.verified_documents.includes(key);
  if (key === 'visa') return worker.has_visa || worker.verified_documents.includes(key);
  return worker.verified_documents.includes(key);
};

const verificationScore = (worker: CompareWorker) => {
  const docs = documentTypes.filter((doc) => hasDocument(worker, doc.key)).length;
  return docs + (worker.has_video || worker.video_url ? 1 : 0) + (worker.certifications_count > 0 ? 1 : 0);
};

function DocumentStatus({ worker }: { worker: CompareWorker }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {documentTypes.map((doc) => {
        const verified = hasDocument(worker, doc.key);
        return (
          <Badge
            key={doc.key}
            variant="outline"
            className={verified ? 'border-success/30 bg-success/10 text-success gap-1' : 'border-border bg-muted/40 text-muted-foreground gap-1'}
          >
            {verified ? <FileCheck className="h-3 w-3" /> : <FileX className="h-3 w-3" />}
            {doc.label}
          </Badge>
        );
      })}
    </div>
  );
}

function VideoTile({ worker }: { worker: CompareWorker }) {
  const available = worker.has_video || !!worker.video_url;
  return (
    <div className={available ? 'relative flex h-24 items-center justify-center overflow-hidden rounded-md border bg-primary/10' : 'flex h-24 items-center justify-center rounded-md border border-dashed bg-muted/30'}>
      {available ? (
        <>
          <Video className="h-7 w-7 text-primary" />
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <Play className="h-7 w-7 fill-primary text-primary" />
          </span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">No video</span>
      )}
    </div>
  );
}

function renderValue(worker: CompareWorker, key: string) {
  switch (key) {
    case 'video':
      return <VideoTile worker={worker} />;
    case 'docs':
      return <DocumentStatus worker={worker} />;
    case 'certs':
      return worker.certifications_count > 0 ? (
        <Badge className="bg-success/10 text-success border-success/20 gap-1"><Check className="h-3 w-3" />{worker.certifications_count} verified</Badge>
      ) : <span className="text-muted-foreground text-sm">None</span>;
    case 'experience':
      return <span className="text-lg font-semibold text-foreground">{worker.years_of_experience || 0} yrs</span>;
    case 'role':
      return [worker.primary_work_type, worker.skill_level].filter(Boolean).join(' • ') || '—';
    case 'skills':
      return worker.skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {worker.skills.slice(0, 5).map((skill, index) => <Badge key={`${skill.skill_name}-${index}`} variant="outline">{skill.skill_name}</Badge>)}
        </div>
      ) : '—';
    case 'languages':
      return worker.languages.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {worker.languages.slice(0, 4).map((language) => <Badge key={language} variant="secondary">{language}</Badge>)}
        </div>
      ) : '—';
    case 'location':
      return worker.current_location || '—';
    case 'nationality':
      return worker.nationality || '—';
    case 'shift':
      return worker.preferred_shift || 'Any';
    case 'relocation':
      return worker.open_to_relocation ? <Badge className="bg-success/10 text-success border-success/20">Yes</Badge> : 'No';
    case 'ecr':
      return worker.ecr_status ? <span className="capitalize">{worker.ecr_status.replace('_', ' ')}</span> : '—';
    default:
      return '—';
  }
}

export default function WorkerComparisonDrawer({ open, onOpenChange, workers, onRemove, onClearAll }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[88vh] sm:h-[82vh]">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="text-xl font-heading">Compare Workers</SheetTitle>
              <SheetDescription>Visual side-by-side comparison of {workers.length} worker{workers.length !== 1 ? 's' : ''} (max 4)</SheetDescription>
            </div>
            {workers.length > 0 && <Button variant="outline" size="sm" onClick={onClearAll}>Clear All</Button>}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-104px)] mt-4">
          {workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No workers to compare</p>
              <p className="text-sm text-muted-foreground">Tick the Compare box on worker cards to add them here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <p className="mb-2 text-xs text-muted-foreground lg:hidden">Swipe to compare</p>
              <table className="w-full min-w-[760px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-40 bg-background p-3 text-left align-top text-sm font-semibold text-muted-foreground">Criteria</th>
                    {workers.map((worker) => (
                      <th key={worker.id} className="min-w-[250px] p-3 align-top">
                        <div className="rounded-lg border bg-card p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={worker.avatar_url || ''} />
                                <AvatarFallback>{worker.full_name?.[0] || 'W'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 text-left">
                                <p className="truncate font-semibold text-foreground">{worker.full_name}</p>
                                <p className="truncate text-xs font-normal text-muted-foreground">{[worker.primary_work_type, worker.skill_level].filter(Boolean).join(' • ') || 'Worker'}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(worker.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20">{verificationScore(worker)}/7 verified</Badge>
                            {(worker.has_video || worker.video_url) && <Badge variant="secondary" className="gap-1"><Video className="h-3 w-3" />Video</Badge>}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.key} className={index % 2 === 0 ? 'bg-muted/25' : ''}>
                      <td className="sticky left-0 z-10 bg-inherit p-3 align-top font-medium text-muted-foreground">
                        <div className="flex items-center gap-2"><field.icon className="h-4 w-4" />{field.label}</div>
                      </td>
                      {workers.map((worker) => <td key={worker.id} className="p-3 align-top text-sm">{renderValue(worker, field.key)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}