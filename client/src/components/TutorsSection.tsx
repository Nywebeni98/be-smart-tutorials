import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookingModal } from '@/components/BookingModal';
import { GraduationCap, Award, Building2, Heart, Users, Target, Star, BookOpen, Lightbulb, Calendar, DollarSign, Video, MessageCircle } from 'lucide-react';
import type { TutorProfile } from '@shared/schema';
import siyandaImage from '@assets/WhatsApp_Image_2025-12-01_at_22.46.26_1114b9ca_1764881684167.jpg';
import sibonisoImage from '@assets/WhatsApp_Image_2025-11-23_at_10.05.37_30c8290f_1764882512867.jpg';
import thamsanqaImage from '@assets/WhatsApp_Image_2025-12-05_at_11.28.31_2db17684_1764958250135.jpg';
import luthoImage from '@assets/WhatsApp_Image_2025-12-19_at_21.46.00_22d812e3_1766264032532.jpg';
import luthandoImage from '@assets/WhatsApp_Image_2025-12-22_at_15.52.01_0c22999e_1766433068327.jpg';

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
  hourlyRate: number;
  physicsRate?: number;
  googleMeetUrl: string;
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
    title: 'Professional Maths Tutor',
    image: siyandaImage,
    subjects: ['Maths', 'CAPS Curriculum', 'Cambridge Curriculum'],
    experience: '9+ Years Experience',
    education: 'BSc Mathematics, Computer Science & Statistics - UCT',
    bio: 'My name is Siyanda Stekela, and I am a professional Mathematics tutor with over 9 years of tutoring experience, specialising in all school grades and university-level Mathematics. I offer expert tutoring for both the CAPS curriculum and the Cambridge curriculum, supporting learners in achieving academic confidence and excellence.',
    quote: 'I am passionate about empowering students with the mathematical skills and confidence they need to succeed in their academic journey and beyond.',
    hourlyRate: 200,
    googleMeetUrl: 'https://meet.google.com/auv-hbbs-nre',
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
    hourlyRate: 200,
    physicsRate: 250,
    googleMeetUrl: 'https://meet.google.com/krq-nbsr-gnh',
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
    hourlyRate: 200,
    googleMeetUrl: 'https://meet.google.com/tha-msanqa-meet',
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
  {
    id: 'lutho-hanjana',
    name: 'Lutho Hanjana',
    title: 'Multi-Subject Tutor',
    image: luthoImage,
    subjects: ['Life Sciences', 'English', 'Maths', 'Physics'],
    experience: 'Qualified Health Professional',
    education: 'Qualification in Opticianry - Cape Peninsula University of Technology',
    bio: 'I have a qualification in Opticianry that I obtained at the Cape Peninsula University of Capetown in the Faculty of Health Science. My aim is to empower the youth with knowledge that will shape their future.',
    quote: 'Education is the key to unlocking potential. I am committed to helping every student achieve their academic goals.',
    hourlyRate: 200,
    physicsRate: 250,
    googleMeetUrl: 'https://meet.google.com/tgv-tccd-ges',
    highlights: [
      {
        icon: GraduationCap,
        title: 'Health Science Background',
        description: 'Qualified in Opticianry from Cape Peninsula University of Technology, bringing unique scientific perspective to tutoring.',
      },
      {
        icon: Users,
        title: 'Youth Empowerment Focus',
        description: 'Passionate about empowering young students with knowledge and skills to shape their future success.',
      },
      {
        icon: Star,
        title: 'Multi-Subject Expert',
        description: 'Teaches Life Sciences, English, Mathematics, and Physics across multiple grade levels with dedication and care.',
      },
    ],
  },
  {
    id: 'luthando-manisi',
    name: 'Luthando Manisi',
    title: 'Afrikaans Tutor',
    image: luthandoImage,
    subjects: ['Afrikaans'],
    experience: 'Passionate Educator',
    education: 'Afrikaans Language Specialist',
    bio: 'Ek is passievol oor Afrikaans en dit is my doel om hierdie pragtige taal met die jeug te deel! I am deeply passionate about teaching Afrikaans and helping students discover the beauty of this South African language. My unique teaching approach combines conversational practice with grammar fundamentals, making learning enjoyable and effective. "Afrikaans is nie net \'n taal nie, dit is \'n kultuur en \'n manier van lewe." Whether you\'re a beginner or looking to improve your fluency, I\'m here to guide you on your Afrikaans journey. Kom ons leer saam!',
    quote: 'Afrikaans is nie net \'n taal nie, dit is \'n kultuur en \'n manier van lewe.',
    hourlyRate: 250,
    googleMeetUrl: 'https://meet.google.com/vht-jkxn-hii',
    highlights: [
      {
        icon: Heart,
        title: 'Passionate About Afrikaans',
        description: 'Deeply passionate about teaching Afrikaans and sharing the beauty of this South African language with students.',
      },
      {
        icon: Lightbulb,
        title: 'Unique Teaching Approach',
        description: 'Combines conversational practice with grammar fundamentals, making learning enjoyable and effective.',
      },
      {
        icon: Users,
        title: 'All Levels Welcome',
        description: 'Whether you\'re a beginner or looking to improve fluency, expert guidance on your Afrikaans journey awaits.',
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

  // Convert featured tutor to TutorProfile format for booking modal
  // First check if there's a matching registered tutor to use the correct database ID
  const handleBookFeaturedTutor = (featuredTutor: Tutor) => {
    // Try to find matching registered tutor by name to get correct database ID
    const matchingRegisteredTutor = approvedTutors.find(
      t => t.fullName.toLowerCase() === featuredTutor.name.toLowerCase() || 
           t.supabaseUserId === featuredTutor.id
    );
    
    console.log('[handleBookFeaturedTutor] Featured tutor:', featuredTutor.name);
    console.log('[handleBookFeaturedTutor] Featured subjects:', featuredTutor.subjects);
    console.log('[handleBookFeaturedTutor] Matching DB tutor:', matchingRegisteredTutor?.fullName);
    console.log('[handleBookFeaturedTutor] DB subjects:', matchingRegisteredTutor?.subjects);
    
    // ALWAYS use featured tutor subjects as the SOURCE OF TRUTH
    // The featured tutors array has guaranteed correct subjects
    // DB may have stale or incorrectly formatted data
    const guaranteedSubjects = featuredTutor.subjects;
    
    console.log('[handleBookFeaturedTutor] Using subjects:', guaranteedSubjects);
    
    const tutorProfile: TutorProfile = {
      id: matchingRegisteredTutor?.id || featuredTutor.id,
      supabaseUserId: matchingRegisteredTutor?.supabaseUserId || featuredTutor.id,
      fullName: matchingRegisteredTutor?.fullName || featuredTutor.name,
      email: matchingRegisteredTutor?.email || (featuredTutor.id === 'lutho-hanjana' ? 'Luthohanjana125@gmail.com' : `${featuredTutor.id}@besmartonline.co.za`),
      passwordHash: matchingRegisteredTutor?.passwordHash || null,
      phone: matchingRegisteredTutor?.phone || null,
      bio: matchingRegisteredTutor?.bio || featuredTutor.bio,
      // CRITICAL FIX: Always use featured tutor subjects - they are guaranteed correct
      subjects: guaranteedSubjects,
      hourlyRate: matchingRegisteredTutor?.hourlyRate || featuredTutor.hourlyRate,
      photoUrl: matchingRegisteredTutor?.photoUrl || String(featuredTutor.image),
      googleMeetUrl: matchingRegisteredTutor?.googleMeetUrl || featuredTutor.googleMeetUrl,
      isApproved: matchingRegisteredTutor?.isApproved ?? true,
      isBlocked: matchingRegisteredTutor?.isBlocked ?? false,
      createdAt: matchingRegisteredTutor?.createdAt || new Date(),
      updatedAt: matchingRegisteredTutor?.updatedAt || new Date(),
    };
    
    console.log('[handleBookFeaturedTutor] Final profile subjects:', tutorProfile.subjects);
    
    setBookingTutor(tutorProfile);
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
          
          {/* Payment Instructions Banner */}
          <div 
            className="mt-8 mx-auto max-w-2xl p-6 rounded-xl border-4 border-orange-400"
            style={{ backgroundColor: 'hsl(var(--brand-orange) / 0.15)' }}
            data-testid="payment-instructions-banner"
          >
            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              AFTER PAYMENT, PLEASE SHARE YOUR PROOF OF PAYMENT TO:
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-300 mt-2">
              onlinepresenceimpact@gmail.com
            </p>
            <p className="text-lg sm:text-xl font-semibold text-orange-600 dark:text-orange-400 mt-3">
              A Google Meet link will be shared with you.
            </p>
            <p className="text-base sm:text-lg font-medium text-orange-600 dark:text-orange-400 mt-3">
              Please include the <span className="font-bold">TUTOR NAME</span> and <span className="font-bold">SUBJECT</span> you are booking in your email.
            </p>
          </div>
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
                      src={String(tutor.image)} 
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

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
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

                  {/* Pricing Section */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--brand-yellow))' }} />
                      <span className="font-semibold" style={{ color: 'hsl(var(--brand-orange))' }} data-testid={`text-rate-${tutor.id}`}>
                        R{tutor.hourlyRate}/hour
                      </span>
                    </div>
                    {tutor.physicsRate && (
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--brand-yellow))' }} />
                        <span className="font-semibold" style={{ color: 'hsl(var(--brand-orange))' }} data-testid={`text-physics-rate-${tutor.id}`}>
                          R{tutor.physicsRate}/hour (Physics)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Book & Pay Button */}
                  <div className="mt-4">
                    <Button
                      onClick={() => handleBookFeaturedTutor(tutor)}
                      className="text-white"
                      style={{ backgroundColor: 'hsl(var(--brand-blue))' }}
                      data-testid={`button-book-${tutor.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book & Pay
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Video className="w-3 h-3 inline mr-1" />
                      Google Meet link provided after payment
                    </p>
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

          {/* WhatsApp Group Link Banner */}
          <Card 
            className="p-6 text-center"
            style={{ 
              background: 'linear-gradient(135deg, hsl(142 70% 45%) 0%, hsl(142 70% 35%) 100%)',
            }}
            data-testid="card-whatsapp-banner"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MessageCircle className="w-8 h-8 text-white" />
              <div className="text-white">
                <p className="font-semibold text-lg mb-1">
                  Want to check tutor availability?
                </p>
                <p className="text-white/90 text-sm">
                  Join our WhatsApp group to see when tutors are available and ask questions directly!
                </p>
              </div>
              <a
                href="https://chat.whatsapp.com/EX3ukhiGNXh9uyuKSWcTv2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
                data-testid="link-whatsapp-group"
              >
                <MessageCircle className="w-5 h-5" />
                Join WhatsApp Group
              </a>
            </div>
          </Card>

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
