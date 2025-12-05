import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, LogOut, Menu, Package, Plane, Settings, Shirt, ShoppingBag, Sparkles, Trash2, X, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Navigation grouped by workflow
const navGroups = [
  {
    label: 'Collection',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Outfits', href: '/outfits', icon: Shirt },
    ],
  },
  {
    label: 'Travel',
    items: [
      { name: 'Pack for Trip', href: '/packing', icon: Plane },
    ],
  },
  {
    label: 'Share',
    items: [
      { name: 'Showcase', href: '/showcase', icon: Sparkles },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Wishlist', href: '/wishlist', icon: ShoppingBag },
      { name: 'Phase Out', href: '/phase-out', icon: Trash2 },
    ],
  },
];

// Compact logo for sidebar
function FitSomeLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="font-extrabold text-lg tracking-tight">
        <span className="text-amber-400">F</span>
        <span className="text-pink-400">S</span>
        <span className="text-violet-400">M</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-extrabold text-lg tracking-tight flex items-center">
        <span className="text-amber-400">FIT</span>
        <span className="text-pink-400 text-xs mx-0.5">·</span>
        <span className="text-pink-400">SO</span>
        <span className="text-violet-400 text-xs mx-0.5">·</span>
        <span className="text-violet-400">ME</span>
      </h1>
      <p className="text-[10px] text-muted-foreground -mt-0.5">Your stuff. Your style.</p>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, username, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    onNavigate?.();
    navigate('/');
  };

  return (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <FitSomeLogo />
        </Link>
      </div>

      <div className="h-px bg-border shrink-0" />

      {/* Navigation with groups */}
      <nav className="flex-1 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {/* Section label */}
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>

            {/* Section items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 text-foreground border border-pink-500/30 shadow-lg shadow-pink-500/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', isActive && 'text-pink-400')} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Divider after each group except the last */}
            {groupIndex < navGroups.length - 1 && (
              <div className="h-px bg-border/50 mt-4" />
            )}
          </div>
        ))}
      </nav>

      <div className="h-px bg-border shrink-0" />

      {/* Settings & Account - At bottom */}
      <div className="p-3 md:p-4 shrink-0 space-y-2">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            location.pathname === '/settings'
              ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 text-foreground border border-pink-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Settings className={cn('h-4 w-4', location.pathname === '/settings' && 'text-pink-400')} />
          Settings
        </Link>

        {/* User Account Section - Only for authenticated users */}
        {isAuthenticated && user && (
          <>
            <div className="h-px bg-border/50" />
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <User className="h-3 w-3" />
                <span className="truncate">{username ? `@${username}` : user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <LogOut className="h-3 w-3" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b h-14 flex items-center px-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 via-pink-500 to-violet-600 flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold">
            <span className="text-amber-400">FIT</span>
            <span className="text-pink-400">SO</span>
            <span className="text-violet-400">ME</span>
          </span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r flex flex-col transform transition-transform duration-200',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setIsMobileOpen(false)} />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
