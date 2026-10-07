
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, History, Users, Database, Map as MapIcon, Settings, Link as LinkIcon, Menu, X } from 'lucide-react';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';
import { usePathname } from '../hooks/useLocation';

// The header's pages, in order; the desktop bar and the menu below xl both list them.
const NAV = [
  { view: 'dashboard', label: 'Live' },
  { view: 'fight-night', label: 'Fight Night' },
  { view: 'pilots', label: 'Leaderboards' },
  { view: 'maps', label: 'Maps' },
  { view: 'taunts', label: 'Taunts' },
  { view: 'pilot-manager', label: 'Settings' },
  { view: 'olmod', label: 'OLMod' },
  { view: 'resources', label: 'Resources' },
  { view: 'cold-storage', label: 'Archive' }
];

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  showColdStorage?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, showColdStorage }) => {
  const [activePilotCount, setActivePilotCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getCount = async () => {
      // Active Pilots count
      try {
        const res = await fetch('/api/stats/active-count');
        if (res.ok) {
          const data = await res.json();
          setActivePilotCount(data.count);
        }
      } catch (e) {
        console.error("Failed to fetch active pilots", e);
      }
    };
    getCount();
    const interval = setInterval(getCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close the menu on any page change: a link in it, the logo, or back and forward.
  const pathname = usePathname();
  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={urlFor('dashboard')} className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-brand rounded-control flex items-center justify-center transform rotate-45">
                  <div className="w-4 h-4 bg-black transform -rotate-45"></div>
                </div>
                <h1 className="text-2xl font-bold tracking-tighter text-brand brand-font lowercase" title="First rule of Overload Fight Club: tell everyone.">
                  overloadfight<span className="text-white">.club</span>
                </h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-6">
              <Link
                to={urlFor('pilots')}
                className="flex items-center gap-2 text-xs font-mono bg-surface-raised border border-line px-3 py-1 rounded-full cursor-pointer hover:border-brand hover:text-white transition-colors group"
              >
                <Users size={12} className="text-brand" />
                <span className="text-white font-bold group-hover:text-brand transition-colors">{activePilotCount}</span>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors">ACTIVE PILOTS</span>
              </Link>
              <nav aria-label="Main" className="flex space-x-4">
                {NAV.map(({ view, label }) => (
                  <Link
                    key={view}
                    to={urlFor(view)}
                    className={`${currentView === view ? 'text-brand' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-control text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5`}
                  >
                    {view === 'resources' && <LinkIcon className="w-3.5 h-3.5" />}
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile Menu Button */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                className="text-gray-300 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <nav id="mobile-menu" aria-label="Main" className="xl:hidden bg-surface-card border-b border-line">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAV.map(({ view, label }) => (
                <Link
                  key={view}
                  to={urlFor(view)}
                  className={`block w-full text-left px-3 py-2 rounded-control text-base font-medium ${currentView === view ? 'bg-gray-900 text-brand' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-surface-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} overloadfight.club. Community built. Not affiliated with Revival Productions.
          </p>
          <Link to={urlFor('admin')} className="text-xs text-gray-800 hover:text-gray-600 transition-colors">
            ADMIN
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
