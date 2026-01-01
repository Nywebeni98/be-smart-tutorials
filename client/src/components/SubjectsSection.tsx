// Subjects and courses display section with interactive cards
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calculator, 
  Beaker, 
  BookOpen, 
  Languages, 
  Brain,
  Globe
} from 'lucide-react';

export function SubjectsSection() {
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
      title: 'Life Sciences',
      description: 'Explore biology, anatomy, and the living world with hands-on learning and expert guidance.',
      icon: Brain,
      color: 'hsl(var(--brand-blue))',
      bgColor: 'hsl(var(--brand-blue) / 0.2)',
    },
    {
      id: 8,
      title: 'Geography',
      description: 'Understand our world through the study of physical landscapes, human interactions, and environmental systems.',
      icon: Globe,
      color: 'hsl(var(--brand-yellow))',
      bgColor: 'hsl(var(--brand-yellow) / 0.2)',
    },
  ];

  return (
    <section id="subjects" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
