import { cn } from '@/lib/utils';
import { LayoutDashboard, Menu, Package, Plane, Settings, Shirt, Sparkles, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Navigation grouped by workflow
const navGroups = [
  {
    label: 'Wardrobe',
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
      { name: 'Phase Out', href: '/phase-out', icon: Trash2 },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Package className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nomad</h1>
            <p className="text-xs text-muted-foreground">Wardrobe Manager</p>
          </div>
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
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
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

      {/* Settings - Always at bottom */}
      <div className="p-3 md:p-4 shrink-0">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
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
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Package className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold">Nomad</span>
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
