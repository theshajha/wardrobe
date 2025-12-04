/**
 * Auth Verification Page
 * Handles magic link token verification from email links
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink, parseTokenFromUrl } from '@/lib/sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

type VerifyState = 'verifying' | 'success' | 'error';

export default function AuthVerify() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [state, setState] = useState<VerifyState>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Verifying... | Fitso.me';
    }, []);

    useEffect(() => {
        const verifyToken = async () => {
            // Get token from URL params
            const token = searchParams.get('token') || parseTokenFromUrl(window.location.href);
            
            if (!token) {
                setState('error');
                setError('No verification token found');
                return;
            }

            // Verify the token
            const result = await verifyMagicLink(token);
            
            if (result.success && result.session) {
                setState('success');
                setEmail(result.session.email);
                
                // Redirect to settings after a short delay
                setTimeout(() => {
                    navigate('/settings', { replace: true });
                }, 2000);
            } else {
                setState('error');
                setError(result.error || 'Verification failed');
            }
        };

        verifyToken();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pattern-dots">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <span className="text-2xl font-extrabold">
                            <span className="text-amber-400">FIT</span>
                            <span className="text-pink-400">·</span>
                            <span className="text-pink-400">SO</span>
                            <span className="text-violet-400">·</span>
                            <span className="text-violet-400">ME</span>
                        </span>
                    </div>
                    <CardTitle>
                        {state === 'verifying' && 'Verifying...'}
                        {state === 'success' && 'Welcome!'}
                        {state === 'error' && 'Verification Failed'}
                    </CardTitle>
                    <CardDescription>
                        {state === 'verifying' && 'Please wait while we verify your sign-in link'}
                        {state === 'success' && `Signed in as ${email}`}
                        {state === 'error' && 'We couldn\'t verify your sign-in link'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {state === 'verifying' && (
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    )}
                    
                    {state === 'success' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Redirecting to settings...
                            </p>
                        </>
                    )}
                    
                    {state === 'error' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-sm text-red-500 text-center">
                                {error}
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => navigate('/')}>
                                    Go Home
                                </Button>
                                <Button onClick={() => navigate('/settings')}>
                                    Try Again
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

