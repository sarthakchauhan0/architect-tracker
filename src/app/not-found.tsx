'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/clients/')) {
        const id = path.replace('/clients/', '').split('/')[0]?.split('?')[0];
        if (id && id !== '_') {
          window.location.replace(`/clients?id=${id}`);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] dark:bg-[#0e0e0d] p-6 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#a67d5d] border-t-transparent animate-spin mb-4" />
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#a67d5d] dark:text-[#c49a79] mb-2">
        Directing to Client Dossier...
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
        Please wait while we load the client details.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
      >
        Return to Studio Overview
      </Link>
    </div>
  );
}
