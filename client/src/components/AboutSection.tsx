// About section highlighting Be Smart Online Tutorials mission and approach
import { Card } from '@/components/ui/card';
import { MapPin, Target, Users, Award } from 'lucide-react';

export function AboutSection() {
  // Key features/values of the tutoring service
  const features = [
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'Tailored tutoring sessions designed to match your learning style and pace.',
    },
    {
      icon: Users,
      title: 'Expert Tutors',
      description: 'Qualified educators with years of experience and passion for teaching.',
    },
    {
      icon: Award,
      title: 'Proven Results',
      description: 'Track record of helping students improve grades and build confidence.',
    },
  ];

  return (
    <section id="about" className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Mission and location */}
          <div className="space-y-6">
            {/* Section heading */}
            <h2 
              className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl"
              style={{ color: 'hsl(var(--brand-blue))' }}
              data-testid="text-about-heading"
            >
              About Be Smart Online Tutorials
            </h2>

            {/* Mission statement */}
            <div className="space-y-4">
              <p 
                className="text-lg leading-relaxed text-foreground"
                data-testid="text-about-mission"
              >
                We believe every student in Khayelitsha deserves access to quality education. 
                Our mission is to empower learners with the knowledge, skills, and confidence 
                they need to excel academically and unlock their full potential.
              </p>
              
              <p className="text-lg leading-relaxed text-muted-foreground">
                Founded by passionate educators who understand the unique challenges faced by 
                students in our community, Be Smart Online Tutorials provides affordable, 
                accessible, and effective tutoring that makes a real difference.
              </p>
            </div>

            {/* Location highlight */}
            <Card className="p-6 border-2" style={{ borderColor: 'hsl(var(--brand-yellow))' }} data-testid="card-location-highlight">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'hsl(var(--brand-yellow) / 0.2)' }}
                >
                  <MapPin 
                    className="w-6 h-6" 
                    style={{ color: 'hsl(var(--brand-yellow))' }}
                  />
                </div>
                <div>
                  <h3 
                    className="font-heading font-semibold text-xl mb-2"
                    style={{ color: 'hsl(var(--brand-yellow))' }}
                    data-testid="text-location-heading"
                  >
                    Proudly Serving Khayelitsha
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Located in the heart of Khayelitsha, Cape Town, we're committed to 
                    building a brighter future for our community through education.
                  </p>
                </div>
              </div>
            </Card>

            {/* Teaching approach */}
            <div className="space-y-3" data-testid="section-teaching-approach">
              <h3 
                className="font-heading font-semibold text-2xl"
                style={{ color: 'hsl(var(--brand-orange))' }}
                data-testid="text-approach-heading"
              >
                Our Teaching Approach
              </h3>
              <ul className="space-y-2 text-muted-foreground" data-testid="list-teaching-points">
                <li className="flex items-start gap-2" data-testid="list-item-approach-0">
                  <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-orange))' }}>•</span>
                  <span>Interactive online sessions that engage and inspire</span>
                </li>
                <li className="flex items-start gap-2" data-testid="list-item-approach-1">
                  <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-orange))' }}>•</span>
                  <span>Focus on understanding concepts, not just memorization</span>
                </li>
                <li className="flex items-start gap-2" data-testid="list-item-approach-2">
                  <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-orange))' }}>•</span>
                  <span>Regular progress tracking and feedback for parents</span>
                </li>
                <li className="flex items-start gap-2" data-testid="list-item-approach-3">
                  <span className="text-lg font-bold" style={{ color: 'hsl(var(--brand-orange))' }}>•</span>
                  <span>Flexible scheduling to fit your family's needs</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right column - Key features cards */}
          <div className="space-y-6">
            {/* Feature cards */}
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 hover-elevate active-elevate-2 transition-all"
                  data-testid={`card-feature-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--brand-blue) / 0.2)' }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: 'hsl(var(--brand-blue))' }}
                      />
                    </div>
                    <div>
                      <h4 
                        className="font-heading font-semibold text-xl mb-2"
                        style={{ color: 'hsl(var(--brand-blue))' }}
                        data-testid={`text-feature-title-${index}`}
                      >
                        {feature.title}
                      </h4>
                      <p 
                        className="text-muted-foreground leading-relaxed"
                        data-testid={`text-feature-description-${index}`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Call to action card */}
            <Card 
              className="p-8 text-center border-2"
              style={{ 
                borderColor: 'hsl(var(--brand-yellow))',
                background: 'linear-gradient(135deg, hsl(var(--brand-blue) / 0.05) 0%, hsl(var(--brand-yellow) / 0.05) 100%)'
              }}
              data-testid="card-cta"
            >
              <h4 
                className="font-heading font-bold text-2xl mb-3"
                style={{ color: 'hsl(var(--brand-blue))' }}
                data-testid="text-cta-heading"
              >
                Ready to Get Started?
              </h4>
              <p className="text-muted-foreground mb-4">
                Join hundreds of students already improving their grades with Be Smart Online Tutorials.
              </p>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-block px-6 py-3 rounded-md font-semibold text-white hover-elevate active-elevate-2 transition-all"
                style={{ backgroundColor: 'hsl(var(--brand-orange))' }}
                data-testid="link-contact-us"
              >
                Contact Us Today
              </a>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
