import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { processLspEntrySearchParams } from '../services/lspToken';
import { useAuth } from '@/contexts/AuthContext';

export default function LspEntryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [message, setMessage] = useState('Verifying LSP launch…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await processLspEntrySearchParams(searchParams);
      if (cancelled) return;

      if (result.ok === false) {
        const reason = result.reason || 'missing_params';
        navigate(`/lsp/denied?reason=${encodeURIComponent(reason)}`, { replace: true });
        return;
      }

      setMessage(`Welcome via ${result.name}. Continuing…`);

      if (isAuthenticated && role === 'partner') {
        navigate('/lsp/verify', { replace: true });
        return;
      }

      navigate('/emitra/login?next=/lsp/verify', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally once on mount for this search string
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="text-center space-y-3 max-w-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">SafeWork · LSP secure entry</p>
      </div>
    </div>
  );
}
