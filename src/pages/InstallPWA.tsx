import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Download, Check, Smartphone, Wifi, Zap, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    setCanInstall(iOS);

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  const features = [
    {
      icon: Wifi,
      title: 'Offline Access',
      description: 'Browse jobs and your profile even without internet connection'
    },
    {
      icon: Zap,
      title: 'Fast & Responsive',
      description: 'Lightning-fast loading times and smooth navigation'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get instant alerts about new job opportunities'
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'Feels just like a native mobile app on your device'
    }
  ];

  return (
    <div className="min-h-screen bg-background has-mobile-nav">
      <Header />
      <MobileBottomNav />

      <main className="container mx-auto px-4 py-12 mt-16">
        {isStandalone ? (
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="mx-auto bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl">App Already Installed!</CardTitle>
              <CardDescription>
                SafeWorkGlobal is running as an installed app on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full max-w-xs">
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Install SafeWorkGlobal App
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the full app experience with offline access, push notifications, and more
              </p>
            </div>

            <Card className="max-w-2xl mx-auto mb-12">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Download className="h-6 w-6 text-primary" />
                  {isIOS ? 'Add to Home Screen' : 'Install App'}
                </CardTitle>
                <CardDescription>
                  {canInstall 
                    ? 'Follow the instructions below to install SafeWorkGlobal on your device'
                    : 'Installation not available on this browser'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isIOS ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Installation Steps:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Tap the <strong>Share</strong> button in Safari (square with up arrow)</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong> in the top right corner</li>
                        <li>The SafeWorkGlobal app will appear on your home screen</li>
                      </ol>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Note: This feature only works in Safari browser on iOS devices
                    </p>
                  </div>
                ) : deferredPrompt ? (
                  <Button 
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                ) : (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      To install this app, please use Chrome, Edge, or another Chromium-based browser on Android or desktop.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">App Benefits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
