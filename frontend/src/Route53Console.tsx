import React, { useState, useEffect } from 'react';
import { User, HostedZone, ToastMessage } from './types/route53';
import { api } from './services/api';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumbs, BreadcrumbItem } from './components/layout/Breadcrumbs';
import { Toast } from './components/ui/Toast';
import { LoginPage } from './components/auth/LoginPage';
import { HostedZonesList } from './components/zones/HostedZonesList';
import { RecordsList } from './components/records/RecordsList';
import { ComingSoonView } from './components/placeholder/ComingSoonView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Navigation & Shell state
  const [currentView, setCurrentView] = useState<string>('hosted-zones');
  const [activeZone, setActiveZone] = useState<HostedZone | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState('Global (Route 53)');
  const [totalZonesCount, setTotalZonesCount] = useState<number>(0);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchZoneCount = async () => {
    try {
      const data = await api.getHostedZones(1, 1);
      setTotalZonesCount(data.total);
    } catch {
      // ignore
    }
  };

  // Check existing session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('r53_user');
        const token = localStorage.getItem('r53_session_token');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        } else {
          const remoteUser = await api.getCurrentUser();
          if (remoteUser) {
            setUser(remoteUser);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchZoneCount();
    }
  }, [user]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    addToast({
      type: 'info',
      title: 'Signed out',
      message: 'You have been safely signed out of the AWS console.',
    });
  };

  const handleSelectZone = (zone: HostedZone) => {
    setActiveZone(zone);
    setCurrentView('hosted-zone-detail');
  };

  const handleBackToZones = () => {
    setActiveZone(null);
    setCurrentView('hosted-zones');
    fetchZoneCount();
  };

  // Determine breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [
      {
        label: 'Route 53',
        onClick: () => {
          setActiveZone(null);
          setCurrentView('hosted-zones');
        },
      },
    ];

    if (currentView === 'hosted-zones') {
      crumbs.push({ label: 'Hosted zones', active: true });
    } else if (currentView === 'hosted-zone-detail' && activeZone) {
      crumbs.push({
        label: 'Hosted zones',
        onClick: handleBackToZones,
      });
      crumbs.push({
        label: `${activeZone.name} (${activeZone.zone_id})`,
        active: true,
      });
    } else if (currentView === 'traffic-policies') {
      crumbs.push({ label: 'Traffic policies', active: true });
    } else if (currentView === 'health-checks') {
      crumbs.push({ label: 'Health checks', active: true });
    } else if (currentView === 'resolver') {
      crumbs.push({ label: 'Resolver', active: true });
    } else if (currentView === 'profiles') {
      crumbs.push({ label: 'Profiles', active: true });
    } else if (currentView === 'dashboard') {
      crumbs.push({ label: 'Dashboard', active: true });
    }

    return crumbs;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#161e2e] flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-[#ec7211] animate-spin" />
        <p className="text-xs font-mono text-[#aab7b8]">Loading AWS Management Console...</p>
      </div>
    );
  }

  // If not authenticated, show AWS Sign In page
  if (!user) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <LoginPage onSuccess={(loggedUser) => setUser(loggedUser)} showToast={addToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f3f3] text-[#16191f] selection:bg-[#ec7211] selection:text-white">
      {/* Top AWS Navbar */}
      <TopNavbar
        user={user}
        onLogout={handleLogout}
        currentRegion={currentRegion}
        onSelectRegion={setCurrentRegion}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onNavigate={(view) => {
          setActiveZone(null);
          setCurrentView(view);
          setMobileMenuOpen(false);
        }}
      />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Route 53 Sidebar (Desktop persistent + Mobile drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setActiveZone(null);
            setCurrentView(view);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          zoneCount={totalZonesCount}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40 lg:hidden animate-in fade-in duration-150"
            aria-hidden="true"
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6 flex flex-col min-w-0 w-full">
          {/* Breadcrumb Navigation */}
          <Breadcrumbs items={getBreadcrumbs()} />

          {/* Active View Router */}
          <div className="flex-1 mt-1">
            {currentView === 'hosted-zones' && (
              <HostedZonesList
                onSelectZone={handleSelectZone}
                showToast={addToast}
                onRefreshCount={fetchZoneCount}
              />
            )}

            {currentView === 'hosted-zone-detail' && activeZone && (
              <RecordsList
                zone={activeZone}
                onBack={handleBackToZones}
                showToast={addToast}
                onRefreshZone={async () => {
                  try {
                    const refreshed = await api.getHostedZone(activeZone.id);
                    setActiveZone(refreshed);
                    fetchZoneCount();
                  } catch {
                    // ignore
                  }
                }}
              />
            )}

            {(currentView === 'traffic-policies' ||
              currentView === 'health-checks' ||
              currentView === 'resolver' ||
              currentView === 'profiles' ||
              currentView === 'dashboard') && (
              <ComingSoonView
                featureId={currentView as any}
                onNavigateToHostedZones={handleBackToZones}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
