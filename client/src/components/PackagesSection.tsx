import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Check, 
  Star, 
  CreditCard,
  Clock,
  BookOpen,
  Calendar,
  ArrowRight,
  Flame,
  Share2,
  MessageCircle,
  Users,
  Percent
} from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";

const SALE_END_DATE = new Date('2026-03-16T23:59:59');

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 350,
    period: 'week',
    subjectsAllowed: 1,
    sessionsPerWeek: 3,
    sessionLength: '1 hour',
    totalHours: '3 hours/week',
    color: 'bg-green-500',
    popular: false,
    description: 'Best for learners who need support in one subject',
    ideal: 'Revision, homework support, and steady improvement',
  },
  {
    id: 'standard',
    name: 'Standard Package',
    price: 1200,
    period: 'month',
    subjectsAllowed: 2,
    sessionsPerWeek: 2,
    sessionLength: '2 hours',
    totalHours: '16 hours/month',
    color: 'bg-blue-500',
    popular: true,
    description: 'Perfect for deeper understanding and consistent progress',
    ideal: 'Deeper understanding and consistent progress across subjects',
  },
  {
    id: 'premium',
    name: 'Premium Package',
    originalPrice: 3200,
    price: 1500,
    period: 'month',
    subjectsAllowed: 3,
    sessionsPerWeek: 3,
    sessionLength: '2 hours',
    totalHours: '24 hours/month',
    color: 'bg-purple-500',
    popular: false,
    description: 'Intensive exam preparation and major improvements',
    ideal: 'Students preparing for finals or catching up quickly',
  },
];

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: SiFacebook, url: 'https://www.facebook.com/besmartonline', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'TikTok', icon: SiTiktok, url: 'https://www.tiktok.com/@besmartonline5?is_from_webapp=1&sender_device=pc', color: 'text-foreground' },
];

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export function PackagesSection() {
  const countdown = useCountdown(SALE_END_DATE);

  return (
    <section id="packages" className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!countdown.expired && (
          <div 
            className="mb-10 p-6 rounded-md border-2 text-center"
            style={{ 
              borderColor: 'hsl(var(--brand-orange))',
              background: 'linear-gradient(135deg, hsl(var(--brand-orange) / 0.15) 0%, hsl(var(--brand-yellow) / 0.15) 100%)'
            }}
            data-testid="banner-sale"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame className="w-6 h-6 text-red-500" />
              <h3 className="font-heading font-bold text-2xl sm:text-3xl text-red-600 dark:text-red-400">
                LIMITED TIME SALE
              </h3>
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--brand-blue))' }}>
              Get 30% OFF your monthly charges!
            </p>

            <div className="flex justify-center gap-3 mb-5 flex-wrap">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="bg-background rounded-md p-3 min-w-[70px] border" data-testid={`countdown-${item.label.toLowerCase()}`}>
                  <div className="text-2xl font-bold" style={{ color: 'hsl(var(--brand-blue))' }}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="max-w-xl mx-auto text-left space-y-2 mb-5">
              <p className="font-semibold text-base" style={{ color: 'hsl(var(--brand-blue))' }}>
                How to qualify for 30% OFF:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Follow us on ALL our social media pages (links below)</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Comment on our pages and repost our videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Send screenshots as proof to <strong>+27 79 512 3150</strong> on WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Bring 2 students who sign up and pay for the <strong>monthly package</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Percent className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Once confirmed, you get <strong>30% OFF</strong> your monthly charges!</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-social-${social.name.toLowerCase()}`}
                  >
                    <Button variant="outline" className="gap-2">
                      <Icon className={`w-4 h-4 ${social.color}`} />
                      {social.name}
                    </Button>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 
            className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-packages-heading"
          >
            Our Tutoring Packages
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose the package that best fits your learning needs. From weekly support to intensive monthly preparation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative transition-all hover:shadow-lg ${pkg.popular ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              data-testid={`card-package-${pkg.id}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500 hover:bg-blue-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {'originalPrice' in pkg && pkg.originalPrice && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-red-500 hover:bg-red-500 text-white">
                    SALE
                  </Badge>
                </div>
              )}
              <CardHeader className={`${pkg.popular ? 'pt-6' : ''}`}>
                <div className={`w-12 h-12 rounded-lg ${pkg.color} flex items-center justify-center mb-3`}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {'originalPrice' in pkg && pkg.originalPrice && (
                    <div className="text-lg text-muted-foreground line-through mb-1">
                      R{pkg.originalPrice.toLocaleString()}/{pkg.period}
                    </div>
                  )}
                  <span className="text-4xl font-bold">R{pkg.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/{pkg.period}</span>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.subjectsAllowed} subject{pkg.subjectsAllowed > 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.sessionsPerWeek} session{pkg.sessionsPerWeek > 1 ? 's' : ''} per week</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{pkg.sessionLength} per session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{pkg.totalHours}</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ideal for: {pkg.ideal}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/packages">
            <Button 
              size="lg" 
              className="gap-2"
              style={{ backgroundColor: 'hsl(var(--brand-blue))' }}
              data-testid="button-view-packages"
            >
              Choose Your Package
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            Select your subjects and proceed to payment
          </p>
        </div>
      </div>
    </section>
  );
}
