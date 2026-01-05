import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    headline: 'Excel in Your Studies with',
    brandName: 'Be Smart Online Tutorials',
    subtext: 'Quality, affordable tutoring in Mathematics, Science, English, and more. Empowering students across South Africa to achieve academic excellence.',
  },
  {
    headline: 'South Africa Learns Here –',
    brandName: 'Anywhere, Anytime',
    subtext: 'Accessible online tutoring designed to help every learner succeed—anytime, anywhere.',
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

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
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20" data-testid="badge-location">
            <GraduationCap className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium" data-testid="text-location">
              Serving South Africa
            </span>
          </div>

          <div className="relative min-h-[280px] sm:min-h-[240px]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <h1 
                  className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight"
                  data-testid={`text-hero-headline-${index}`}
                >
                  {slide.headline}
                  <span 
                    className="block mt-2"
                    style={{ color: 'hsl(var(--brand-yellow))' }}
                  >
                    {slide.brandName}
                  </span>
                </h1>

                <p 
                  className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mt-6"
                  data-testid={`text-hero-subheadline-${index}`}
                >
                  {slide.subtext}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
              data-testid="button-prev-slide"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40'
                  }`}
                  data-testid={`button-slide-indicator-${index}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
              data-testid="button-next-slide"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => scrollToSection('#subjects')}
              className="min-w-[200px] text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: 'hsl(var(--brand-yellow))',
                color: 'hsl(var(--brand-blue))',
              }}
              data-testid="button-browse-subjects"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Subjects
            </Button>

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
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
