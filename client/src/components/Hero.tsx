// Hero section showcasing Be Smart Online Tutorials for Cape Town, South Africa
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Hero() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      // Fallback: scroll to subjects if install not available
      const element = document.querySelector('#subjects');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Smooth scroll to sections when buttons are clicked
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="home"
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--brand-blue)) 0%, hsl(var(--brand-orange)) 100%)'
      }}
    >
      {/* Background pattern overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
      
      {/* Dark wash overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Location badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20" data-testid="badge-location">
            <GraduationCap className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium" data-testid="text-location">
              Serving Cape Town, South Africa
            </span>
          </div>

          {/* Main headline */}
          <h1 
            className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight"
            data-testid="text-hero-headline"
          >
            Excel in Your Studies with
            <span 
              className="block mt-2"
              style={{ color: 'hsl(var(--brand-yellow))' }}
            >
              Be Smart Online Tutorials
            </span>
          </h1>

          {/* Subheadline */}
          <p 
            className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            data-testid="text-hero-subheadline"
          >
            Quality, affordable tutoring in Mathematics, Science, English, and more. 
            Empowering students to achieve academic excellence.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Primary CTA - Install App */}
            <Button
              size="lg"
              onClick={handleInstallClick}
              className="min-w-[200px] text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: 'hsl(var(--brand-orange))',
                color: 'white',
              }}
              data-testid="button-install-app"
            >
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>

            {/* Secondary CTA - Get Started */}
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('#contact')}
              className="min-w-[200px] text-base font-semibold bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white/20 shadow-lg"
              data-testid="button-get-started"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>

          {/* iOS Instructions Modal */}
          {showIOSModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowIOSModal(false)}>
              <div 
                className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-6 h-6" style={{ color: 'hsl(var(--brand-blue))' }} />
                  <h3 className="font-heading font-semibold text-lg text-foreground">Install on iPhone</h3>
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
                  onClick={() => setShowIOSModal(false)}
                  data-testid="button-close-ios-modal"
                >
                  Got it!
                </Button>
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex flex-col items-center" data-testid="stat-experience">
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--brand-yellow))' }}>5+</div>
              <div className="text-sm">Years Experience</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center" data-testid="stat-students">
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--brand-yellow))' }}>500+</div>
              <div className="text-sm">Students Helped</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center" data-testid="stat-subjects">
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--brand-yellow))' }}>8+</div>
              <div className="text-sm">Subjects Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
