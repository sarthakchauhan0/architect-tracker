'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  getClientById,
  saveClient,
  deleteClient,
  getVisits,
  saveVisit,
  deleteVisit,
  getPayments,
  savePayment,
  deletePayment,
  getExpenses,
  saveExpense,
  deleteExpense,
  getIssues,
  saveIssue,
  deleteIssue,
  getSettings,
  incrementInvoiceNumber,
} from '@/lib/firebase';
import {
  Client,
  Visit,
  Payment,
  Expense,
  Issue,
  ArchitectSettings,
  ProjectStatus,
  PaymentType,
  PaymentMode,
  IssueStatus,
} from '@/types';
import { Navbar } from '@/components/Navbar';
import { AuthGate } from '@/components/AuthGate';
import { ClientModal } from '@/components/ClientModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { generateProgressUpdatePdf } from '@/lib/pdf/progressPdf';
import { generateInvoicePdf } from '@/lib/pdf/invoicePdf';
import { formatCurrency, formatDate, triggerConfetti } from '@/lib/formatters';
import {
  ArrowLeft,
  Building,
  Calendar,
  IndianRupee,
  Footprints,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  FileDown,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Briefcase,
  Layers,
  FileSpreadsheet,
  X,
} from 'lucide-react';

function ClientDetailInner() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();

  // Robust client ID resolution across static export routes and query parameters:
  const queryId = searchParams.get('id');
  const paramId = (routeParams?.id as string);
  const pathId = typeof window !== 'undefined'
    ? window.location.pathname.replace(/^\/clients\/?/, '').split('/')[0]?.split('?')[0]
    : '';

  const clientId = queryId || (paramId && paramId !== '_' ? paramId : '') || (pathId && pathId !== '_' && pathId !== 'clients' ? pathId : '');

  const [client, setClient] = useState<Client | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [settings, setSettings] = useState<ArchitectSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'visits' | 'payments' | 'expenses' | 'issues'
  const [activeTab, setActiveTab] = useState<'visits' | 'payments' | 'expenses' | 'issues'>('visits');

  // Modals
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);

  // Subcollection Add Modals
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);

  // Subcollection Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'client' | 'visit' | 'payment' | 'expense' | 'issue';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'visit',
    id: '',
    title: '',
    message: '',
  });

  // Form states for adding items
  const [visitDate, setVisitDate] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('Site Inspection & Layout Check');
  const [visitNotes, setVisitNotes] = useState('');

  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('Milestone');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank Transfer');
  const [paymentNote, setPaymentNote] = useState('');

  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseBillable, setExpenseBillable] = useState(true);

  const [issueDate, setIssueDate] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueStatus, setIssueStatus] = useState<IssueStatus>('Open');
  const [issueResolution, setIssueResolution] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [c, v, p, e, iss, s] = await Promise.all([
        getClientById(clientId),
        getVisits(clientId),
        getPayments(clientId),
        getExpenses(clientId),
        getIssues(clientId),
        getSettings(),
      ]);

      if (!c) {
        alert('Client not found');
        router.push('/');
        return;
      }

      setClient(c);
      setVisits(v);
      setPayments(p);
      setExpenses(e);
      setIssues(iss);
      setSettings(s);
    } catch (err) {
      console.error('Error loading client details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const today = new Date().toISOString().split('T')[0];
    setVisitDate(today);
    setPaymentDate(today);
    setExpenseDate(today);
    setIssueDate(today);
  }, [clientId]);

  // Calculations
  const currencySymbol = settings?.currencySymbol || '₹';
  const totalAgreedFee = Number(client?.totalProjectAmount) || 0;
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const billableExpenses = expenses.filter((e) => e.billableToClient);
  const totalBillableExpenses = billableExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const balanceRemaining = totalAgreedFee - totalPaid;
  const visitsDone = visits.length;
  const visitsPlanned = client?.totalVisitsPlanned || 1;
  const visitPercentage = Math.min(100, Math.round((visitsDone / visitsPlanned) * 100));

  // Quick inline status change
  const handleQuickStatusChange = async (newStatus: ProjectStatus) => {
    if (!client) return;
    try {
      await saveClient({ ...client, status: newStatus }, client.id);
      setClient({ ...client, status: newStatus });
      if (newStatus === 'Completed') {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Quick inline estimated completion date change
  const handleQuickDateChange = async (newDate: string) => {
    if (!client || !newDate) return;
    try {
      await saveClient({ ...client, estimatedCompletionDate: newDate }, client.id);
      setClient({ ...client, estimatedCompletionDate: newDate });
    } catch (err) {
      console.error('Date update failed:', err);
    }
  };

  // Subcollection submit handlers
  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      await saveVisit(client.id, {
        date: visitDate,
        purpose: visitPurpose,
        notes: visitNotes,
      });
      setIsAddVisitOpen(false);
      setVisitNotes('');
      await loadAll();
    } catch (err) {
      console.error('Failed to add visit:', err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      await savePayment(client.id, {
        date: paymentDate,
        amount: Number(paymentAmount),
        type: paymentType,
        mode: paymentMode,
        note: paymentNote,
      });
      setIsAddPaymentOpen(false);
      setPaymentAmount(0);
      setPaymentNote('');
      await loadAll();

      // Check if project is now fully paid
      if (totalPaid + Number(paymentAmount) >= totalAgreedFee) {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Failed to add payment:', err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      await saveExpense(client.id, {
        date: expenseDate,
        description: expenseDescription,
        amount: Number(expenseAmount),
        billableToClient: expenseBillable,
      });
      setIsAddExpenseOpen(false);
      setExpenseDescription('');
      setExpenseAmount(0);
      await loadAll();
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      await saveIssue(client.id, {
        date: issueDate,
        description: issueDescription,
        status: issueStatus,
        resolutionNote: issueResolution,
      });
      setIsAddIssueOpen(false);
      setIssueDescription('');
      setIssueResolution('');
      await loadAll();
    } catch (err) {
      console.error('Failed to add issue:', err);
    }
  };

  const handleToggleIssueStatus = async (issue: Issue) => {
    if (!client) return;
    const newStatus: IssueStatus = issue.status === 'Open' ? 'Resolved' : 'Open';
    try {
      await saveIssue(client.id, {
        ...issue,
        status: newStatus,
        resolutionNote: newStatus === 'Resolved' ? (issue.resolutionNote || 'Marked as resolved on-site') : issue.resolutionNote,
      }, issue.id);
      await loadAll();
    } catch (err) {
      console.error('Failed to toggle issue:', err);
    }
  };

  // Delete dispatcher
  const executeDelete = async () => {
    if (!client) return;
    const { type, id } = confirmDelete;
    try {
      if (type === 'client') {
        await deleteClient(client.id);
        router.push('/');
        return;
      } else if (type === 'visit') {
        await deleteVisit(client.id, id);
      } else if (type === 'payment') {
        await deletePayment(client.id, id);
      } else if (type === 'expense') {
        await deleteExpense(client.id, id);
      } else if (type === 'issue') {
        await deleteIssue(client.id, id);
      }
      setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
      await loadAll();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete operation failed. Please try again.');
    }
  };

  // PDF Generators
  const handleExportProgressPdf = () => {
    if (!client || !settings) return;
    generateProgressUpdatePdf(client, visits, issues, settings, true);
  };

  const handleExportInvoicePdf = async () => {
    if (!client || !settings) return;
    const currentNum = settings.nextInvoiceNumber || 101;
    const prefix = settings.invoicePrefix || 'INV-';
    const invoiceNumber = `${prefix}${currentNum}`;

    generateInvoicePdf(client, payments, expenses, settings, invoiceNumber);

    // Auto-increment next invoice number for architect convenience
    try {
      await incrementInvoiceNumber(currentNum);
      const updatedSettings = await getSettings();
      setSettings(updatedSettings);
    } catch (err) {
      console.warn('Could not auto-increment invoice number:', err);
    }
  };  if (loading || !client) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] flex flex-col items-center justify-center text-stone-500 dark:text-stone-400">
        <div className="w-8 h-8 border-2 border-[#a67d5d] dark:border-[#c49a79] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] font-semibold">Loading client file...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] text-[#141414] dark:text-[#f4f3ef] flex flex-col pb-24 md:pb-8 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back link & Actions toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-[#141414] dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#a67d5d] dark:text-[#c49a79]" />
            Back to Projects
          </Link>

          {/* Top PDF & Management Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportProgressPdf}
              className="px-3.5 py-2 bg-white dark:bg-[#181817] hover:bg-stone-100 dark:hover:bg-[#222220] text-stone-800 dark:text-stone-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-stone-300 dark:border-[#2f2e2b] flex items-center gap-2 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              Progress PDF
            </button>

            <button
              onClick={handleExportInvoicePdf}
              className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-[#a67d5d]/20"
            >
              <Receipt className="w-4 h-4" />
              Generate Invoice PDF
            </button>

            <button
              onClick={() => setIsEditClientModalOpen(true)}
              className="p-2 text-stone-500 dark:text-stone-400 hover:text-[#141414] dark:hover:text-white hover:bg-stone-200 dark:hover:bg-[#252522] bg-stone-100 dark:bg-[#1e1e1c] rounded-lg transition-colors border border-stone-200 dark:border-[#2f2e2b]"
              title="Edit Client"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setConfirmDelete({
                  isOpen: true,
                  type: 'client',
                  id: client.id,
                  title: 'Delete Client & Complete Project?',
                  message: `Are you sure you want to permanently delete "${client.projectName}" and all related visits, payments, expenses, and issues?`,
                });
              }}
              className="p-2 text-stone-400 dark:text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-stone-100 dark:bg-[#1e1e1c] rounded-lg transition-colors border border-stone-200 dark:border-[#2f2e2b]"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client Header Card */}
        <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl p-6 sm:p-8 shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    client.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : client.status === 'On Hold'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-[#f5efe9] text-[#8c6546] border border-[#a67d5d]/30'
                  }`}
                >
                  {client.status}
                </span>
                <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  {client.projectType}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#141414] dark:text-[#f4f3ef] tracking-tight">
                {client.projectName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400 pt-1">
                <span className="font-semibold text-stone-800 dark:text-stone-200">{client.name}</span>
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    {client.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {client.address}
                </span>
              </div>
            </div>

            {/* Inline Quick Controls: Status & Target Finish */}
            <div className="flex flex-wrap items-center gap-3 bg-[#fcfbf9] dark:bg-[#1e1e1c] p-3 rounded-xl border border-stone-200 dark:border-[#2f2e2b] self-start lg:self-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider mb-1">
                  Quick Status
                </label>
                <select
                  value={client.status}
                  onChange={(e) => handleQuickStatusChange(e.target.value as ProjectStatus)}
                  className="bg-white dark:bg-[#181817] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-xs font-semibold px-2.5 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#a67d5d]"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="border-l border-stone-200 dark:border-[#2f2e2b] pl-3">
                <label className="block text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider mb-1">
                  Target Completion
                </label>
                <input
                  type="date"
                  value={client.estimatedCompletionDate || ''}
                  onChange={(e) => handleQuickDateChange(e.target.value)}
                  className="bg-white dark:bg-[#181817] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-xs font-semibold px-2.5 py-1 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#a67d5d]"
                />
              </div>
            </div>
          </div>

          {/* Two Core Metric Cards: Visits Progress vs Financial Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {/* Visits Box */}
            <div className="bg-[#fcfbf9] dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-[#a67d5d] dark:text-[#c49a79]" />
                  Site Inspection Visits
                </span>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  {visitsDone} of {client.totalVisitsPlanned} completed ({visitPercentage}%)
                </span>
              </div>

              <div className="w-full bg-stone-200 dark:bg-[#2a2a26] rounded-full h-2 mt-3 overflow-hidden border border-stone-300/60 dark:border-stone-700/60">
                <div
                  className="bg-[#a67d5d] dark:bg-[#c49a79] h-full rounded-full transition-all duration-300"
                  style={{ width: `${visitPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mt-3 pt-3 border-t border-stone-200 dark:border-[#2f2e2b]">
                <span>Start: {formatDate(client.startDate)}</span>
                <span>Target: {formatDate(client.estimatedCompletionDate)}</span>
              </div>
            </div>

            {/* Financial Box */}
            <div className="bg-[#fcfbf9] dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-[#a67d5d] dark:text-[#c49a79]" />
                  Fee Ledger & Balance
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                    balanceRemaining <= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-[#f5efe9] dark:bg-[#28211b] text-[#8c6546] dark:text-[#d1a684] border border-[#a67d5d]/30 dark:border-[#a67d5d]/40'
                  }`}
                >
                  {balanceRemaining <= 0 ? 'Fully Paid' : 'Balance Outstanding'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">
                    Agreed Fee
                  </span>
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {formatCurrency(totalAgreedFee, currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">
                    Total Paid
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalPaid, currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">
                    Balance Due
                  </span>
                  <span
                    className={`text-base font-black ${
                      balanceRemaining <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#a67d5d] dark:text-[#c49a79]'
                    }`}
                  >
                    {formatCurrency(balanceRemaining, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subcollections Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[#e5e3dc] dark:border-[#292825] pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('visits')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'visits'
                  ? 'bg-[#141414] dark:bg-[#f4f3ef] text-white dark:text-[#141414] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d]'
              }`}
            >
              <Footprints className="w-4 h-4" />
              Site Visits ({visits.length})
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'bg-[#141414] dark:bg-[#f4f3ef] text-white dark:text-[#141414] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payments ({payments.length})
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-[#141414] dark:bg-[#f4f3ef] text-white dark:text-[#141414] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Expenses ({expenses.length})
            </button>

            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'issues'
                  ? 'bg-[#141414] dark:bg-[#f4f3ef] text-white dark:text-[#141414] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#20201d]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Punch List ({issues.filter((i) => i.status === 'Open').length} Open)
            </button>
          </div>

          {/* Add button contextually tied to active tab */}
          {activeTab === 'visits' && (
            <button
              onClick={() => setIsAddVisitOpen(true)}
              className="px-3.5 py-1.5 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Visit
            </button>
          )}
          {activeTab === 'payments' && (
            <button
              onClick={() => setIsAddPaymentOpen(true)}
              className="px-3.5 py-1.5 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          )}
          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-1.5 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )}
          {activeTab === 'issues' && (
            <button
              onClick={() => setIsAddIssueOpen(true)}
              className="px-3.5 py-1.5 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Log Item
            </button>
          )}
        </div>

        {/* ================= TAB 1: VISITS ================= */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-[#181817] border border-dashed border-stone-300 dark:border-[#2f2e2b] rounded-2xl p-6">
                <Footprints className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No site visits logged yet</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                  Record your first inspection, layout check, or client consultation on-site.
                </p>
                <button
                  onClick={() => setIsAddVisitOpen(true)}
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Record Visit
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-xl divide-y divide-stone-100 dark:divide-[#242320] overflow-hidden shadow-xs">
                {visits.map((visit, index) => (
                  <div
                    key={visit.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-stone-50/80 dark:hover:bg-[#1e1e1c] transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-[#252522] text-stone-700 dark:text-stone-300 font-mono text-[11px] font-bold border border-stone-200 dark:border-[#33322f]">
                          Visit #{visits.length - index}
                        </span>
                        <span className="text-xs font-bold text-[#a67d5d] dark:text-[#c49a79]">
                          {formatDate(visit.date)}
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          {visit.purpose}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                        {visit.notes || 'Routine site observation.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmDelete({
                          isOpen: true,
                          type: 'visit',
                          id: visit.id,
                          title: 'Delete Site Visit Record?',
                          message: `Are you sure you want to delete the visit on ${formatDate(visit.date)} (${visit.purpose})?`,
                        });
                      }}
                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-600 transition-colors self-end sm:self-auto"
                      title="Delete visit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PAYMENTS ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-[#181817] border border-dashed border-stone-300 dark:border-[#2f2e2b] rounded-2xl p-6">
                <CreditCard className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No payments recorded yet</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                  Record advances or milestone payments received from the client.
                </p>
                <button
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Record Payment
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                    <thead className="bg-stone-50 dark:bg-[#1f1f1d] text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold tracking-[0.15em] border-b border-stone-200 dark:border-[#292825]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Note / Stage</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-[#242320]">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/80 dark:hover:bg-[#1e1e1c] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200">
                            {formatDate(p.date)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-[#f5efe9] dark:bg-[#28211b] text-[#8c6546] dark:text-[#d1a684] font-bold text-[10px] uppercase">
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">{p.mode}</td>
                          <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400">{p.note || '-'}</td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {formatCurrency(p.amount, currencySymbol)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setConfirmDelete({
                                  isOpen: true,
                                  type: 'payment',
                                  id: p.id,
                                  title: 'Delete Payment Record?',
                                  message: `Are you sure you want to remove this payment of ${formatCurrency(p.amount, currencySymbol)}?`,
                                });
                              }}
                              className="p-1 text-stone-400 dark:text-stone-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: EXPENSES ================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-[#181817] border border-dashed border-stone-300 dark:border-[#2f2e2b] rounded-2xl p-6">
                <Briefcase className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No expenses recorded yet</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                  Track travel, printing, or soil testing costs and choose whether they are billable.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                    <thead className="bg-stone-50 dark:bg-[#1f1f1d] text-stone-500 dark:text-stone-400 uppercase text-[10px] font-bold tracking-[0.15em] border-b border-stone-200 dark:border-[#292825]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Billable to Client</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-[#242320]">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-stone-50/80 dark:hover:bg-[#1e1e1c] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-stone-800 dark:text-stone-200">
                            {formatDate(exp.date)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                            {exp.description}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                exp.billableToClient
                                  ? 'bg-[#f5efe9] dark:bg-[#28211b] text-[#8c6546] dark:text-[#d1a684] border border-[#a67d5d]/30'
                                  : 'bg-stone-100 dark:bg-[#252522] text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {exp.billableToClient ? 'Billable' : 'Internal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-stone-800 dark:text-stone-200">
                            {formatCurrency(exp.amount, currencySymbol)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setConfirmDelete({
                                  isOpen: true,
                                  type: 'expense',
                                  id: exp.id,
                                  title: 'Delete Expense Record?',
                                  message: `Delete expense "${exp.description}" (${formatCurrency(exp.amount, currencySymbol)})?`,
                                });
                              }}
                              className="p-1 text-stone-400 dark:text-stone-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ISSUES ================= */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-[#181817] border border-dashed border-stone-300 dark:border-[#2f2e2b] rounded-2xl p-6">
                <AlertTriangle className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No punch list items or notes logged</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
                  Track contractor clashes, material delays, or architectural revisions on-site.
                </p>
                <button
                  onClick={() => setIsAddIssueOpen(true)}
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Log Item
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-xl divide-y divide-stone-100 dark:divide-[#242320] overflow-hidden shadow-xs">
                {issues.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-stone-50/80 dark:hover:bg-[#1e1e1c] transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleIssueStatus(item)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          }`}
                          title="Click to toggle Open / Resolved"
                        >
                          {item.status === 'Resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {item.status}
                        </button>
                        <span className="text-xs text-stone-400 dark:text-stone-500">{formatDate(item.date)}</span>
                      </div>

                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {item.description}
                      </p>

                      {item.resolutionNote && (
                        <div className="text-xs text-stone-600 dark:text-stone-400 bg-[#fcfbf9] dark:bg-[#20201d] p-2.5 rounded-lg border border-stone-200 dark:border-[#2f2e2b]">
                          <span className="font-bold text-stone-800 dark:text-stone-200">Resolution Note: </span>
                          {item.resolutionNote}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleIssueStatus(item)}
                        className="px-2.5 py-1 bg-stone-100 dark:bg-[#252522] hover:bg-stone-200 dark:hover:bg-[#2e2d2a] text-stone-700 dark:text-stone-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Mark {item.status === 'Open' ? 'Resolved' : 'Open'}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDelete({
                            isOpen: true,
                            type: 'issue',
                            id: item.id,
                            title: 'Delete Issue / Note Record?',
                            message: `Delete issue "${item.description}"?`,
                          });
                        }}
                        className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Add Visit */}
      {isAddVisitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden my-auto transition-colors">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-[#292825] bg-stone-50/80 dark:bg-[#1f1f1d]">
              <h3 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef] flex items-center gap-2">
                <Footprints className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
                Log Site Inspection Visit
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVisitOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVisit} className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Visit Date *
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Visit Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  placeholder="e.g. Foundation inspection, Client meeting, Tile selection"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Observations & Discussion Notes
                </label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Column reinforcement aligned with structural drawing. Checked waterproofing slope."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-[#292825]">
                <button
                  type="button"
                  onClick={() => setIsAddVisitOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Record Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Payment */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden my-auto transition-colors">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-[#292825] bg-stone-50/80 dark:bg-[#1f1f1d]">
              <h3 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
                Record Received Payment
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="e.g. 10000"
                    value={paymentAmount === 0 ? '' : paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Payment Stage
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] font-medium"
                  >
                    <option value="Advance">Advance</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Final">Final</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Reference / Milestone Note
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Drawing release stage 2, UTR #982312"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-[#292825]">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden my-auto transition-colors">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-[#292825] bg-stone-50/80 dark:bg-[#1f1f1d]">
              <h3 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
                Add Site Expense
              </h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="e.g. 2500"
                    value={expenseAmount === 0 ? '' : expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g. Outstation site travel fuel, Blueprint printing"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-[#1e1e1c] rounded-lg border border-stone-200 dark:border-[#2f2e2b]">
                <input
                  type="checkbox"
                  id="billableCheck"
                  checked={expenseBillable}
                  onChange={(e) => setExpenseBillable(e.target.checked)}
                  className="w-4 h-4 text-[#a67d5d] border-stone-300 rounded focus:ring-[#a67d5d]"
                />
                <label htmlFor="billableCheck" className="text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                  Billable to Client (Include in invoice)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-[#292825]">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Issue */}
      {isAddIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden my-auto transition-colors">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-[#292825] bg-stone-50/80 dark:bg-[#1f1f1d]">
              <h3 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#a67d5d] dark:text-[#c49a79]" />
                Log Site Coordination Item / Punch List
              </h3>
              <button
                type="button"
                onClick={() => setIsAddIssueOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddIssue} className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={issueStatus}
                    onChange={(e) => setIssueStatus(e.target.value as IssueStatus)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] font-medium"
                  >
                    <option value="Open">Open</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Issue Description *
                </label>
                <input
                  type="text"
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="e.g. Electrical conduit clash with HVAC duct on 1st floor"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Resolution Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={issueResolution}
                  onChange={(e) => setIssueResolution(e.target.value)}
                  placeholder="e.g. Contractor instructed to route conduit 150mm lower as per revised schematic."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-[#292825]">
                <button
                  type="button"
                  onClick={() => setIsAddIssueOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={isEditClientModalOpen}
        onClose={() => setIsEditClientModalOpen(false)}
        onSave={async (data, id) => {
          await saveClient(data, id);
          await loadAll();
        }}
        clientToEdit={client}
      />

      {/* Generic Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={true}
      />
    </div>
  );
}

export default function ClientDetailContent() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0e0e0d]">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#a67d5d] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stone-500 dark:text-stone-400">
                Loading Client Dossier...
              </p>
            </div>
          </div>
        }
      >
        <ClientDetailInner />
      </Suspense>
    </AuthGate>
  );
}
