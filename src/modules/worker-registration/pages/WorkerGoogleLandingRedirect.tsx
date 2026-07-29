import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';

/** Legacy /worker/trust URL — send Supabase workers to the Lovable worker dashboard. */
export default function WorkerGoogleLandingRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading, profileLoading, isMobileVerified } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (isAuthenticated && role === 'worker') {
      navigate(isMobileVerified ? '/worker/dashboard' : '/worker/bind-mobile', { replace: true });
      return;
    }

    navigate('/worker/login', { replace: true });
  }, [isAuthenticated, role, loading, profileLoading, isMobileVerified, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
