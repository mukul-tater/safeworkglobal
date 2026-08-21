import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Legacy CRM-only register path. Unified into /partner/add-worker
 * (independent worker signup + journey).
 */
export default function EmitraRegisterWorkerPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/partner/add-worker', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecting to worker registration…
    </div>
  );
}
