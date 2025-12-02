import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/db'
import { ArrowRight, Laptop, MapPin, Package, Shirt, Sparkles, Star, Watch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const USER_NAME_KEY = 'capsule_user_name'

export function getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY)
}

export function setUserName(name: string): void {
    localStorage.setItem(USER_NAME_KEY, name)
}

export default function Landing() {
    const navigate = useNavigate()
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [name, setName] = useState('')
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
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
        setShowOnboarding(true)
    }

    const handleSubmitName = () => {
        if (name.trim()) {
            setUserName(name.trim())
        }
        navigate('/dashboard')
    }

    const handleSkip = () => {
        navigate('/dashboard')
    }

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
                                <Package className="h-12 w-12 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center animate-pulse">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Capsule
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                            Manage everything you own, without the overwhelm.
                            Track, organize, and curate your belongings.
                        </p>
                    </div>

                    {/* Feature highlights */}
                    <div className="flex flex-wrap justify-center gap-4 py-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                            <Shirt className="h-4 w-4 text-blue-400" />
                            <span className="text-sm">Track Clothing</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                            <Watch className="h-4 w-4 text-purple-400" />
                            <span className="text-sm">Manage Accessories</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                            <Laptop className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm">Catalog Gadgets</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span className="text-sm">Pack for Trips</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                            <Star className="h-4 w-4 text-amber-400" />
                            <span className="text-sm">Showcase Favorites</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-4">
                        <Button
                            size="lg"
                            onClick={handleGetStarted}
                            className="text-lg px-8 py-6 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-xl shadow-violet-500/25"
                        >
                            Get Started
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Privacy note */}
                    <p className="text-sm text-muted-foreground">
                        🔒 100% private. All data stays in your browser.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="p-6 text-center text-sm text-muted-foreground border-t border-border/50">
                <p>Your stuff, your way. No accounts, no cloud, no complexity.</p>
            </footer>

            {/* Onboarding Dialog */}
            <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5 text-violet-400" />
                            Welcome to Capsule!
                        </DialogTitle>
                        <DialogDescription>
                            Let's personalize your experience. What should we call you?
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
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be used to personalize your dashboard.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={handleSkip}>
                            Skip for now
                        </Button>
                        <Button onClick={handleSubmitName} className="gap-2">
                            Let's Go
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

