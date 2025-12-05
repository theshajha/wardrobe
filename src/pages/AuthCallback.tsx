/**
 * Auth Callback Page
 * Handles magic link redirects from Supabase Auth
 * 
 * Supabase magic links can return tokens in different ways:
 * 1. PKCE flow: `code` in query params (needs exchange)
 * 2. Implicit flow: tokens in URL hash (handled automatically by supabase client)
 * 3. Magic link: tokens in URL hash with type=magiclink
 */

import { supabase } from '@/lib/supabase';
import { Loader2, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback...');
        console.log('[AuthCallback] URL:', window.location.href);

        // Check for error in URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          console.error('[AuthCallback] Error in URL:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setIsProcessing(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // First, check if we already have a session (Supabase's detectSessionInUrl may have handled it)
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          console.log('[AuthCallback] Session already exists!');
          setSuccess(true);
          setIsProcessing(false);
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 1500);
          return;
        }

        // Check for tokens in hash (implicit flow / magic link)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Found tokens in hash, setting session...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[AuthCallback] Set session error:', sessionError);
            setError(sessionError.message);
            setIsProcessing(false);
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          console.log('[AuthCallback] Authentication successful via hash tokens!');
          setSuccess(true);
          setIsProcessing(false);
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 1500);
          return;
        }

        // Check for PKCE code in query params
        const code = urlParams.get('code');

        if (code) {
          console.log('[AuthCallback] Found PKCE code, exchanging for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[AuthCallback] Code exchange error:', exchangeError);
            // PKCE error - likely opened in different browser
            // Provide helpful message
            if (exchangeError.message.includes('code verifier')) {
              setError('Please open this link in the same browser where you requested it. Magic links are tied to the browser session for security.');
            } else {
              setError(exchangeError.message);
            }
            setIsProcessing(false);
            setTimeout(() => navigate('/'), 5000);
            return;
          }

          console.log('[AuthCallback] Authentication successful via code exchange!');
          setSuccess(true);
          setIsProcessing(false);
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 1500);
          return;
        }

        // No authentication tokens found at all
        console.error('[AuthCallback] No authentication tokens found');
        setError('No authentication data found. Please request a new sign-in link.');
        setIsProcessing(false);
        setTimeout(() => navigate('/'), 3000);
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-amber-950/10 px-4">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-xl">
            <Package className="h-8 w-8 text-white" />
          </div>
        </div>

        {isProcessing ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-pink-500" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Verifying your email...
              </h2>
              <p className="mt-2 text-muted-foreground">Please wait while we sign you in.</p>
            </div>
          </>
        ) : error ? (
          <>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6">
              <h2 className="text-xl font-semibold text-red-400">Authentication Failed</h2>
              <p className="mt-2 text-red-300/80">{error}</p>
            </div>
            <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          </>
        ) : success ? (
          <>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6">
              <h2 className="text-xl font-semibold text-green-400">Welcome to Fitso.me!</h2>
              <p className="mt-2 text-green-300/80">You've been signed in successfully.</p>
            </div>
            <p className="text-sm text-muted-foreground">Setting up your account...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
