// Main home page combining all sections for Be Smart Online Tutorials
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SubjectsSection } from '@/components/SubjectsSection';
import { AboutSection } from '@/components/AboutSection';
import { TutorsSection } from '@/components/TutorsSection';
import { VideoSection } from '@/components/VideoSection';
import { AppointmentSection } from '@/components/AppointmentSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation and sign-in */}
      <Header />
      
      {/* Main content sections */}
      <main>
        {/* Hero section with call-to-action */}
        <Hero />
        
        {/* Subjects we teach */}
        <SubjectsSection />
        
        {/* About our tutoring service */}
        <AboutSection />
        
        {/* Meet our tutors */}
        <TutorsSection />
        
        {/* Video testimonials and benefits */}
        <VideoSection />
        
        {/* Book an appointment */}
        <AppointmentSection />
        
        {/* Contact form and information */}
        <ContactSection />
      </main>
      
      {/* Footer with links and contact info */}
      <Footer />
    </div>
  );
}
