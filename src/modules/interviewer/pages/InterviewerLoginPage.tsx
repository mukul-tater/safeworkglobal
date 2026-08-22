import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video } from 'lucide-react';
import ForgotPasswordControl from '@/components/ForgotPasswordControl';

export default function InterviewerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, refreshRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && role === 'interviewer') {
      navigate('/interviewer/queue', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }
    const { data: session } = await supabase.auth.getUser();
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user?.id || '')
      .eq('role', 'interviewer' as never)
      .maybeSingle();
    if (!roleRow) {
      await supabase.auth.signOut();
      setError('This account does not have interviewer access. Ask an admin to grant it.');
      setLoading(false);
      return;
    }
    await refreshRole();
    navigate('/interviewer/queue', { replace: true });
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Interviewer sign in</h1>
            <p className="text-sm text-muted-foreground">
              Review your assigned video interviews and record decisions.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="int-email">Email</Label>
              <Input
                id="int-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="int-password">Password</Label>
                <ForgotPasswordControl
                  loginPath="/interviewer/login"
                  initialIdentifier={email}
                  title="Reset interviewer password"
                  description="Enter the email for your interviewer account. We'll send a secure link to set a new password."
                  triggerClassName="text-xs"
                />
              </div>
              <Input
                id="int-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}