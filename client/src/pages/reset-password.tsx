import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertCircle, MailQuestion } from 'lucide-react';
import { passwordSchema } from '@shared/schema';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: '8-20 characters', test: (p) => p.length >= 8 && p.length <= 20 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

type PageState = 'loading' | 'valid' | 'expired' | 'success';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const initRecoverySession = async () => {
      try {
        // Check for tokens in both hash params (older Supabase) and query params (newer templates)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Try hash first, then query params
        let accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        let type = hashParams.get('type') || queryParams.get('type');
        
        // Also check for error in URL (e.g., expired link)
        const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        
        if (errorCode || errorDescription) {
          console.error('Recovery link error:', errorCode, errorDescription);
          setErrorMessage('This password reset link has expired or is invalid. Please request a new one.');
          setPageState('expired');
          return;
        }

        // If we have recovery tokens, set the session
        if (type === 'recovery' && accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            // Check for specific error codes
            if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
              setErrorMessage('This password reset link has expired. Please request a new one.');
            } else {
              setErrorMessage('Unable to verify reset link. Please request a new password reset.');
            }
            setPageState('expired');
            return;
          }
          
          // Clear the URL hash/params after successful session setup (prevents reuse)
          window.history.replaceState(null, '', window.location.pathname);
          setPageState('valid');
          return;
        }

        // No tokens in URL - check if there's an existing valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setErrorMessage('Unable to verify your session. Please request a new password reset.');
          setPageState('expired');
          return;
        }

        if (session) {
          // Valid session exists - user can reset password
          setPageState('valid');
        } else {
          // No session and no tokens - invalid access
          setErrorMessage('No valid reset link found. Please request a new password reset from the sign-in page.');
          setPageState('expired');
        }
      } catch (err) {
        console.error('Recovery initialization error:', err);
        setErrorMessage('An error occurred. Please request a new password reset.');
        setPageState('expired');
      }
    };

    initRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate password requirements
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setErrorMessage('Password does not meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // Verify session is still valid before updating
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrorMessage('Your session has expired. Please request a new password reset link.');
        setPageState('expired');
        setIsLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        
        // Handle specific error cases
        if (updateError.message?.includes('same')) {
          setErrorMessage('New password cannot be the same as your current password.');
        } else if (updateError.message?.includes('session') || updateError.message?.includes('expired')) {
          setErrorMessage('Your session has expired. Please request a new password reset link.');
          setPageState('expired');
        } else {
          setErrorMessage(updateError.message || 'Failed to update password. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Password updated successfully - sign out to clear recovery session
      await supabase.auth.signOut();
      
      setPageState('success');
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. Please sign in with your new password.',
      });

      // Redirect to home after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 3000);

    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    // Navigate to home page where they can access the tutor auth modal
    setLocation('/');
    toast({
      title: 'Request New Link',
      description: 'Click "Tutor Login" and then "Forgot your password?" to request a new reset link.',
    });
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Verifying reset link...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired/invalid link state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <MailQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Reset Link Expired</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Button onClick={handleRequestNewLink} className="w-full" data-testid="button-request-new-link">
                Request New Reset Link
              </Button>
              <Button variant="outline" onClick={() => setLocation('/')} className="w-full" data-testid="button-go-home">
                Go to Home Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Password Updated!</h2>
            <p className="text-muted-foreground mb-4">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to sign in...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid session - show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-new-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-1 mt-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.test(password) ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={req.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-reset-password"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation('/')}
                data-testid="link-cancel-reset"
              >
                Cancel and go to home
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
