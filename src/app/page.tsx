'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getClients,
  saveClient,
  deleteClient,
  getVisits,
  getPayments,
  getSettings,
} from '@/lib/firebase';
import { Client, ProjectStatus, ArchitectSettings } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ClientModal } from '@/components/ClientModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AuthGate } from '@/components/AuthGate';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  Search,
  Plus,
  Building,
  Calendar,
  IndianRupee,
  Footprints,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  Edit2,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ClientWithMetrics extends Client {
  visitsCompleted: number;
  totalPaid: number;
  balanceDue: number;
}

function DashboardContent() {
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [settings, setSettings] = useState<ArchitectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [clientToDeleteName, setClientToDeleteName] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedClients, fetchedSettings] = await Promise.all([
        getClients(),
        getSettings(),
      ]);
      setSettings(fetchedSettings);

      // Load visits & payments in parallel for metrics
      const enriched: ClientWithMetrics[] = await Promise.all(
        fetchedClients.map(async (client) => {
          const [visits, payments] = await Promise.all([
            getVisits(client.id),
            getPayments(client.id),
          ]);
          const visitsCompleted = visits.length;
          const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const balanceDue = (Number(client.totalProjectAmount) || 0) - totalPaid;
          return {
            ...client,
            visitsCompleted,
            totalPaid,
            balanceDue,
          };
        })
      );

      setClients(enriched);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveClient = async (clientData: Omit<Client, 'id'>, id?: string) => {
    await saveClient(clientData, id);
    await loadData();
  };

  const handleDeleteClientConfirm = async () => {
    if (!deleteClientId) return;
    try {
      await deleteClient(deleteClientId);
      setDeleteClientId(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Failed to delete client. Please try again.');
    }
  };

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ? true : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  // High-level dashboard statistics
  const stats = useMemo(() => {
    const activeProjects = clients.filter((c) => c.status === 'Active').length;
    const totalVisitsDone = clients.reduce((sum, c) => sum + c.visitsCompleted, 0);
    const totalReceivables = clients.reduce(
      (sum, c) => sum + Math.max(0, c.balanceDue),
      0
    );
    const completedProjects = clients.filter((c) => c.status === 'Completed').length;
    return { activeProjects, totalVisitsDone, totalReceivables, completedProjects };
  }, [clients]);

  const currencySymbol = settings?.currencySymbol || '₹';

  // Helper to check if project completion date is within the next 30 days
  const isApproachingDeadline = (dateStr?: string) => {
    if (!dateStr) return false;
    const est = new Date(dateStr).getTime();
    const now = Date.now();
    const diffDays = (est - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#141414] flex flex-col pb-20 md:pb-8">
      <Navbar onOpenNewClient={() => {
        setClientToEdit(null);
        setIsClientModalOpen(true);
      }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Eyebrow, Welcome & Action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#e5e3dc]">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#a67d5d] block mb-1">
              Rahul Sharma Architects • Studio Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
              Commissions & Site Inspections
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Live site inspection logs, milestone billing schedules, and architectural progress.
            </p>
          </div>

          <button
            onClick={() => {
              setClientToEdit(null);
              setIsClientModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-lg shadow-sm shadow-[#a67d5d]/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Commission
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#e5e3dc] shadow-xs hover:border-[#a67d5d]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Active Projects
              </span>
              <div className="p-1.5 rounded-md bg-[#f5efe9] text-[#a67d5d]">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#141414] mt-2">
              {stats.activeProjects}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {stats.completedProjects} projects completed
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e5e3dc] shadow-xs hover:border-[#a67d5d]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Visits Completed
              </span>
              <div className="p-1.5 rounded-md bg-stone-100 text-stone-700">
                <Footprints className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#141414] mt-2">
              {stats.totalVisitsDone}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Across all site commissions
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e5e3dc] shadow-xs hover:border-[#a67d5d]/40 transition-colors col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Total Receivables
              </span>
              <div className="p-1.5 rounded-md bg-[#f5efe9] text-[#a67d5d]">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#a67d5d] mt-2">
              {formatCurrency(stats.totalReceivables, currencySymbol)}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Outstanding client balance
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e5e3dc] shadow-xs hover:border-[#a67d5d]/40 transition-colors col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Total Clients
              </span>
              <div className="p-1.5 rounded-md bg-stone-100 text-stone-700">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#141414] mt-2">
              {clients.length}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Tracked in Firestore
            </span>
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#e5e3dc] shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, project names, or site locations..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#a67d5d] focus:bg-white transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Active', 'On Hold', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-[#141414] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grid / Table View Switcher */}
          <div className="hidden sm:flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#141414] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#141414] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center text-stone-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#a67d5d] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs uppercase tracking-[0.2em] font-semibold">Loading studio commissions...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-20 text-center bg-white border border-dashed border-stone-300 rounded-2xl p-8">
            <Building className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">No commissions found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || statusFilter !== 'All'
                ? 'No clients match your filter criteria. Try clearing filters.'
                : 'Start by creating your first architectural client commission.'}
            </p>
            <button
              onClick={() => {
                setClientToEdit(null);
                setIsClientModalOpen(true);
              }}
              className="px-4 py-2 bg-[#a67d5d] hover:bg-[#8f6747] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-lg inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Client
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const visitsDone = client.visitsCompleted;
              const visitsPlanned = client.totalVisitsPlanned || 1;
              const visitPercent = Math.min(100, Math.round((visitsDone / visitsPlanned) * 100));
              const isDeadlineNear = isApproachingDeadline(client.estimatedCompletionDate);
              const isFullyPaid = client.balanceDue <= 0;

              return (
                <div
                  key={client.id}
                  className="group bg-white border border-[#e5e3dc] hover:border-stone-400 hover:shadow-md rounded-xl p-6 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Status Top Strip */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          client.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : client.status === 'On Hold'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-[#f5efe9] text-[#8c6546] border border-[#a67d5d]/30'
                        }`}
                      >
                        {client.status}
                      </span>
                      <span className="text-[11px] text-stone-500 ml-2 font-medium">
                        {client.projectType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setClientToEdit(client);
                          setIsClientModalOpen(true);
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteClientId(client.id);
                          setClientToDeleteName(client.name);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Project & Client Headings */}
                  <div className="mb-4">
                    <Link href={`/clients/${client.id}`} className="block group-hover:text-[#a67d5d] transition-colors">
                      <h2 className="text-lg font-bold text-[#141414] tracking-tight leading-snug line-clamp-1">
                        {client.projectName}
                      </h2>
                    </Link>
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-stone-700">{client.name}</span>
                      <span className="text-stone-300">•</span>
                      <span className="line-clamp-1 text-stone-500">{client.address}</span>
                    </p>
                  </div>

                  {/* Progress & Deadlines */}
                  <div className="space-y-3 my-2 pt-3 border-t border-stone-100">
                    {/* Visits Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Footprints className="w-3.5 h-3.5 text-[#a67d5d]" />
                          Site Visits:
                        </span>
                        <span className="font-semibold text-stone-800">
                          {visitsDone} of {client.totalVisitsPlanned} done ({visitPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden border border-stone-200">
                        <div
                          className="bg-[#a67d5d] h-full rounded-full transition-all duration-300"
                          style={{ width: `${visitPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Estimated Completion Date Alert */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Target Finish:
                      </span>
                      <span
                        className={`font-medium ${
                          isDeadlineNear
                            ? 'text-amber-700 flex items-center gap-1 font-semibold'
                            : 'text-stone-700'
                        }`}
                      >
                        {isDeadlineNear && <Clock className="w-3 h-3 text-amber-600" />}
                        {formatDate(client.estimatedCompletionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Financial Overview Bottom */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        Balance Due
                      </span>
                      <span
                        className={`text-sm font-black ${
                          isFullyPaid ? 'text-emerald-700' : 'text-[#a67d5d]'
                        }`}
                      >
                        {formatCurrency(client.balanceDue, currencySymbol)}
                      </span>
                    </div>

                    <Link
                      href={`/clients/${client.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-bold uppercase tracking-wider text-stone-800 transition-colors"
                    >
                      Manage
                      <ArrowRight className="w-3 h-3 text-[#a67d5d]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-[#e5e3dc] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-[0.15em] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Visits</th>
                    <th className="py-3 px-4">Est. Finish</th>
                    <th className="py-3 px-4 text-right">Fee</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredClients.map((client) => {
                    const visitsDone = client.visitsCompleted;
                    const isFullyPaid = client.balanceDue <= 0;
                    return (
                      <tr key={client.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-bold text-[#141414] hover:text-[#a67d5d] transition-colors text-sm block"
                          >
                            {client.projectName}
                          </Link>
                          <span className="text-stone-500 text-xs">
                            {client.name} • {client.phone}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              client.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : client.status === 'On Hold'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#f5efe9] text-[#8c6546] border border-[#a67d5d]/30'
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-800">
                          {visitsDone} of {client.totalVisitsPlanned}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {formatDate(client.estimatedCompletionDate)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-stone-800">
                          {formatCurrency(client.totalProjectAmount, currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                          {formatCurrency(client.totalPaid, currencySymbol)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-black ${
                            isFullyPaid ? 'text-emerald-700' : 'text-[#a67d5d]'
                          }`}
                        >
                          {formatCurrency(client.balanceDue, currencySymbol)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/clients/${client.id}`}
                              className="p-1.5 text-stone-400 hover:text-[#a67d5d] transition-colors"
                              title="Open Project"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setClientToEdit(client);
                                setIsClientModalOpen(true);
                              }}
                              className="p-1.5 text-stone-400 hover:text-stone-800 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteClientId(client.id);
                                setClientToDeleteName(client.name);
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

        {/* Add / Edit Client Modal */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setClientToEdit(null);
          }}
          onSave={handleSaveClient}
          clientToEdit={clientToEdit}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deleteClientId)}
          title="Delete Client & All Associated Records?"
          message={`Are you sure you want to permanently delete "${clientToDeleteName}" and all related visits, payments, expenses, and issues? This action cannot be undone.`}
          confirmLabel="Delete Everything"
          onConfirm={handleDeleteClientConfirm}
          onCancel={() => setDeleteClientId(null)}
          isDestructive={true}
        />
      </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
