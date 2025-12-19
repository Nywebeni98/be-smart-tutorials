// Subjects and courses display section with interactive cards
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Beaker, 
  BookOpen, 
  Languages, 
  Brain,
  Computer,
  Download,
  Smartphone,
  X
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function SubjectsSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOSDevice || isAndroid || window.innerWidth < 768;
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    setIsIOS(isIOSDevice);
    
    // Show banner on mobile devices (not already installed)
    if (isMobile && !isInStandaloneMode) {
      setShowInstallBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Subject cards data with icons and descriptions
  const subjects = [
    {
      id: 1,
      title: 'Mathematics',
      description: 'Master algebra, geometry, calculus, and problem-solving skills from Grade 8 to Grade 12.',
      icon: Calculator,
      color: 'hsl(var(--brand-blue))',
      bgColor: 'hsl(var(--brand-blue) / 0.2)',
    },
    {
      id: 2,
      title: 'Physical Sciences',
      description: 'Explore physics and chemistry concepts, experiments, and practical applications.',
      icon: Beaker,
      color: 'hsl(var(--brand-yellow))',
      bgColor: 'hsl(var(--brand-yellow) / 0.2)',
    },
    {
      id: 3,
      title: 'English',
      description: 'Improve reading, writing, grammar, and literary analysis for all grade levels.',
      icon: BookOpen,
      color: 'hsl(var(--brand-orange))',
      bgColor: 'hsl(var(--brand-orange) / 0.2)',
    },
    {
      id: 4,
      title: 'Maths Literacy',
      description: 'Build practical numeracy skills for everyday life and the workplace.',
      icon: Calculator,
      color: 'hsl(var(--brand-blue))',
      bgColor: 'hsl(var(--brand-blue) / 0.2)',
    },
    {
      id: 6,
      title: 'Afrikaans',
      description: 'Develop language skills in reading, writing, and speaking Afrikaans confidently.',
      icon: Languages,
      color: 'hsl(var(--brand-orange))',
      bgColor: 'hsl(var(--brand-orange) / 0.2)',
    },
    {
      id: 7,
      title: 'Accounting',
      description: 'Master financial accounting principles, bookkeeping, and business concepts.',
      icon: Brain,
      color: 'hsl(var(--brand-blue))',
      bgColor: 'hsl(var(--brand-blue) / 0.2)',
    },
    {
      id: 8,
      title: 'Computer Science',
      description: 'Learn programming, algorithms, and computational thinking for the digital age.',
      icon: Computer,
      color: 'hsl(var(--brand-yellow))',
      bgColor: 'hsl(var(--brand-yellow) / 0.2)',
    },
  ];

  return (
    <section id="subjects" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Install App Banner - Orange */}
        {showInstallBanner && (
          <div 
            className="mb-8 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-4 relative"
            style={{ backgroundColor: 'hsl(var(--brand-orange))' }}
            data-testid="banner-install-app"
          >
            <button
              onClick={() => setShowInstallBanner(false)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close banner"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3 text-white">
              <Smartphone className="w-6 h-6" />
              <span className="font-semibold text-lg">Get our app on your phone!</span>
            </div>
            <Button
              onClick={handleInstallClick}
              className="font-bold px-6"
              style={{ 
                backgroundColor: 'white',
                color: 'hsl(var(--brand-orange))'
              }}
              data-testid="button-install-app-banner"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>
        )}

        {/* iOS Instructions Modal */}
        {showIOSModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowIOSModal(false)}>
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
                onClick={() => setShowIOSModal(false)}
                data-testid="button-close-ios-modal"
              >
                Got it!
              </Button>
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 
            className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-subjects-heading"
          >
            Subjects We Teach
          </h2>
          <p 
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            data-testid="text-subjects-description"
          >
            Comprehensive tutoring across all major subjects for high school students. 
            Expert guidance to help you achieve your academic goals.
          </p>
        </div>

        {/* Subjects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card 
                key={subject.id}
                className="group hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer border-2"
                style={{ borderColor: subject.color }}
                data-testid={`card-subject-${subject.id}`}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Subject icon with colored background */}
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: subject.bgColor }}
                    data-testid={`icon-subject-${subject.id}`}
                  >
                    <Icon 
                      className="w-8 h-8" 
                      style={{ color: subject.color }}
                    />
                  </div>

                  {/* Subject title */}
                  <h3 
                    className="font-heading font-semibold text-xl"
                    style={{ color: subject.color }}
                    data-testid={`text-subject-title-${subject.id}`}
                  >
                    {subject.title}
                  </h3>

                  {/* Subject description */}
                  <p 
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid={`text-subject-description-${subject.id}`}
                  >
                    {subject.description}
                  </p>

                  {/* Learn more link */}
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center text-sm font-medium group-hover:underline"
                    style={{ color: subject.color }}
                    data-testid={`link-learn-more-${subject.id}`}
                  >
                    Learn More →
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
