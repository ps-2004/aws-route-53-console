import React from 'react';
import { 
  Globe, 
  GitBranch, 
  Activity, 
  ShieldCheck, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Database,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  zoneCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  zoneCount = 0,
  mobileOpen = false,
  onMobileClose,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layers,
      isPlaceholder: false,
    },
    {
      id: 'hosted-zones',
      label: 'Hosted zones',
      icon: Globe,
      badge: zoneCount > 0 ? zoneCount.toString() : undefined,
      isPlaceholder: false,
    },
    {
      id: 'traffic-policies',
      label: 'Traffic policies',
      icon: GitBranch,
      isPlaceholder: true,
    },
    {
      id: 'health-checks',
      label: 'Health checks',
      icon: Activity,
      isPlaceholder: true,
    },
    {
      id: 'resolver',
      label: 'Resolver',
      icon: ShieldCheck,
      isPlaceholder: true,
    },
    {
      id: 'profiles',
      label: 'Profiles',
      icon: Sliders,
      isPlaceholder: true,
    },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const renderNavContent = (isMobileDrawer = false) => (
    <>
      {/* Route 53 Header */}
      <div className="h-12 border-b border-[#eaeded] flex items-center justify-between px-3.5 bg-white">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-6 h-6 rounded bg-[#ec7211]/10 text-[#ec7211] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[#ec7211]" />
          </div>
          {(!collapsed || isMobileDrawer) && (
            <span className="font-bold text-sm text-[#16191f] tracking-tight truncate">
              Route 53
            </span>
          )}
        </div>

        {isMobileDrawer ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className={`p-1 rounded text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] transition-colors ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2 bg-white">
        {(!collapsed || isMobileDrawer) && (
          <div className="px-2 pb-1.5 text-[10px] font-bold text-[#687078] uppercase tracking-wider">
            DNS Management
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'hosted-zones' && currentView.startsWith('hosted-zone'));

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center px-2.5 py-2.5 sm:py-2 text-xs rounded transition-colors group relative ${
                isActive
                  ? 'bg-[#ebf3fc] text-[#0073bb] font-semibold'
                  : 'text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3]'
              }`}
              title={collapsed && !isMobileDrawer ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#0073bb] rounded-r"></div>
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#0073bb]' : 'text-[#687078] group-hover:text-[#16191f]'
                } ${collapsed && !isMobileDrawer ? 'mx-auto' : 'mr-3'}`}
              />
              {(!collapsed || isMobileDrawer) && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 text-[10px] bg-[#0073bb]/10 text-[#0073bb] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.isPlaceholder && (
                    <span className="ml-2 text-[9px] text-[#879596] bg-[#f2f3f3] px-1 py-0.5 rounded border border-[#eaeded]">
                      Beta
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {(!collapsed || isMobileDrawer) && (
          <>
            <div className="pt-4 px-2 pb-1 text-[10px] font-bold text-[#687078] uppercase tracking-wider">
              Domains &amp; Storage
            </div>
            <div className="px-2.5 py-2 text-xs text-[#aab7b8] flex items-center space-x-3 cursor-not-allowed">
              <Database className="w-4 h-4 text-[#aab7b8]" />
              <span>Registered domains</span>
            </div>
          </>
        )}
      </nav>

      {/* Footer Info */}
      {(!collapsed || isMobileDrawer) && (
        <div className="p-3 border-t border-[#eaeded] bg-[#fafafa] text-[11px] text-[#687078]">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span>Storage: SQLite</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Persisted
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#879596]">AWS Route 53 Console Experience</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden lg:flex bg-white border-r border-[#eaeded] flex-col transition-all duration-200 select-none z-30 shrink-0 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (When Open) */}
      {mobileOpen && (
        <aside 
          className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-[#eaeded] shadow-2xl flex flex-col select-none animate-in slide-in-from-left duration-200"
        >
          {renderNavContent(true)}
        </aside>
      )}
    </>
  );
};
