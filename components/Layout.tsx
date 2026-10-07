
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, History, Users, Database, Map as MapIcon, Settings, Link as LinkIcon, Menu, X } from 'lucide-react';
import Link from './Link';
import { urlFor } from '../server/lib/siteRoutes.js';

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

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={urlFor('dashboard')} onClick={closeMenu} className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#ff6600] rounded-sm flex items-center justify-center transform rotate-45">
                  <div className="w-4 h-4 bg-black transform -rotate-45"></div>
                </div>
                <h1 className="text-2xl font-bold tracking-tighter text-[#ff6600] brand-font lowercase" title="First rule of Overload Fight Club: tell everyone.">
                  overloadfight<span className="text-white">.club</span>
                </h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-6">
              <Link
                to={urlFor('pilots')}
                className="flex items-center gap-2 text-xs font-mono bg-[#1a1a1a] border border-gray-800 px-3 py-1 rounded-full cursor-pointer hover:border-[#ff6600] hover:text-white transition-colors group"
              >
                <Users size={12} className="text-[#ff6600]" />
                <span className="text-white font-bold group-hover:text-[#ff6600] transition-colors">{activePilotCount}</span>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors">ACTIVE PILOTS</span>
              </Link>
              <nav className="flex space-x-4">
                <Link
                  to={urlFor('dashboard')}
                  onClick={closeMenu}
                  className={`${currentView === 'dashboard' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Live
                </Link>
                <Link
                  to={urlFor('fight-night')}
                  onClick={closeMenu}
                  className={`${currentView === 'fight-night' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap`}
                >
                  Fight Night
                </Link>
                <Link
                  to={urlFor('pilots')}
                  onClick={closeMenu}
                  className={`${currentView === 'pilots' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Leaderboards
                </Link>
                <Link
                  to={urlFor('maps')}
                  onClick={closeMenu}
                  className={`${currentView === 'maps' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Maps
                </Link>
                <Link
                  to={urlFor('taunts')}
                  onClick={closeMenu}
                  className={`${currentView === 'taunts' || currentView === 'tools' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Taunts
                </Link>
                <Link
                  to={urlFor('pilot-manager')}
                  onClick={closeMenu}
                  className={`${currentView === 'pilot-manager' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Pilot
                </Link>
                <Link
                  to={urlFor('olmod')}
                  onClick={closeMenu}
                  className={`${currentView === 'olmod' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  OLMod
                </Link>
                <Link
                  to={urlFor('resources')}
                  onClick={closeMenu}
                  className={`${currentView === 'resources' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Resources
                </Link>
                <Link
                  to={urlFor('cold-storage')}
                  onClick={closeMenu}
                  className={`${currentView === 'cold-storage' ? 'text-[#ff6600]' : 'text-gray-300 hover:text-white'} px-2 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  Archive
                </Link>
              </nav>
            </div>

            {/* Mobile Menu Button */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#111] border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to={urlFor('dashboard')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'dashboard' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Live
              </Link>
              <Link
                to={urlFor('fight-night')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'fight-night' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Fight Night
              </Link>
              <Link
                to={urlFor('pilots')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'pilots' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Leaderboards
              </Link>
              <Link
                to={urlFor('maps')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'maps' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Maps
              </Link>
              <Link
                to={urlFor('taunts')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'taunts' || currentView === 'tools' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Taunts
              </Link>
              <Link
                to={urlFor('pilot-manager')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'pilot-manager' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Pilot
              </Link>
              <Link
                to={urlFor('olmod')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'olmod' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                OLMod
              </Link>
              <Link
                to={urlFor('resources')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'resources' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Resources
              </Link>
              <Link
                to={urlFor('cold-storage')}
                onClick={closeMenu}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentView === 'cold-storage' ? 'bg-gray-900 text-[#ff6600]' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                Archive
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
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
