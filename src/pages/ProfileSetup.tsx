/**
 * Profile Setup Page
 * New users set their username here after signing up
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader2, Package, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, hasProfile, updateProfile, isLoading } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, redirect to landing
    if (!isLoading && !user) {
      navigate('/', { replace: true });
      return;
    }

    // If profile is already complete, redirect to dashboard
    if (hasProfile === true) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, hasProfile, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }

    // Validate username format (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (newUsername.length > 30) {
      setError('Username must be less than 30 characters');
      return;
    }

    setIsSubmitting(true);
    console.log('[ProfileSetup] Submitting profile with username:', newUsername);

    try {
      const result = await updateProfile(
        newUsername.trim(),
        displayName.trim() || newUsername.trim()
      );

      console.log('[ProfileSetup] Update profile result:', result);

      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        setIsSubmitting(false);
        return;
      }

      // Success! Go to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[ProfileSetup] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-amber-950/10">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-amber-950/10 px-4 py-8">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-xl">
                <Package className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose a username to get started. This will be your unique identifier.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 rounded-xl bg-secondary/30 border border-border/50 px-6 py-8 backdrop-blur-sm">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username <span className="text-red-400">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                disabled={isSubmitting}
                autoComplete="username"
                autoFocus
                required
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                3-30 characters. Letters, numbers, underscores, and hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">
                Display Name <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
                className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear to others.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700 text-white shadow-lg hover:shadow-pink-500/25 transition-all"
            size="lg"
            disabled={isSubmitting || !newUsername.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up your account...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Your email: <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}
