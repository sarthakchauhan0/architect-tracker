'use client';

import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, logoutUser } from '@/lib/firebase';
import { ArchitectSettings } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AuthGate } from '@/components/AuthGate';
import { downloadJsonBackup, downloadClientsCsv } from '@/lib/exportBackup';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings,
  Save,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileSpreadsheet,
  Download,
  LogOut,
  CheckCircle2,
  Receipt,
  Database,
  Sun,
  Moon,
} from 'lucide-react';

function SettingsContent() {
  const [settings, setSettings] = useState<ArchitectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  // Form states
  const [architectName, setArchitectName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(101);

  // Backup loading states
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const s = await getSettings();
        setSettings(s);
        setArchitectName(s.architectName || '');
        setFirmName(s.firmName || '');
        setEmail(s.email || '');
        setPhone(s.phone || '');
        setAddress(s.address || '');
        setBankName(s.bankDetails?.bankName || '');
        setAccountNumber(s.bankDetails?.accountNumber || '');
        setIfsc(s.bankDetails?.ifsc || '');
        setUpiId(s.bankDetails?.upiId || '');
        setCurrencySymbol(s.currencySymbol || '₹');
        setInvoicePrefix(s.invoicePrefix || 'INV-');
        setNextInvoiceNumber(s.nextInvoiceNumber || 101);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await saveSettings({
        architectName,
        firmName,
        email,
        phone,
        address,
        bankDetails: {
          bankName,
          accountNumber,
          ifsc,
          upiId,
        },
        currencySymbol,
        invoicePrefix,
        nextInvoiceNumber: Number(nextInvoiceNumber) || 101,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = async () => {
    setIsExportingJson(true);
    try {
      await downloadJsonBackup();
    } catch (err) {
      console.error('Export JSON failed:', err);
      alert('Export failed. Please check your network connection.');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      await downloadClientsCsv();
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Export failed. Please check your network connection.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
        <div className="w-8 h-8 border-2 border-[#a67d5d] dark:border-[#c49a79] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] font-semibold">Loading studio settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] text-[#141414] dark:text-[#f4f3ef] flex flex-col pb-24 md:pb-8 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="pb-2 border-b border-[#e5e3dc] dark:border-[#292825]">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#a67d5d] dark:text-[#c49a79] block mb-1">
            Studio Configuration & System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414] dark:text-[#f4f3ef] flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#a67d5d] dark:text-[#c49a79]" />
            Studio Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Configure theme aesthetics, architectural letterhead, invoice numbering, and offline backups.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Settings updated successfully! These details will reflect on your invoices and progress reports.</span>
          </div>
        )}

        {/* Section 1: Theme & Display Appearance */}
        <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#292825]">
            <div className="p-2 rounded-lg bg-[#f5efe9] dark:bg-[#25201c] text-[#a67d5d] dark:text-[#c49a79]">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                Theme Appearance
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Switch between architectural white and low-glare dark studio aesthetic.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Architectural White Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-5 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                theme === 'light'
                  ? 'border-[#a67d5d] bg-[#faf9f6] shadow-sm ring-1 ring-[#a67d5d]'
                  : 'border-stone-200 dark:border-[#2f2e2b] bg-stone-50/50 dark:bg-[#1e1e1c] hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-[#a67d5d]" />
                  <span className="text-sm font-bold text-[#141414] dark:text-[#f4f3ef]">Architectural White</span>
                </div>
                {theme === 'light' && (
                  <CheckCircle2 className="w-4 h-4 text-[#a67d5d]" />
                )}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Light, editorial aesthetic matching rahulsharmaarchitects.com with warm stone tones, hairline wireframe dividers, and terracotta accents.
              </p>
            </button>

            {/* Studio Obsidian (Dark) Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-5 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                theme === 'dark'
                  ? 'border-[#c49a79] bg-[#141413] shadow-sm ring-1 ring-[#c49a79]'
                  : 'border-stone-200 dark:border-[#2f2e2b] bg-stone-50/50 dark:bg-[#1e1e1c] hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-[#c49a79]" />
                  <span className="text-sm font-bold text-[#141414] dark:text-[#f4f3ef]">Studio Obsidian (Dark)</span>
                </div>
                {theme === 'dark' && (
                  <CheckCircle2 className="w-4 h-4 text-[#c49a79]" />
                )}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Refined dark studio aesthetic for low-light drafting, outdoor high-glare environments, and comfortable evening workflows.
              </p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 2: Architect & Firm Profile */}
          <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#292825]">
              <Building className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                Architect & Firm Profile (Invoice Letterhead)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  Architect Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={architectName}
                  onChange={(e) => setArchitectName(e.target.value)}
                  placeholder="e.g. Ar. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  Studio / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. Rahul Sharma Architects"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  Studio Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="connect@rahulsharmaarchitects.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 8130950761"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                Office / Studio Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="B-1, Janak Puri, New Delhi, 110059"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>
          </div>

          {/* Section 3: Bank Transfer Details for Invoices */}
          <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#292825]">
              <CreditCard className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                Bank & Payment Instructions (Printed on Invoices)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50200012345678"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. rahulsharma@okhdfcbank"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Invoicing Numbering & Currency */}
          <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#292825]">
              <Receipt className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                Invoice Sequence & Currency
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="₹"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Next Invoice #
                </label>
                <input
                  type="number"
                  min="1"
                  value={nextInvoiceNumber}
                  onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a] disabled:opacity-50 text-white font-bold uppercase tracking-[0.15em] rounded-lg text-xs transition-colors shadow-sm shadow-[#a67d5d]/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Profile...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Section 5: Resilience & Manual Data Backup (JSON / CSV) */}
        <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#292825]">
            <Database className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
            <div>
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                Data Backup & Offline Export
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Export all client commissions, visit logs, payments, expenses, and punch list issues for offline records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-[#fcfbf9] dark:bg-[#1f1f1d] border border-stone-200 dark:border-[#2e2d2a] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a67d5d] dark:text-[#c49a79] block mb-1">
                  Complete Database Dump
                </span>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Downloads an all-in-one structured JSON archive containing every client along with all visits, payments, expenses, and issues.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={isExportingJson}
                className="mt-4 px-4 py-2.5 bg-white dark:bg-[#252522] hover:bg-stone-50 dark:hover:bg-[#2c2c28] active:bg-stone-100 disabled:opacity-50 text-stone-800 dark:text-stone-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 border border-stone-300 dark:border-[#33322f] shadow-xs"
              >
                <Download className="w-4 h-4 text-[#a67d5d] dark:text-[#c49a79]" />
                {isExportingJson ? 'Preparing JSON...' : 'Export Complete Backup (JSON)'}
              </button>
            </div>

            <div className="p-5 rounded-xl bg-[#fcfbf9] dark:bg-[#1f1f1d] border border-stone-200 dark:border-[#2e2d2a] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Spreadsheet Ledger
                </span>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Downloads a CSV spreadsheet of all clients, planned vs completed visits, fee, total paid, and balance due.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExportingCsv}
                className="mt-4 px-4 py-2.5 bg-white dark:bg-[#252522] hover:bg-stone-50 dark:hover:bg-[#2c2c28] active:bg-stone-100 disabled:opacity-50 text-stone-800 dark:text-stone-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 border border-stone-300 dark:border-[#33322f] shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                {isExportingCsv ? 'Preparing CSV...' : 'Export Clients Ledger (CSV)'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 6: Security & Session */}
        <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 flex items-center justify-between shadow-xs transition-colors">
          <div>
            <h3 className="text-sm font-bold text-[#141414] dark:text-[#f4f3ef]">Session Security</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Sign out of your single-user architect session on this device.
            </p>
          </div>
          <button
            onClick={() => logoutUser()}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}
