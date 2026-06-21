import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

/** Legacy /worker/trust URL — send Supabase workers to the Lovable worker dashboard. */
export default function WorkerGoogleLandingRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (isAuthenticated && role === 'worker') {
      navigate('/worker/dashboard', { replace: true });
      return;
    }

    navigate('/worker/login', { replace: true });
  }, [isAuthenticated, role, loading, profileLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
