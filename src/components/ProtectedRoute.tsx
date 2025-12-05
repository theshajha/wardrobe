/**
 * Protected Route Component
 * Token-based authentication check
 * - If not authenticated, redirect to landing
 * - If authenticated but no profile, redirect to profile setup
 * - Otherwise, allow access
 */

import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/lib/demo';
import { Package } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, hasProfile } = useAuth();
    const location = useLocation();

    // Show loading screen only during initial auth check (should be fast)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-muted-foreground">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Demo mode: allow access (temporary data, no persistence)
    if (isDemoMode()) {
        return <>{children}</>;
    }

    // Not authenticated: redirect to landing page
    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Authenticated but definitely no profile: redirect to profile setup
    // Only redirect if hasProfile is explicitly false (not null/loading)
    if (hasProfile === false) {
        return <Navigate to="/profile-setup" state={{ from: location }} replace />;
    }

    // Authenticated (hasProfile is true or still loading): allow access
    return <>{children}</>;
}
