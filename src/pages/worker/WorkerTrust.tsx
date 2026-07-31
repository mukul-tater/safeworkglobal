import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, Lock, BadgeCheck, ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Trust-building screen shown right after worker signup.
 * Reduces fear before profile completion / job application.
 */
export default function WorkerTrust() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const trustPoints = [
    {
      icon: BadgeCheck,
      title: 'No upfront fees',
      desc: 'You never pay to apply or get hired. Ever.',
    },
    {
      icon: ShieldCheck,
      title: 'Verified employers only',
      desc: 'Every company is checked before posting jobs.',
    },
    {
      icon: Lock,
      title: 'Salary protected',
      desc: 'Escrow holds your wages until work is delivered.',
    },
    {
      icon: Phone,
      title: 'Real human support',
      desc: 'Reach our team anytime — we speak your language.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 🎉
          </h1>
          <p className="text-sm text-muted-foreground">
            Before we continue, here's why thousands of workers trust SafeWorkGlobal
          </p>
        </div>

        <Card className="shadow-lg border-border/60 mb-5">
          <CardContent className="p-6 space-y-4">
            {trustPoints.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-success/10 shrink-0">
                  <p.icon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-2.5">
          <Button
            className="w-full h-12 font-semibold gap-2"
            onClick={() => navigate('/jobs')}
          >
            See available jobs <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 font-medium"
            onClick={() => navigate('/worker/journey')}
          >
            Complete my profile first
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          You can always complete your profile later — but a complete profile gets 3× more interviews.
        </p>
      </div>
    </div>
  );
}
