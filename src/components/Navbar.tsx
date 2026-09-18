'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, Plus, LogOut, WifiOff, Sun, Moon } from 'lucide-react';
import { logoutUser } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  onOpenNewClient?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewClient }) => {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#141413]/90 backdrop-blur-md border-b border-[#e5e3dc] dark:border-[#292825] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#141414] dark:text-[#f4f3ef]">
                  RSA
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#a67d5d] dark:text-[#c49a79] leading-none">
                  .
                </span>
              </div>
              <div className="hidden sm:block border-l border-stone-300 dark:border-stone-700 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#141414] dark:text-[#f4f3ef] block leading-tight">
                  Rahul Sharma Architects
                </span>
                <span className="text-[9px] uppercase font-semibold tracking-[0.2em] text-stone-500 dark:text-stone-400 block leading-tight mt-0.5">
                  Studio Workspace & Tracker
                </span>
              </div>
            </Link>

            {/* Offline / Online Sync Indicator */}
            <div
              title={isOnline ? 'Online - Cloud Sync Active' : 'Offline Mode - Changes Cached Locally'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              }`}
            >
              {isOnline ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              )}
              <span className="hidden xs:inline">
                {isOnline ? 'Cloud Synced' : 'Offline Cache'}
              </span>
            </div>
          </div>

          {/* Right Actions (Desktop & Mobile Theme Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:text-[#141414] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d] border border-stone-200 dark:border-[#2f2e2b] transition-all flex items-center gap-1.5"
              title={theme === 'dark' ? 'Switch to White (Light) Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-[#c49a79]" />
                  <span className="text-[11px] font-semibold hidden lg:inline text-stone-300">White</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-stone-600" />
                  <span className="text-[11px] font-semibold hidden lg:inline text-stone-600">Dark</span>
                </>
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.12em] transition-colors flex items-center gap-2 ${
                  pathname === '/'
                    ? 'bg-stone-100 dark:bg-[#20201d] text-[#141414] dark:text-[#f4f3ef] border border-stone-200 dark:border-[#2f2e2b]'
                    : 'text-stone-600 dark:text-stone-400 hover:text-[#141414] dark:hover:text-white hover:bg-stone-50 dark:hover:bg-[#1a1a18]'
                }`}
              >
                <Users className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                Projects
              </Link>

              {onOpenNewClient && (
                <button
                  onClick={onOpenNewClient}
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-[#a67d5d]/20 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  New Client
                </button>
              )}

              <Link
                href="/settings"
                className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                  pathname === '/settings'
                    ? 'bg-stone-100 dark:bg-[#20201d] text-[#141414] dark:text-[#f4f3ef] border-stone-300 dark:border-[#3a3935]'
                    : 'text-stone-500 dark:text-stone-400 hover:text-[#141414] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d] border-transparent'
                }`}
                title="Studio Settings & Data Backup"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (One-Thumb site navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141413]/95 backdrop-blur-lg border-t border-[#e5e3dc] dark:border-[#292825] py-2 px-6 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            pathname === '/' ? 'text-[#a67d5d] dark:text-[#c49a79]' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Projects</span>
        </Link>

        {onOpenNewClient && (
          <button
            onClick={onOpenNewClient}
            className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#a67d5d] dark:text-[#c49a79]"
          >
            <div className="w-11 h-11 -mt-5 bg-[#a67d5d] hover:bg-[#8f6747] rounded-full flex items-center justify-center text-white shadow-md shadow-[#a67d5d]/40">
              <Plus className="w-5 h-5" />
            </div>
            <span className="-mt-0.5">New Client</span>
          </button>
        )}

        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            pathname === '/settings' ? 'text-[#a67d5d] dark:text-[#c49a79]' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </>
  );
};
