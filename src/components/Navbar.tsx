'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Users, Settings, Plus, LogOut, Wifi, WifiOff } from 'lucide-react';
import { logoutUser } from '@/lib/firebase';

interface NavbarProps {
  onOpenNewClient?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewClient }) => {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

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
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-100 tracking-tight block">
                  ARCHITECT TRACKER
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-0.5">
                  Studio Workspace
                </span>
              </div>
            </Link>

            {/* Offline / Online Sync Indicator */}
            <div
              title={isOnline ? 'Online - Cloud Sync Active' : 'Offline Mode - Changes Cached Locally'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Cloud Synced' : 'Offline Cache Active'}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                pathname === '/'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Projects
            </Link>

            {onOpenNewClient && (
              <button
                onClick={onOpenNewClient}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Client
              </button>
            )}

            <Link
              href="/settings"
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Studio Settings & Data Backup"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (One-Thumb site navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 py-2 px-6 flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            pathname === '/' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Clients</span>
        </Link>

        {onOpenNewClient && (
          <button
            onClick={onOpenNewClient}
            className="flex flex-col items-center gap-1 text-[11px] font-medium text-amber-500"
          >
            <div className="w-10 h-10 -mt-5 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-950/60">
              <Plus className="w-5 h-5" />
            </div>
            <span className="-mt-1">Add</span>
          </button>
        )}

        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            pathname === '/settings' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </>
  );
};
