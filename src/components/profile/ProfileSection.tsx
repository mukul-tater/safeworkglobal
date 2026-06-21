import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function ProfileSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  id,
}: ProfileSectionProps) {
  return (
    <section
      id={id}
      className={cn('rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden', className)}
    >
      <div className="px-5 py-4 sm:px-6 border-b border-border/40 bg-muted/20">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-semibold font-heading tracking-tight">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
