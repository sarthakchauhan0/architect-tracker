'use client';

import React, { useState, useEffect } from 'react';
import { Client, ProjectStatus } from '@/types';
import { X, Save, Building, Calendar, IndianRupee, MapPin, Phone, Mail, FileText, Footprints } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id'>, id?: string) => Promise<void>;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [startDate, setStartDate] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Active');
  const [totalVisitsPlanned, setTotalVisitsPlanned] = useState<number>(10);
  const [totalProjectAmount, setTotalProjectAmount] = useState<number>(150000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setPhone(clientToEdit.phone || '');
      setEmail(clientToEdit.email || '');
      setAddress(clientToEdit.address || '');
      setProjectName(clientToEdit.projectName || '');
      setProjectType(clientToEdit.projectType || 'Residential');
      setStartDate(clientToEdit.startDate || '');
      setEstimatedCompletionDate(clientToEdit.estimatedCompletionDate || '');
      setStatus(clientToEdit.status || 'Active');
      setTotalVisitsPlanned(clientToEdit.totalVisitsPlanned || 10);
      setTotalProjectAmount(clientToEdit.totalProjectAmount || 0);
      setNotes(clientToEdit.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setMonth(nextYear.getMonth() + 6);
      const estFinish = nextYear.toISOString().split('T')[0];

      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setProjectName('');
      setProjectType('Residential');
      setStartDate(today);
      setEstimatedCompletionDate(estFinish);
      setStatus('Active');
      setTotalVisitsPlanned(10);
      setTotalProjectAmount(150000);
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        {
          name,
          phone,
          email,
          address,
          projectName,
          projectType,
          startDate,
          estimatedCompletionDate,
          status,
          totalVisitsPlanned: Number(totalVisitsPlanned) || 0,
          totalProjectAmount: Number(totalProjectAmount) || 0,
          notes,
        },
        clientToEdit?.id
      );
      onClose();
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Error saving client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-2xl overflow-hidden transition-colors"
      >
        {/* Header - Fixed & Sticky */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-200 dark:border-[#292825] bg-stone-50/80 dark:bg-[#1f1f1d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#f5efe9] dark:bg-[#25201c] text-[#a67d5d] dark:text-[#c49a79]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a67d5d] dark:text-[#c49a79] block">
                Client Details
              </span>
              <h2 className="text-base font-bold text-[#141414] dark:text-[#f4f3ef]">
                {clientToEdit ? 'Edit Client & Project' : 'Register New Client'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Client Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Singhania"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
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
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Project Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors font-medium"
              >
                <option value="Residential Villa">Residential Villa</option>
                <option value="Apartment Interior">Apartment Interior</option>
                <option value="Commercial Space">Commercial Space</option>
                <option value="Renovation & Remodel">Renovation & Remodel</option>
                <option value="Landscape Design">Landscape Design</option>
                <option value="Other Architectural">Other Architectural</option>
              </select>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. 4BHK Residence, Sector 12"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors font-medium"
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              Site / Project Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Plot 45, Phase 2, Whitefield, Bengaluru"
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
            />
          </div>

          {/* Timeline & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Estimated Completion Date
              </label>
              <input
                type="date"
                required
                value={estimatedCompletionDate}
                onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
              />
            </div>
          </div>

          {/* Fees & Visits Agreement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#fcfbf9] dark:bg-[#1f1f1d] border border-stone-200 dark:border-[#2e2d2a]">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-[#a67d5d] dark:text-[#c49a79]" />
                Total Visits Planned
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalVisitsPlanned}
                onChange={(e) => setTotalVisitsPlanned(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#171716] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] transition-colors font-medium"
              />
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">
                Agreed site inspection & coordination visits
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#a67d5d] dark:text-[#c49a79]" />
                Total Project Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={totalProjectAmount === 0 ? '' : totalProjectAmount}
                onChange={(e) => setTotalProjectAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="e.g. 150000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#171716] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] transition-colors font-medium"
              />
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">
                Total professional architecture fee
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              General Project Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              spellCheck="true"
              autoCorrect="on"
              autoCapitalize="sentences"
              placeholder="e.g. Scope includes structural, electrical, and elevation drawings. 3D renderings pending client approval."
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
            />
          </div>
        </div>

        {/* Footer - Fixed & Sticky */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-stone-200 dark:border-[#292825] bg-stone-50/90 dark:bg-[#1f1f1d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-[#252522] hover:bg-stone-200 dark:hover:bg-[#2f2e2a] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a] disabled:opacity-50 rounded-lg transition-colors shadow-sm shadow-[#a67d5d]/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : clientToEdit ? 'Save Changes' : 'Register Client'}
          </button>
        </div>
      </form>
    </div>
  );
};
