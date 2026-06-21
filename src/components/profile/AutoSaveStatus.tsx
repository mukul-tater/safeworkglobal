import { Loader2, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
import type { AutoSaveStatus } from '@/hooks/useAutoSave';
import { cn } from '@/lib/utils';

interface AutoSaveStatusProps {
  status: AutoSaveStatus;
  className?: string;
}

export default function AutoSaveStatus({ status, className }: AutoSaveStatusProps) {
  if (status === 'idle') return null;

  const config = {
    pending: {
      icon: Cloud,
      text: 'Unsaved changes…',
      className: 'text-muted-foreground',
    },
    saving: {
      icon: Loader2,
      text: 'Saving…',
      className: 'text-muted-foreground',
      spin: true,
    },
    saved: {
      icon: CheckCircle2,
      text: 'All changes saved',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      text: 'Could not save — retry by editing a field',
      className: 'text-destructive',
    },
  }[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <p className={cn('flex items-center gap-1.5 text-xs', config.className, className)}>
      <Icon className={cn('h-3.5 w-3.5', 'spin' in config && config.spin && 'animate-spin')} />
      {config.text}
    </p>
  );
}
