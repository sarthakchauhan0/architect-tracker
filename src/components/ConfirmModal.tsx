'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden transition-colors">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isDestructive ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' : 'bg-[#f5efe9] dark:bg-[#28211b] text-[#a67d5d] dark:text-[#d1a684] border border-[#a67d5d]/30 dark:border-[#a67d5d]/40'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">{title}</h3>
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-[#252522] hover:bg-stone-200 dark:hover:bg-[#2e2d2a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-sm ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
