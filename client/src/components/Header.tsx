// Header component with large Be Smart logo and Google Sign-In button
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoUrl from '@assets/Blue Minimal Idea Free Education Logo_1764023278343.png';

export function Header() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items for the menu
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Subjects', href: '#subjects' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  // Handle smooth scrolling to sections
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo and brand name - extra large as requested */}
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Be Smart Online Tutorials Logo" 
              className="h-16 w-16 lg:h-20 lg:w-20 object-contain"
              data-testid="img-logo"
            />
            <div className="flex flex-col">
              <span 
                className="font-heading font-bold text-xl lg:text-2xl"
                style={{ color: 'hsl(var(--brand-blue))' }}
                data-testid="text-brand-name"
              >
                BE SMART
              </span>
              <span 
                className="font-heading text-xs lg:text-sm font-medium"
                style={{ color: 'hsl(var(--brand-orange))' }}
                data-testid="text-brand-tagline"
              >
                ONLINE TUTORIALS
              </span>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-foreground hover:text-primary font-medium transition-colors hover-elevate px-3 py-2 rounded-md"
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Auth button / User menu - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 hover-elevate"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || 'User'} />
                      <AvatarFallback>{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={signOut} data-testid="button-sign-out">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={signInWithGoogle}
                className="font-semibold"
                style={{ 
                  backgroundColor: 'hsl(var(--brand-blue))',
                  color: 'white'
                }}
                data-testid="button-google-signin"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover-elevate"
            data-testid="button-mobile-menu"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block px-4 py-3 rounded-md hover-elevate text-foreground hover:text-primary font-medium"
                data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || 'User'} />
                      <AvatarFallback>{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
                  </div>
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="w-full"
                    data-testid="button-mobile-sign-out"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={signInWithGoogle}
                  className="w-full font-semibold"
                  style={{ 
                    backgroundColor: 'hsl(var(--brand-blue))',
                    color: 'white'
                  }}
                  data-testid="button-mobile-google-signin"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
