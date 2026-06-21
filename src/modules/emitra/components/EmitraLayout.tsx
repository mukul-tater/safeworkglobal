import { Link, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Center content vertically — ideal for login */
  centered?: boolean;
  maxWidth?: 'md' | 'lg' | '2xl' | '3xl';
}

const publicNav = [
  { path: '/emitra/register', label: 'Apply as Partner', icon: UserPlus },
  { path: '/emitra/login', label: 'Partner Login', icon: LogIn },
  { path: '/', label: 'Back to Home', icon: Home },
] as const;

const maxWidthClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

function TopNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="flex items-center gap-1">
      {publicNav.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', !isActive && 'opacity-70')} />
            <span className="hidden sm:inline truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <a href="https://safeworkglobal.com" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
      <img src="/safework-global-logo.png" alt="SafeWork Global" className="h-8 w-8 rounded-lg" />
      <div className="hidden sm:block leading-tight">
        <span className="text-sm font-bold text-foreground font-heading block">SafeWork Global</span>
        <span className="text-[11px] text-muted-foreground">Partner Portal</span>
      </div>
    </a>
  );
}

export default function EmitraLayout({
  children,
  title,
  subtitle,
  centered = false,
  maxWidth = '2xl',
}: Props) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'var(--gradient-mesh)' }}
          aria-hidden
        />

        <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-6">
            <Brand />
            <div className="flex items-center gap-1 sm:gap-2">
              <TopNav />
              <div className="hidden sm:block h-6 w-px bg-border mx-1" />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main
          className={cn(
            'relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-x-hidden',
            centered && 'flex flex-col items-center justify-center',
          )}
        >
          <div className={cn('w-full mx-auto', maxWidthClass[maxWidth])}>
            {(title || subtitle) && (
              <div className={cn('mb-6 md:mb-8', centered && 'text-center')}>
                {title && (
                  <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
