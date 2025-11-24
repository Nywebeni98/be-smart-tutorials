// Contact section with Khayelitsha location information and contact form
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { InsertContactSubmission } from '@shared/schema';

export function ContactSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<InsertContactSubmission>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit contact form data to backend
      await apiRequest('POST', '/api/contact', formData);
      
      // Show success message
      toast({
        title: 'Message sent successfully!',
        description: 'We\'ll get back to you as soon as possible.',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      // Show error message
      toast({
        title: 'Error sending message',
        description: 'Please try again later or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contact information data
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Location',
      content: 'Khayelitsha, Cape Town, South Africa',
      color: 'hsl(var(--brand-blue))',
      bgColor: 'hsl(var(--brand-blue) / 0.2)',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+27 (0) 21 XXX XXXX',
      color: 'hsl(var(--brand-yellow))',
      bgColor: 'hsl(var(--brand-yellow) / 0.2)',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@besmarttutorials.co.za',
      color: 'hsl(var(--brand-orange))',
      bgColor: 'hsl(var(--brand-orange) / 0.2)',
    },
  ];

  return (
    <section id="contact" className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 
            className="font-heading font-semibold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-contact-heading"
          >
            Get in Touch
          </h2>
          <p 
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            data-testid="text-contact-description"
          >
            Have questions about our tutoring services? We're here to help! 
            Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column - Contact form */}
          <Card className="border-2" style={{ borderColor: 'hsl(var(--brand-blue))' }}>
            <CardHeader>
              <CardTitle 
                className="font-heading text-2xl"
                style={{ color: 'hsl(var(--brand-blue))' }}
                data-testid="text-form-heading"
              >
                Send Us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Your Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-12 text-base"
                    data-testid="input-name"
                  />
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Your Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 text-base"
                    data-testid="input-email"
                  />
                </div>

                {/* Subject field */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-base font-medium">
                    Subject *
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="Inquiry about tutoring services"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="h-12 text-base"
                    data-testid="input-subject"
                  />
                </div>

                {/* Message field */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-medium">
                    Your Message *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your tutoring needs..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="resize-none text-base"
                    data-testid="input-message"
                  />
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full text-base font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--brand-yellow))',
                    color: 'hsl(var(--brand-blue))',
                  }}
                  data-testid="button-submit"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right column - Contact information */}
          <div className="space-y-6">
            {/* Contact info cards */}
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 hover-elevate transition-all"
                  data-testid={`card-contact-info-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: info.bgColor }}
                      data-testid={`icon-contact-${index}`}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: info.color }}
                      />
                    </div>
                    <div>
                      <h4 
                        className="font-heading font-semibold text-lg mb-1"
                        style={{ color: info.color }}
                        data-testid={`text-contact-title-${index}`}
                      >
                        {info.title}
                      </h4>
                      <p 
                        className="text-muted-foreground"
                        data-testid={`text-contact-content-${index}`}
                      >
                        {info.content}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Office hours card */}
            <Card 
              className="p-6 border-2"
              style={{ borderColor: 'hsl(var(--brand-orange))' }}
              data-testid="card-hours"
            >
              <h4 
                className="font-heading font-semibold text-xl mb-4"
                style={{ color: 'hsl(var(--brand-orange))' }}
                data-testid="text-hours-heading"
              >
                Tutoring Hours
              </h4>
              <div className="space-y-2 text-muted-foreground" data-testid="hours-list">
                <div className="flex justify-between" data-testid="hours-weekday">
                  <span>Monday - Friday:</span>
                  <span className="font-medium">2:00 PM - 8:00 PM</span>
                </div>
                <div className="flex justify-between" data-testid="hours-saturday">
                  <span>Saturday:</span>
                  <span className="font-medium">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between" data-testid="hours-sunday">
                  <span>Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </Card>

            {/* Community message */}
            <Card 
              className="p-6"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--brand-blue) / 0.1) 0%, hsl(var(--brand-yellow) / 0.1) 100%)'
              }}
              data-testid="card-community"
            >
              <p className="text-center text-muted-foreground leading-relaxed">
                <span className="font-semibold" style={{ color: 'hsl(var(--brand-blue))' }}>
                  Proudly serving the Khayelitsha community.
                </span>
                <br />
                Together, we're building a brighter future through education.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
