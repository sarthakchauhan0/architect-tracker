export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';
export type PaymentType = 'Advance' | 'Milestone' | 'Final' | 'Other';
export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Other';
export type IssueStatus = 'Open' | 'Resolved';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  projectName: string;
  projectType: string;
  startDate: string;
  estimatedCompletionDate: string;
  status: ProjectStatus;
  totalVisitsPlanned: number;
  totalProjectAmount: number;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Visit {
  id: string;
  clientId: string;
  date: string;
  purpose: string;
  notes: string;
  createdAt?: any;
}

export interface Payment {
  id: string;
  clientId: string;
  date: string;
  amount: number;
  type: PaymentType;
  mode: PaymentMode;
  note?: string;
  createdAt?: any;
}

export interface Expense {
  id: string;
  clientId: string;
  date: string;
  description: string;
  amount: number;
  billableToClient: boolean;
  createdAt?: any;
}

export interface Issue {
  id: string;
  clientId: string;
  date: string;
  description: string;
  status: IssueStatus;
  resolutionNote?: string;
  createdAt?: any;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

export interface ArchitectSettings {
  architectName: string;
  firmName: string;
  email: string;
  phone: string;
  address: string;
  bankDetails: BankDetails;
  currencySymbol: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

export interface ClientFullData {
  client: Client;
  visits: Visit[];
  payments: Payment[];
  expenses: Expense[];
  issues: Issue[];
}

export interface BackupData {
  exportedAt: string;
  appVersion: string;
  settings: ArchitectSettings | null;
  clientsData: ClientFullData[];
}
