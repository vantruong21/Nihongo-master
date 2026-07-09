import React, { useState, useEffect } from 'react';

const Navbar = ({ user, onImportClick, onLibraryClick, onStatsClick, onKanjiExplorerClick, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className={`fixed top-0 w-full h-16 glass-nav z-50 transition-all duration-400 ${scrolled ? 'glass-nav--scrolled' : 'border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-16">
        {/* Logo */}
        <a href="/" className="group cursor-pointer no-underline flex-shrink-0">
          <span className="text-lg md:text-2xl font-bold tracking-tight text-zen-black group-hover:scale-105 inline-block transition-transform duration-300">
            日本語
          </span>
        </a>

        {/* Navigation */}
        <div className="flex items-center space-x-3 sm:space-x-6 md:space-x-10 text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em]">
          {isAdmin && (
            <button
              onClick={onImportClick}
              className="glass-link text-zen-black/60 hover:text-zen-black transition-colors duration-300 cursor-pointer font-semibold"
            >
              Import
            </button>
          )}
          <button 
            onClick={onLibraryClick} 
            className="glass-link text-zen-black/60 hover:text-zen-black transition-colors duration-300 cursor-pointer font-semibold"
          >
            Repository
          </button>
          <button 
            onClick={onStatsClick} 
            className="glass-link text-zen-black/60 hover:text-zen-black transition-colors duration-300 cursor-pointer font-semibold"
          >
            Metrics
          </button>
          <button
            onClick={onKanjiExplorerClick}
            className="glass-link text-zen-black/60 hover:text-zen-black transition-colors duration-300 cursor-pointer font-semibold"
          >
            🔍 Kanji Explorer
          </button>

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              className="flex items-center space-x-2 group cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 hover:scale-110 shadow-sm ${
                isAdmin ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-500 to-indigo-500'
              }`}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div 
                className="absolute right-0 top-12 w-56 glass-panel p-4 shadow-2xl animate-scale-in z-50" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pb-3 mb-2 border-b border-black/10">
                  <p className="text-sm font-semibold text-zen-black leading-none">{user?.username}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] font-bold rounded ${
                    isAdmin ? 'bg-amber-100/60 text-amber-800' : 'bg-slate-100/60 text-slate-800'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zen-black/60 hover:text-red-600 hover:bg-red-50/40 rounded-xl transition-all font-semibold cursor-pointer"
                >
                  ↗ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
