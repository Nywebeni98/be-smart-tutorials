// Footer component with links, contact info, and social media
import { MapPin, Facebook } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';
import logoUrl from '@assets/Blue Minimal Idea Free Education Logo_1764023278343.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Footer navigation sections
  const quickLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Subjects', href: '#subjects' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const subjects = [
    { label: 'Mathematics', href: '#subjects' },
    { label: 'Sciences', href: '#subjects' },
    { label: 'English', href: '#subjects' },
    { label: 'More Subjects', href: '#subjects' },
  ];

  // Social media links
  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/share/1A7XLZ8AS4/', label: 'Facebook' },
    { icon: SiTiktok, href: 'https://www.tiktok.com/@besmart26k', label: 'TikTok' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - Brand and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoUrl} 
                alt="Be Smart Logo" 
                className="h-12 w-12 object-contain"
                data-testid="img-footer-logo"
              />
              <div className="flex flex-col">
                <span 
                  className="font-heading font-bold text-lg"
                  style={{ color: 'hsl(var(--brand-blue))' }}
                >
                  BE SMART
                </span>
                <span 
                  className="font-heading text-xs font-medium"
                  style={{ color: 'hsl(var(--brand-orange))' }}
                >
                  ONLINE TUTORIALS
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Quality tutoring services in Cape Town, South Africa. 
              Empowering students to achieve academic excellence.
            </p>
            {/* Social media icons */}
            <div className="flex items-center gap-3 pt-2" data-testid="social-links">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all group hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    style={{ backgroundColor: 'hsl(var(--brand-blue) / 0.1)' }}
                    data-testid={`link-social-${social.label.toLowerCase()}`}
                  >
                    <Icon 
                      className="w-5 h-5 transition-colors text-[hsl(var(--brand-blue))] group-hover:!text-orange-500"
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2 - Quick links */}
          <div>
            <h3 
              className="font-heading font-semibold text-lg mb-4"
              style={{ color: 'hsl(var(--brand-blue))' }}
              data-testid="text-footer-quick-links"
            >
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover-elevate px-2 py-1 rounded-md inline-block"
                    data-testid={`link-footer-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Subjects */}
          <div>
            <h3 
              className="font-heading font-semibold text-lg mb-4"
              style={{ color: 'hsl(var(--brand-yellow))' }}
              data-testid="text-footer-subjects"
            >
              Popular Subjects
            </h3>
            <ul className="space-y-3">
              {subjects.map((subject, index) => (
                <li key={index}>
                  <a
                    href={subject.href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(subject.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover-elevate px-2 py-1 rounded-md inline-block"
                    data-testid={`link-footer-subject-${index}`}
                  >
                    {subject.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact info */}
          <div>
            <h3 
              className="font-heading font-semibold text-lg mb-4"
              style={{ color: 'hsl(var(--brand-orange))' }}
              data-testid="text-footer-contact"
            >
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin 
                  className="w-5 h-5 flex-shrink-0 mt-0.5" 
                  style={{ color: 'hsl(var(--brand-orange))' }}
                />
                <span className="text-sm text-muted-foreground">
                  Cape Town, South Africa
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom footer bar */}
      <div 
        className="border-t border-border py-6"
        style={{ backgroundColor: 'hsl(var(--brand-blue))/5' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {currentYear} Be Smart Online Tutorials. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground text-center sm:text-right">
              Made with care in{' '}
              <span 
                className="font-semibold"
                style={{ color: 'hsl(var(--brand-orange))' }}
              >
                Cape Town, South Africa
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
