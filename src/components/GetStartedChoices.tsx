import { Briefcase, HardHat, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { GET_STARTED_PATHS } from '@/lib/getStarted';

type Props = {
  onChosen?: () => void;
};

export default function GetStartedChoices({ onChosen }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const go = (path: string) => {
    onChosen?.();
    navigate(path);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
        {t('header.iWantTo')}
      </p>
      <button
        type="button"
        onClick={() => go(GET_STARTED_PATHS.worker)}
        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
      >
        <div className="p-2 rounded-lg bg-success/10 text-success">
          <HardHat className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">{t('header.findJob')}</div>
          <div className="text-xs text-muted-foreground">{t('header.findJobSub')}</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => go(GET_STARTED_PATHS.employer)}
        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors mt-1"
      >
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Briefcase className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">{t('header.hire')}</div>
          <div className="text-xs text-muted-foreground">{t('header.hireSub')}</div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => go(GET_STARTED_PATHS.partner)}
        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors mt-1"
      >
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Handshake className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">{t('header.partner')}</div>
          <div className="text-xs text-muted-foreground">{t('header.partnerSub')}</div>
        </div>
      </button>
    </div>
  );
}
