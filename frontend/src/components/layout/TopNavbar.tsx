import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Terminal, 
  Globe, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  BookOpen,
  Layers,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { User } from '../../types/route53';

interface TopNavbarProps {
  user: User | null;
  onLogout: () => void;
  currentRegion?: string;
  onSelectRegion?: (region: string) => void;
  onNavigate: (view: string) => void;
  onToggleMobileMenu?: () => void;
}

const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', loc: 'us-east-1' },
  { id: 'us-east-2', name: 'US East (Ohio)', loc: 'us-east-2' },
  { id: 'us-west-1', name: 'US West (N. California)', loc: 'us-west-1' },
  { id: 'us-west-2', name: 'US West (Oregon)', loc: 'us-west-2' },
  { id: 'eu-west-1', name: 'Europe (Ireland)', loc: 'eu-west-1' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', loc: 'ap-northeast-1' },
  { id: 'global', name: 'Global (Route 53)', loc: 'global' },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  user,
  onLogout,
  currentRegion = 'Global (Route 53)',
  onSelectRegion,
  onNavigate,
  onToggleMobileMenu
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="h-10 bg-[#161e2e] text-[#f2f3f3] flex items-center justify-between px-2 sm:px-3 select-none text-xs border-b border-[#2a3444] sticky top-0 z-50">
      {/* Left: Mobile hamburger + AWS Logo & Service Header */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1 rounded text-[#aab7b8] hover:text-white hover:bg-[#232f3e] focus:outline-none transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <button 
          onClick={() => onNavigate('hosted-zones')}
          className="flex items-center space-x-1.5 text-white hover:text-[#ff9900] transition-colors focus:outline-none"
          title="AWS Management Console Home"
        >
          {/* AWS Orange / White Logo Badge */}
          <div className="flex items-center font-black tracking-tight text-sm">
            <span className="text-white text-base">AWS</span>
            <span className="text-[#ec7211] text-lg font-extrabold leading-none ml-0.5">.</span>
          </div>
        </button>

        <div className="h-4 w-px bg-[#414750] hidden sm:block"></div>

        <button 
          onClick={() => onNavigate('hosted-zones')}
          className="flex items-center space-x-1.5 font-semibold text-white hover:text-[#ff9900] transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-[#ec7211]" />
          <span className="hidden xs:inline">Route 53</span>
        </button>
      </div>

      {/* Middle: Global Search (Desktop & Tablet) */}
      <div className="hidden sm:block flex-1 max-w-xs md:max-w-md lg:max-w-xl mx-2 sm:mx-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#aab7b8]" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search console [Alt+S]"
            className="w-full bg-[#232f3e] hover:bg-[#2a3444] focus:bg-[#131a22] border border-[#414750] focus:border-[#ec7211] rounded text-[#f2f3f3] placeholder-[#879596] pl-8 pr-12 py-1 text-xs focus:outline-none transition-colors"
          />
          <kbd className="hidden lg:block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#879596] bg-[#161e2e] border border-[#414750] px-1 rounded">
            Alt+S
          </kbd>
        </div>
      </div>

      {/* Right: Tools, Region, User & Links */}
      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="sm:hidden p-1.5 rounded text-[#aab7b8] hover:text-white hover:bg-[#232f3e] transition-colors"
          title="Search"
        >
          {showMobileSearch ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
        </button>

        {/* API Docs Button */}
        <a 
          href="/docs" 
          className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded text-[#aab7b8] hover:text-white hover:bg-[#232f3e] transition-colors"
          title="Open REST API Interactive Documentation (Swagger UI)"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#ec7211]" />
          <span className="hidden md:inline font-mono text-[11px]">API /docs</span>
        </a>

        {/* CloudShell Icon Mock */}
        <button 
          className="hidden md:flex p-1.5 rounded text-[#aab7b8] hover:text-white hover:bg-[#232f3e] transition-colors"
          title="CloudShell"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button 
          className="hidden sm:flex p-1.5 rounded text-[#aab7b8] hover:text-white hover:bg-[#232f3e] transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 bg-[#ec7211] rounded-full absolute top-1 right-1"></span>
        </button>

        <div className="h-4 w-px bg-[#414750] hidden sm:block"></div>

        {/* Region Selector */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowRegionMenu(!showRegionMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded hover:bg-[#232f3e] text-[#f2f3f3] font-medium"
          >
            <Globe className="w-3.5 h-3.5 text-[#ec7211] shrink-0" />
            <span className="hidden lg:inline">{currentRegion}</span>
            <span className="hidden sm:inline lg:hidden">
              {currentRegion.includes('Global') ? 'Global' : 'us-east-1'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#aab7b8]" />
          </button>

          {showRegionMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-[#232f3e] border border-[#414750] shadow-xl rounded py-1 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold text-[#879596] border-b border-[#414750] uppercase text-[10px]">
                AWS Regions
              </div>
              {REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(reg.name);
                    setShowRegionMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#161e2e] transition-colors ${
                    currentRegion === reg.name ? 'text-[#ec7211] font-semibold' : 'text-[#f2f3f3]'
                  }`}
                >
                  <span>{reg.name}</span>
                  <span className="text-[#879596] font-mono text-[10px]">{reg.loc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRegionMenu(false);
            }}
            className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-[#232f3e] text-[#f2f3f3] font-medium"
          >
            <div className="w-4 h-4 rounded-full bg-[#ec7211] text-white flex items-center justify-center text-[10px] font-bold">
              A
            </div>
            <span className="hidden md:inline">{user?.name || 'Administrator'}</span>
            <span className="text-[#879596] hidden lg:inline">@ 1234-5678-9012</span>
            <ChevronDown className="w-3 h-3 text-[#aab7b8]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-[#232f3e] border border-[#414750] shadow-xl rounded py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#414750]">
                <p className="font-bold text-white">{user?.name || 'Administrator'}</p>
                <p className="text-[#aab7b8] text-[11px] truncate">{user?.email || 'admin@route53clone.com'}</p>
                <p className="text-[10px] text-[#879596] mt-0.5">Account ID: 1234-5678-9012</p>
              </div>

              <div className="py-1 border-b border-[#414750]">
                <a 
                  href="#profile" 
                  onClick={(e) => { e.preventDefault(); onNavigate('hosted-zones'); setShowUserMenu(false); }}
                  className="px-3 py-1.5 flex items-center space-x-2 text-[#f2f3f3] hover:bg-[#161e2e]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#aab7b8]" />
                  <span>Account &amp; Security</span>
                </a>
                <a 
                  href="#settings" 
                  onClick={(e) => { e.preventDefault(); setShowUserMenu(false); }}
                  className="px-3 py-1.5 flex items-center space-x-2 text-[#f2f3f3] hover:bg-[#161e2e]"
                >
                  <Settings className="w-3.5 h-3.5 text-[#aab7b8]" />
                  <span>Console settings</span>
                </a>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center space-x-2 text-[#ff6b6b] hover:bg-[#161e2e] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {showMobileSearch && (
        <div className="sm:hidden absolute top-10 left-0 right-0 bg-[#161e2e] p-2 border-b border-[#2a3444] shadow-md z-40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#aab7b8]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search console..."
              className="w-full bg-[#232f3e] border border-[#414750] rounded text-[#f2f3f3] pl-8 pr-3 py-1.5 text-xs outline-none"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};
