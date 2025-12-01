import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';

export function VideoSection() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 
            className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-video-heading"
          >
            See How We Help Students Succeed
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            data-testid="text-video-description"
          >
            Watch testimonials from our students and learn about our tutoring approach.
          </p>
        </div>

        <Card className="overflow-hidden border-2" style={{ borderColor: 'hsl(var(--brand-orange))' }}>
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            {/* Video placeholder with play button */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/50 to-black/70">
              <div className="text-center space-y-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto cursor-pointer hover-elevate transition-all"
                  style={{ backgroundColor: 'hsl(var(--brand-orange))' }}
                  data-testid="button-play-video"
                >
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
                <p className="text-white text-lg">Your Tutoring Video</p>
                <p className="text-white/70 text-sm">Add your video URL or upload from YouTube</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Expert Tutors', description: 'Experienced educators in all subjects' },
            { title: 'Personalized Learning', description: 'Customized approach for each student' },
            { title: 'Proven Results', description: 'Students improve grades consistently' },
          ].map((item, index) => (
            <Card 
              key={index} 
              className="p-6 text-center hover-elevate transition-all"
              data-testid={`card-benefit-${index}`}
            >
              <h3 
                className="font-heading font-semibold text-xl mb-2"
                style={{ color: 'hsl(var(--brand-blue))' }}
                data-testid={`text-benefit-title-${index}`}
              >
                {item.title}
              </h3>
              <p className="text-muted-foreground" data-testid={`text-benefit-desc-${index}`}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
