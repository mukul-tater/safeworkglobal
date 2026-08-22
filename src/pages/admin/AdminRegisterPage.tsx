import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isWhitelistedAdminEmail } from '@/lib/adminAuth';
import AdminLayout from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { passwordSignupIssue, sanitizePasswordInput, PASSWORD_HINT, PASSWORD_MIN_LENGTH } from '@/lib/validations/password';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!isWhitelistedAdminEmail(normalizedEmail)) {
      setError('Admin registration is restricted to approved SafeWork Global administrator emails.');
      return;
    }

    const passwordIssue = passwordSignupIssue(password);
    if (passwordIssue) {
      setError(passwordIssue);
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    toast.success('Admin account created. Sign in to open Partner Approvals.');
    navigate('/admin/login', { replace: true });
  };

  return (
    <AdminLayout
      centered
      maxWidth="md"
      title="Create Admin Account"
      subtitle="First-time setup for SafeWork Global administrators. Admin role is assigned automatically for approved emails."
    >
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6 md:p-8">
          <Alert className="mb-5">
            <AlertDescription className="text-sm">
              Allowed emails: <strong>admin@safeworkglobal.com</strong>,{' '}
              <strong>ops@safeworkglobal.com</strong>, or{' '}
              <strong>admin@safeworkglobal.demo</strong> (demo).
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                className="h-11"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-reg-email">Email Address</Label>
              <Input
                id="admin-reg-email"
                type="email"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@safeworkglobal.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-reg-password">Password</Label>
              <Input
                id="admin-reg-password"
                type="password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(sanitizePasswordInput(e.target.value))}
                minLength={PASSWORD_MIN_LENGTH}
                placeholder={PASSWORD_HINT}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
            Already have an account?{' '}
            <Link to="/admin/login" className="text-primary font-medium hover:underline">
              Admin sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
