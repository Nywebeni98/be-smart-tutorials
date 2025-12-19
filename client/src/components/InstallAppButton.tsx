import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    setIsIOS(isIOSDevice);
    
    if (isIOSDevice && !isInStandaloneMode) {
      setIsInstallable(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowIOSInstructions(false)}>
        <div 
          className="bg-background rounded-lg p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-6 h-6" style={{ color: 'hsl(var(--brand-blue))' }} />
            <h3 className="font-heading font-semibold text-lg">Install on iPhone</h3>
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>1.</span>
              <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>2.</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>3.</span>
              <span>Tap <strong>"Add"</strong> in the top right</span>
            </li>
          </ol>
          <Button 
            className="w-full mt-4"
            onClick={() => setShowIOSInstructions(false)}
            data-testid="button-close-ios-instructions"
          >
            Got it!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="gap-2"
      style={{ 
        borderColor: 'hsl(var(--brand-blue))',
        color: 'hsl(var(--brand-blue))'
      }}
      data-testid="button-install-app"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
