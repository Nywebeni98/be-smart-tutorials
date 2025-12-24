import { Card } from '@/components/ui/card';
import tutorialVideo from '@assets/Green_and_Black_Quote_Facebook_Post_1766523658079.mp4';

export function VideoSection() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 
            className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold"
            data-testid="heading-video-section"
          >
            <span style={{ color: 'hsl(var(--brand-blue))' }}>BE SMART</span>{' '}
            <span style={{ color: 'hsl(var(--brand-orange))' }}>ONLINE TUTORIALS</span>
          </h2>
        </div>

        <Card className="overflow-hidden border-2" style={{ borderColor: 'hsl(var(--brand-orange))' }}>
          <div className="relative w-full bg-black rounded-lg overflow-hidden">
            <video 
              className="w-full h-auto"
              controls
              autoPlay
              muted
              loop
              playsInline
              data-testid="video-tutorial"
            >
              <source src={tutorialVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
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
