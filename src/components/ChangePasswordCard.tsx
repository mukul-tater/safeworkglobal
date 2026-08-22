import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { isLeakedPassword, passwordSignupIssue, WEAK_PASSWORD_MESSAGE } from '@/lib/validations/password';
import ProfileSection from '@/components/profile/ProfileSection';
import HindiText from '@/components/indian-workforce/HindiText';

export default function ChangePasswordCard({
  partnerSetPassword = false,
}: {
  /** Worker account was created by an eMitra / partner with a basic password. */
  partnerSetPassword?: boolean;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Please enter and confirm your new password');
      return;
    }
    const strengthError = passwordSignupIssue(newPassword);
    if (strengthError) {
      toast.error(strengthError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      if (await isLeakedPassword(newPassword)) {
        toast.error(WEAK_PASSWORD_MESSAGE);
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = newPassword.length > 0 && confirmPassword.length > 0 && !saving;

  return (
    <ProfileSection
      title="Change Password"
      description={
        partnerSetPassword
          ? 'If an eMitra partner set a basic password for you, replace it with one only you know.'
          : 'Uses a separate action from Save profile above.'
      }
      icon={Lock}
    >
      {partnerSetPassword && (
        <HindiText className="mb-3 text-xs text-muted-foreground">
          अगर ई-मित्र पार्टनर ने आपके लिए बेसिक पासवर्ड सेट किया है, तो उसे अपनी पसंद के पासवर्ड से बदल दें।
        </HindiText>
      )}
      <form onSubmit={handleChangePassword} noValidate className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="new_password">New password</Label>
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters, letters and numbers"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={!canSubmit} className="h-10 w-full sm:w-auto sm:min-w-[160px]">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </ProfileSection>
  );
}
