import { Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Landing from './pages/Landing'
import Outfits from './pages/Outfits'
import Packing from './pages/Packing'
import PhaseOut from './pages/PhaseOut'
import Settings from './pages/Settings'
import Showcase from './pages/Showcase'

function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
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

    // Landing page without sidebar
    if (isLandingPage) {
        return (
            <div className="min-h-screen pattern-dots">
                <Routes>
                    <Route path="/" element={<Landing />} />
                </Routes>
            </div>
        )
    }

    // All other pages with sidebar
    return (
        <AppLayout>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/showcase" element={<Showcase />} />
                <Route path="/packing" element={<Packing />} />
                <Route path="/outfits" element={<Outfits />} />
                <Route path="/phase-out" element={<PhaseOut />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </AppLayout>
    )
}
