import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/db'
import { 
    identifyUser, 
    trackDemoEntered, 
    trackGetStartedClicked, 
    trackLandingPageViewed, 
    trackOnboardingCompleted, 
    trackOnboardingSkipped 
} from '@/lib/analytics'
import { enterDemoMode, type DemoType } from '@/lib/demo'
import { ArrowRight, FlaskConical, Laptop, Lock, MapPin, Package, Shirt, Sparkles, Star, Watch, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const USER_NAME_KEY = 'fitsome_user_name'

export function getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY)
}

export function setUserName(name: string): void {
    localStorage.setItem(USER_NAME_KEY, name)
}

// Quirky logo component with animated letters
function FitSomeLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'text-2xl',
        md: 'text-4xl',
        lg: 'text-6xl md:text-8xl'
    }

    return (
        <h1 className={`${sizeClasses[size]} font-extrabold tracking-tight flex items-center justify-center gap-1`}>
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                FIT
            </span>
            <span className="text-pink-500 animate-pulse">·</span>
            <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                SO
            </span>
            <span className="text-violet-500 animate-pulse delay-150">·</span>
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
                ME
            </span>
        </h1>
    )
}

export default function Landing() {
    const navigate = useNavigate()
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [showDemoDialog, setShowDemoDialog] = useState(false)
    const [name, setName] = useState('')
    const [isChecking, setIsChecking] = useState(true)
    const [demoLoading, setDemoLoading] = useState(false)

    useEffect(() => {
        // Track landing page view
        trackLandingPageViewed()

        // Check if user already has data or has set their name
        const checkExistingUser = async () => {
            const existingName = getUserName()
            const items = await db.items.toArray()

            if (existingName || items.length > 0) {
                // User already exists, redirect to dashboard
                navigate('/dashboard', { replace: true })
            } else {
                setIsChecking(false)
            }
        }
        checkExistingUser()
    }, [navigate])

    const handleGetStarted = () => {
        trackGetStartedClicked()
        setShowOnboarding(true)
    }

    const handleSubmitName = () => {
        if (name.trim()) {
            setUserName(name.trim())
            // Identify user in PostHog with their name
            identifyUser(name.trim())
            trackOnboardingCompleted(true)
        } else {
            trackOnboardingSkipped()
        }
        navigate('/dashboard')
    }

    const handleSkip = () => {
        trackOnboardingSkipped()
        navigate('/dashboard')
    }

    const handleTryDemo = () => {
        setShowDemoDialog(true)
    }

    const handleSelectDemoType = async (type: DemoType) => {
        setShowDemoDialog(false)
        setDemoLoading(true)
        trackDemoEntered(type)
        const success = await enterDemoMode(type)
        if (success) {
            navigate('/dashboard', { replace: true })
            window.location.reload()
        }
        setDemoLoading(false)
    }

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-amber-950/10">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-amber-950/10">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Logo Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="h-20 w-20 md:h-28 md:w-28 rounded-3xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-pink-500/20 group-hover:scale-105 transition-transform">
                                <Package className="h-10 w-10 md:h-14 md:w-14 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce shadow-lg">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center animate-pulse shadow-lg">
                                <Zap className="h-3 w-3 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Title with quirky branding */}
                    <div className="space-y-4">
                        <FitSomeLogo />
                        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            <span className="text-foreground font-medium">Your stuff.</span>{' '}
                            <span className="text-foreground font-medium">Your style.</span>{' '}
                            <span className="text-foreground font-medium">Your way.</span>
                            <br />
                            <span className="text-base md:text-lg">
                                Manage everything you own, without the overwhelm.
                            </span>
                        </p>
                    </div>

                    {/* Feature highlights */}
                    <div className="flex flex-wrap justify-center gap-3 py-6">
                        {[
                            { icon: Shirt, label: 'Track Clothing', color: 'text-amber-400' },
                            { icon: Watch, label: 'Accessories', color: 'text-pink-400' },
                            { icon: Laptop, label: 'Gadgets', color: 'text-violet-400' },
                            { icon: MapPin, label: 'Pack for Trips', color: 'text-cyan-400' },
                            { icon: Star, label: 'Showcase Style', color: 'text-amber-400' },
                        ].map((feature) => (
                            <div
                                key={feature.label}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm hover:bg-secondary/70 hover:scale-105 transition-all cursor-default"
                            >
                                <feature.icon className={`h-4 w-4 ${feature.color}`} />
                                <span className="text-sm font-medium">{feature.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="pt-4 space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                onClick={handleGetStarted}
                                className="text-lg px-10 py-7 gap-3 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700 text-white font-bold shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all"
                            >
                                Get Started
                                <ArrowRight className="h-5 w-5" />
                            </Button>

                            {/* Try Demo - subtle link style */}
                            <button
                                onClick={handleTryDemo}
                                disabled={demoLoading}
                                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span className="text-sm">or</span>
                                <span className="flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 decoration-dashed decoration-muted-foreground/50 group-hover:decoration-foreground/50">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {demoLoading ? 'Loading demo...' : 'explore with sample data'}
                                </span>
                            </button>
                        </div>

                        {/* Privacy note */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span>100% private · All data stays in your browser</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="p-6 text-center relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        No accounts · No cloud · No complexity
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        Made with ✨ for people who like nice things
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                        <Link to="/privacy" className="hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        {' · '}
                        <a href="mailto:shashank@fitso.me" className="hover:text-foreground transition-colors">
                            Contact
                        </a>
                    </p>
                </div>
            </footer>

            {/* Onboarding Dialog */}
            <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <span>
                                Welcome to{' '}
                                <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent font-bold">
                                    FITSO.ME
                                </span>
                                !
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Let's make this yours. What should we call you?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitName()}
                                autoFocus
                                className="text-lg py-6"
                            />
                            <p className="text-xs text-muted-foreground">
                                We'll use this to personalize your dashboard ✨
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={handleSkip}>
                            Skip for now
                        </Button>
                        <Button
                            onClick={handleSubmitName}
                            className="gap-2 bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 hover:from-amber-600 hover:via-pink-600 hover:to-violet-700"
                        >
                            Let's Go!
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Demo Selection Dialog */}
            <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">
                            Choose Your Demo
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Pick a collection style to explore the app
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        {/* For Him */}
                        <button
                            onClick={() => handleSelectDemoType('him')}
                            disabled={demoLoading}
                            className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-slate-500/10 hover:from-blue-500/20 hover:to-slate-500/20 transition-all disabled:opacity-50"
                        >
                            <div className="text-5xl">⌚</div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-foreground">For Him</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tech, gear & everyday essentials
                                </p>
                            </div>
                            <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all" />
                        </button>

                        {/* For Her */}
                        <button
                            onClick={() => handleSelectDemoType('her')}
                            disabled={demoLoading}
                            className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-transparent hover:border-pink-500/50 bg-gradient-to-br from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 transition-all disabled:opacity-50"
                        >
                            <div className="text-5xl">👠</div>
                            <div className="text-center">
                                <p className="font-bold text-lg text-foreground">For Her</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Fashion, accessories & style
                                </p>
                            </div>
                            <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-pink-500/30 transition-all" />
                        </button>
                    </div>
                    {demoLoading && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            Loading demo...
                        </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                        Explore freely — your data stays safe
                    </p>
                </DialogContent>
            </Dialog>
        </div>
    )
}
