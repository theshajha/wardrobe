import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnalyticsProvider } from './components/AnalyticsProvider'
import { DemoBanner } from './components/DemoBanner'
import { Sidebar } from './components/Sidebar'
import { useAnalytics } from './hooks/useAnalytics'
import { isDemoMode } from './lib/demo'
import AuthVerify from './pages/AuthVerify'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Landing from './pages/Landing'
import Outfits from './pages/Outfits'
import Packing from './pages/Packing'
import PhaseOut from './pages/PhaseOut'
import Privacy from './pages/Privacy'
import PublicShowcase from './pages/PublicShowcase'
import Settings from './pages/Settings'
import Showcase from './pages/Showcase'
import Wishlist from './pages/Wishlist'

function AppLayout({ children, isDemo }: { children: React.ReactNode; isDemo: boolean }) {
    const { checkMilestones } = useAnalytics()

    // Check milestones on mount and when navigating
    useEffect(() => {
        checkMilestones()
    }, [checkMilestones])

    return (
        <div className={`flex min-h-screen ${isDemo ? 'pt-10' : ''}`}>
            <Sidebar />
            <main className={`flex-1 overflow-auto ${isDemo ? 'pt-14 md:pt-10' : 'pt-14 md:pt-0'}`}>
                <div className="pattern-dots min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default function App() {
    const location = useLocation()
    const isLandingPage = location.pathname === '/'
    const isAuthPage = location.pathname.startsWith('/auth')
    const isPrivacyPage = location.pathname === '/privacy'
    // Check if this is a public profile page (single path segment that's not a known route)
    const knownRoutes = ['dashboard', 'inventory', 'showcase', 'packing', 'outfits', 'phase-out', 'wishlist', 'settings', 'auth', 'privacy']
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const isPublicProfile = pathSegments.length === 1 && !knownRoutes.includes(pathSegments[0])
    const isDemo = isDemoMode()

    // Landing page without sidebar
    if (isLandingPage) {
        return (
            <AnalyticsProvider>
                <div className="min-h-screen pattern-dots">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                    </Routes>
                </div>
            </AnalyticsProvider>
        )
    }

    // Auth pages without sidebar
    if (isAuthPage) {
        return (
            <AnalyticsProvider>
                <Routes>
                    <Route path="/auth/verify" element={<AuthVerify />} />
                </Routes>
            </AnalyticsProvider>
        )
    }

    // Privacy page without sidebar
    if (isPrivacyPage) {
        return (
            <AnalyticsProvider>
                <Routes>
                    <Route path="/privacy" element={<Privacy />} />
                </Routes>
            </AnalyticsProvider>
        )
    }

    // Public profile pages without sidebar (e.g., /username)
    if (isPublicProfile) {
        return (
            <AnalyticsProvider>
                <Routes>
                    <Route path="/:username" element={<PublicShowcase />} />
                </Routes>
            </AnalyticsProvider>
        )
    }

    // All other pages with sidebar
    return (
        <AnalyticsProvider>
            <DemoBanner />
            <AppLayout isDemo={isDemo}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/showcase" element={<Showcase />} />
                    <Route path="/packing" element={<Packing />} />
                    <Route path="/outfits" element={<Outfits />} />
                    <Route path="/phase-out" element={<PhaseOut />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </AppLayout>
        </AnalyticsProvider>
    )
}
