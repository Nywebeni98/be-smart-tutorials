import { useState } from "react";
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
  ArrowRight
} from "lucide-react";

// Package definitions
const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 750,
    subjectsAllowed: 1,
    sessionsPerWeek: 1,
    sessionLength: '1 hour',
    totalHours: 4,
    savings: 50,
    color: 'bg-green-500',
    popular: false,
    description: 'Best for learners who need support in one subject',
    ideal: 'Revision, homework support, and steady improvement',
  },
  {
    id: 'standard',
    name: 'Standard Package',
    price: 1500,
    subjectsAllowed: 2,
    sessionsPerWeek: 2,
    sessionLength: '1 hour',
    totalHours: 8,
    savings: 100,
    color: 'bg-blue-500',
    popular: true,
    description: 'Balanced academic support across multiple subjects',
    ideal: 'Balanced academic support across multiple subjects',
  },
  {
    id: 'premium',
    name: 'Premium Package',
    price: 3200,
    subjectsAllowed: 3,
    sessionsPerWeek: 3,
    sessionLength: '1.5 hours',
    totalHours: 18,
    savings: 400,
    color: 'bg-purple-500',
    popular: false,
    description: 'Best for exam preparation and intensive support',
    ideal: 'Exam preparation, deep understanding, and fast progress',
  },
];

export function PackagesSection() {
  return (
    <section id="packages" className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 
            className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl mb-4"
            style={{ color: 'hsl(var(--brand-blue))' }}
            data-testid="text-packages-heading"
          >
            Monthly Tutoring Packages
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Save more with our monthly packages! All packages are based on our standard rate 
            of R200 per hour, with discounted pricing for monthly commitment.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            Save more with monthly packages compared to pay-as-you-go lessons
          </div>
        </div>

        {/* Package Cards */}
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
              <CardHeader className={`${pkg.popular ? 'pt-6' : ''}`}>
                <div className={`w-12 h-12 rounded-lg ${pkg.color} flex items-center justify-center mb-3`}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold">R{pkg.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/month</span>
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
                    <span className="font-medium">{pkg.totalHours} hours per month</span>
                  </li>
                </ul>

                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-center py-2 px-3 rounded-md text-sm font-medium">
                  Save R{pkg.savings} compared to hourly rate
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  Ideal for: {pkg.ideal}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
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
