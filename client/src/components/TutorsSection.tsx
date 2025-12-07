import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookingModal } from '@/components/BookingModal';
import { GraduationCap, Award, Building2, Heart, Users, Target, Star, BookOpen, Lightbulb, Calendar, DollarSign } from 'lucide-react';
import type { TutorProfile } from '@shared/schema';
import siyandaImage from '@assets/WhatsApp_Image_2025-12-01_at_22.46.26_1114b9ca_1764881684167.jpg';
import sibonisoImage from '@assets/WhatsApp_Image_2025-11-23_at_10.05.37_30c8290f_1764882512867.jpg';
import thamsanqaImage from '@assets/WhatsApp_Image_2025-12-05_at_11.28.31_2db17684_1764958250135.jpg';

interface Tutor {
  id: string;
  name: string;
  title: string;
  image: string;
  subjects: string[];
  experience: string;
  education: string;
  bio: string;
  quote: string;
  highlights: {
    icon: typeof GraduationCap;
    title: string;
    description: string;
  }[];
}

const tutors: Tutor[] = [
  {
    id: 'siyanda-stekela',
    name: 'Siyanda Stekela',
    title: 'Professional Mathematics Tutor',
    image: siyandaImage,
    subjects: ['Mathematics', 'CAPS Curriculum', 'Cambridge Curriculum'],
    experience: '9+ Years Experience',
    education: 'BSc Mathematics, Computer Science & Statistics - UCT',
    bio: 'My name is Siyanda Stekela, and I am a professional Mathematics tutor with over 9 years of tutoring experience, specialising in all school grades and university-level Mathematics. I offer expert tutoring for both the CAPS curriculum and the Cambridge curriculum, supporting learners in achieving academic confidence and excellence.',
    quote: 'I am passionate about empowering students with the mathematical skills and confidence they need to succeed in their academic journey and beyond.',
    highlights: [
      {
        icon: GraduationCap,
        title: 'Academic Excellence',
        description: 'Bachelor of Science (BSc) degree in Mathematics, Computer Science, and Statistics from the University of Cape Town (UCT).',
      },
      {
        icon: Building2,
        title: 'Founder - Stekela Academy',
        description: 'A tutoring company committed to improving learner performance through structured, personalised teaching.',
      },
      {
        icon: Heart,
        title: 'Co-founder - The Spot NPO',
        description: 'Focused on mentorship, youth development, and academic support for the community.',
      },
    ],
  },
  {
    id: 'siboniso-shandu',
    name: 'Siboniso Shandu',
    title: 'Mathematics & Physical Sciences Tutor',
    image: sibonisoImage,
    subjects: ['Mathematics', 'Physical Sciences'],
    experience: '8+ Years Experience',
    education: 'BEd Student - UNISA',
    bio: 'I am a BEd student at UNISA and a dedicated tutor in Mathematics and Physical Sciences, with over 8 years of tutoring experience. I am passionate about helping learners truly understand the subjects by breaking down difficult concepts into simple, clear explanations. My teaching style is learner-centred and highly interactive, allowing students to build strong foundational understanding before attempting questions.',
    quote: 'My goal is not only to help learners pass, but to help them excel. I guide learners step-by-step to improve their confidence and develop effective exam-writing strategies.',
    highlights: [
      {
        icon: Target,
        title: 'Learner-Centred Approach',
        description: 'Step-by-step guidance on how to approach different types of problems and develop effective study strategies.',
      },
      {
        icon: Star,
        title: 'Outstanding Results',
        description: 'Proven track record of helping many learners improve their marks dramatically over the years.',
      },
      {
        icon: Users,
        title: 'Individual Focus',
        description: 'Patient and committed to each learner\'s individual needs, helping them not just pass, but excel.',
      },
    ],
  },
  {
    id: 'thamsanqa-ngonyama',
    name: 'Thamsanqa Charles Ngonyama',
    title: 'English, History & CAT Tutor',
    image: thamsanqaImage,
    subjects: ['English', 'History', 'CAT'],
    experience: 'Qualified Educator',
    education: 'BEd Senior & FET Phase (English & History) - UJ',
    bio: 'I am Thamsanqa Charles Ngonyama. I hold a Bachelor of Education in Senior and FET Phase (English and History) from the University of Johannesburg. I have tutored learners for a couple of years in English, History and CAT. I have always been passionate about teaching which is why I chose it as a career. My degree has equipped me with the necessary skills to create intervention plans for learners that have a hard time grasping content, which makes me the ideal tutor.',
    quote: 'Teaching is not just a career for me, it is my passion. I believe every learner can succeed with the right support and guidance.',
    highlights: [
      {
        icon: GraduationCap,
        title: 'Qualified Educator',
        description: 'Bachelor of Education degree from the University of Johannesburg, specialising in Senior and FET Phase teaching.',
      },
      {
        icon: Lightbulb,
        title: 'Intervention Specialist',
        description: 'Skilled in creating personalised intervention plans for learners who struggle with challenging content.',
      },
      {
        icon: BookOpen,
        title: 'Humanities Expert',
        description: 'Passionate about English, History and Computer Applications Technology, helping learners develop critical thinking skills.',
      },
    ],
  },
];

export function TutorsSection() {
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data: registeredTutors = [] } = useQuery<TutorProfile[]>({
    queryKey: ['/api/tutor-profiles'],
  });

  const approvedTutors = registeredTutors.filter(t => t.isApproved && !t.isBlocked);

  const handleBookTutor = (tutor: TutorProfile) => {
    setBookingTutor(tutor);
    setBookingModalOpen(true);
  };

  return (
    <section id="tutors" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 
            className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-tutors-heading"
          >
            Meet Our Tutors
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-tutors-subtitle">
            Our dedicated team of qualified educators are passionate about helping students achieve their academic goals.
          </p>
        </div>

        <div className="space-y-12">
          {tutors.map((tutor) => (
            <Card 
              key={tutor.id}
              className="overflow-hidden"
              data-testid={`card-tutor-${tutor.id}`}
            >
              <div className="grid lg:grid-cols-3 gap-0">
                <div 
                  className="lg:col-span-1 p-8 flex flex-col items-center justify-center text-center"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--brand-blue) / 0.1) 0%, hsl(var(--brand-yellow) / 0.1) 100%)'
                  }}
                >
                  <Avatar className="w-48 h-48 mb-6 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={tutor.image} 
                      alt={tutor.name}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="text-4xl font-bold" style={{ backgroundColor: 'hsl(var(--brand-blue))', color: 'white' }}>
                      {tutor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 
                    className="font-heading font-bold text-2xl mb-2"
                    style={{ color: 'hsl(var(--brand-blue))' }}
                    data-testid={`text-tutor-name-${tutor.id}`}
                  >
                    {tutor.name}
                  </h3>
                  
                  <p 
                    className="font-medium text-lg mb-4"
                    style={{ color: 'hsl(var(--brand-orange))' }}
                    data-testid={`text-tutor-title-${tutor.id}`}
                  >
                    {tutor.title}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Badge 
                      className="text-white"
                      style={{ backgroundColor: 'hsl(var(--brand-yellow))' }}
                      data-testid={`badge-experience-${tutor.id}`}
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {tutor.experience}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {tutor.subjects.map((subject, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline"
                        className="border-2"
                        style={{ borderColor: 'hsl(var(--brand-blue))', color: 'hsl(var(--brand-blue))' }}
                        data-testid={`badge-subject-${tutor.id}-${idx}`}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 p-8">
                  <div className="space-y-6">
                    <div>
                      <h4 
                        className="font-heading font-semibold text-xl mb-3"
                        style={{ color: 'hsl(var(--brand-blue))' }}
                        data-testid={`text-about-tutor-${tutor.id}`}
                      >
                        About {tutor.name.split(' ')[0]}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed" data-testid={`text-bio-${tutor.id}`}>
                        {tutor.bio}
                      </p>
                    </div>

                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg"
                      style={{ backgroundColor: 'hsl(var(--brand-blue) / 0.1)' }}
                    >
                      <GraduationCap className="w-6 h-6 flex-shrink-0" style={{ color: 'hsl(var(--brand-blue))' }} />
                      <p className="font-medium" style={{ color: 'hsl(var(--brand-blue))' }} data-testid={`text-education-${tutor.id}`}>
                        {tutor.education}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      {tutor.highlights.map((highlight, idx) => {
                        const Icon = highlight.icon;
                        return (
                          <Card 
                            key={idx}
                            className="p-4 hover-elevate transition-all"
                            data-testid={`card-highlight-${tutor.id}-${idx}`}
                          >
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                              style={{ backgroundColor: 'hsl(var(--brand-yellow) / 0.2)' }}
                            >
                              <Icon className="w-5 h-5" style={{ color: 'hsl(var(--brand-yellow))' }} />
                            </div>
                            <h5 
                              className="font-heading font-semibold text-sm mb-1"
                              style={{ color: 'hsl(var(--brand-orange))' }}
                              data-testid={`text-highlight-title-${tutor.id}-${idx}`}
                            >
                              {highlight.title}
                            </h5>
                            <p className="text-sm text-muted-foreground" data-testid={`text-highlight-desc-${tutor.id}-${idx}`}>
                              {highlight.description}
                            </p>
                          </Card>
                        );
                      })}
                    </div>

                    <p className="text-muted-foreground italic leading-relaxed" data-testid={`text-passion-${tutor.id}`}>
                      "{tutor.quote}"
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Registered tutors from database */}
          {approvedTutors.length > 0 && (
            <>
              <div className="border-t pt-12 mt-12">
                <h3 
                  className="font-heading font-semibold text-2xl sm:text-3xl mb-8 text-center"
                  style={{ color: 'hsl(var(--brand-blue))' }}
                  data-testid="text-more-tutors-heading"
                >
                  Book a Session with Our Online Tutors
                </h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedTutors.map((tutor) => (
                  <Card 
                    key={tutor.id}
                    className="overflow-hidden hover-elevate transition-all"
                    data-testid={`card-registered-tutor-${tutor.id}`}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-16 h-16 border-2 border-primary/20">
                          <AvatarFallback 
                            className="text-xl font-bold"
                            style={{ backgroundColor: 'hsl(var(--brand-blue))', color: 'white' }}
                          >
                            {tutor.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 
                            className="font-heading font-semibold text-lg"
                            style={{ color: 'hsl(var(--brand-blue))' }}
                            data-testid={`text-reg-tutor-name-${tutor.id}`}
                          >
                            {tutor.fullName}
                          </h4>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                        </div>
                      </div>

                      {tutor.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`text-reg-tutor-bio-${tutor.id}`}>
                          {tutor.bio}
                        </p>
                      )}

                      {tutor.subjects && tutor.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tutor.subjects.map((subject, idx) => (
                            <Badge 
                              key={idx}
                              variant="outline"
                              className="border-2"
                              style={{ borderColor: 'hsl(var(--brand-blue))', color: 'hsl(var(--brand-blue))' }}
                              data-testid={`badge-reg-subject-${tutor.id}-${idx}`}
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--brand-yellow))' }} />
                          <span className="font-semibold" style={{ color: 'hsl(var(--brand-orange))' }}>
                            R{tutor.hourlyRate}/hour
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        style={{ 
                          backgroundColor: 'hsl(var(--brand-blue))',
                          color: 'white'
                        }}
                        onClick={() => handleBookTutor(tutor)}
                        data-testid={`button-book-${tutor.id}`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book a Session
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        tutor={bookingTutor} 
      />
    </section>
  );
}
