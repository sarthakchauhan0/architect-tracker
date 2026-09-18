import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Client,
  Visit,
  Payment,
  Expense,
  Issue,
  ArchitectSettings,
  ClientFullData,
  BackupData,
} from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    try {
      // Enable Firestore offline persistence with IndexedDB
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({}),
      });
    } catch {
      db = getFirestore(app);
    }
  } else {
    app = getApp();
    db = getFirestore(app);
  }
  auth = getAuth(app);
}

export { app, auth, db };

// Auth helpers
export const resetPassword = async (email: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized. Please verify your .env.local configuration.');
  return sendPasswordResetEmail(auth, email);
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized. Please verify your .env.local configuration.');
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  if (!auth) return;
  return signOut(auth);
};

// ==================== FIRESTORE CRUD ====================

// Clients
export const getClients = async (): Promise<Client[]> => {
  if (!db) return [];
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Client[];
};

export const getClientById = async (id: string): Promise<Client | null> => {
  if (!db) return null;
  const docRef = doc(db, 'clients', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
};

export const saveClient = async (clientData: Omit<Client, 'id'>, id?: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const clientsRef = collection(db, 'clients');
  const targetDoc = id ? doc(db, 'clients', id) : doc(clientsRef);
  
  const payload = {
    ...clientData,
    updatedAt: serverTimestamp(),
    ...(id ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(targetDoc, payload, { merge: true });
  return targetDoc.id;
};

export const deleteClient = async (clientId: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  // Delete subcollection documents first
  const subcollections = ['visits', 'payments', 'expenses', 'issues'];
  for (const sub of subcollections) {
    const subRef = collection(db, 'clients', clientId, sub);
    const subSnap = await getDocs(subRef);
    const deletePromises = subSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  }

  // Delete main client document
  const clientDocRef = doc(db, 'clients', clientId);
  await deleteDoc(clientDocRef);
};

// Visits
export const getVisits = async (clientId: string): Promise<Visit[]> => {
  if (!db) return [];
  const visitsRef = collection(db, 'clients', clientId, 'visits');
  const q = query(visitsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId,
    ...d.data(),
  })) as Visit[];
};

export const saveVisit = async (clientId: string, visitData: Omit<Visit, 'id' | 'clientId'>, id?: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = collection(db, 'clients', clientId, 'visits');
  const targetDoc = id ? doc(db, 'clients', clientId, 'visits', id) : doc(ref);
  await setDoc(targetDoc, {
    ...visitData,
    clientId,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return targetDoc.id;
};

export const deleteVisit = async (clientId: string, visitId: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, 'clients', clientId, 'visits', visitId));
};

// Payments
export const getPayments = async (clientId: string): Promise<Payment[]> => {
  if (!db) return [];
  const paymentsRef = collection(db, 'clients', clientId, 'payments');
  const q = query(paymentsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId,
    ...d.data(),
  })) as Payment[];
};

export const savePayment = async (clientId: string, paymentData: Omit<Payment, 'id' | 'clientId'>, id?: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = collection(db, 'clients', clientId, 'payments');
  const targetDoc = id ? doc(db, 'clients', clientId, 'payments', id) : doc(ref);
  await setDoc(targetDoc, {
    ...paymentData,
    clientId,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return targetDoc.id;
};

export const deletePayment = async (clientId: string, paymentId: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, 'clients', clientId, 'payments', paymentId));
};

// Expenses
export const getExpenses = async (clientId: string): Promise<Expense[]> => {
  if (!db) return [];
  const expensesRef = collection(db, 'clients', clientId, 'expenses');
  const q = query(expensesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId,
    ...d.data(),
  })) as Expense[];
};

export const saveExpense = async (clientId: string, expenseData: Omit<Expense, 'id' | 'clientId'>, id?: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = collection(db, 'clients', clientId, 'expenses');
  const targetDoc = id ? doc(db, 'clients', clientId, 'expenses', id) : doc(ref);
  await setDoc(targetDoc, {
    ...expenseData,
    clientId,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return targetDoc.id;
};

export const deleteExpense = async (clientId: string, expenseId: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, 'clients', clientId, 'expenses', expenseId));
};

// Issues
export const getIssues = async (clientId: string): Promise<Issue[]> => {
  if (!db) return [];
  const issuesRef = collection(db, 'clients', clientId, 'issues');
  const q = query(issuesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId,
    ...d.data(),
  })) as Issue[];
};

export const saveIssue = async (clientId: string, issueData: Omit<Issue, 'id' | 'clientId'>, id?: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const ref = collection(db, 'clients', clientId, 'issues');
  const targetDoc = id ? doc(db, 'clients', clientId, 'issues', id) : doc(ref);
  await setDoc(targetDoc, {
    ...issueData,
    clientId,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return targetDoc.id;
};

export const deleteIssue = async (clientId: string, issueId: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, 'clients', clientId, 'issues', issueId));
};

// Settings
export const DEFAULT_SETTINGS: ArchitectSettings = {
  architectName: 'Ar. Rahul Sharma',
  firmName: 'Rahul Sharma Architects',
  email: 'connect@rahulsharmaarchitects.com',
  phone: '+91 8130950761',
  address: 'B-1, Janak Puri, New Delhi, 110059',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    upiId: 'rahulsharma@okhdfcbank',
  },
  currencySymbol: '₹',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 101,
};

export const getSettings = async (): Promise<ArchitectSettings> => {
  if (!db) return DEFAULT_SETTINGS;
  try {
    const docRef = doc(db, 'settings', 'profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      // Replace previous placeholder data if found in Firestore
      const isPlaceholder = !data.firmName || data.firmName === 'Studio ArchForm Design';
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        firmName: isPlaceholder ? 'Rahul Sharma Architects' : data.firmName,
        phone: isPlaceholder || data.phone === '+91 98765 43210' ? '+91 8130950761' : data.phone,
        email: isPlaceholder || data.email === 'studio@archform.in' ? 'connect@rahulsharmaarchitects.com' : data.email,
        address: isPlaceholder || data.address?.includes('Bengaluru') ? 'B-1, Janak Puri, New Delhi, 110059' : data.address,
      } as ArchitectSettings;
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: Partial<ArchitectSettings>): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, 'settings', 'profile');
  await setDoc(docRef, settings, { merge: true });
};

// Increment invoice number in settings
export const incrementInvoiceNumber = async (current: number): Promise<number> => {
  if (!db) return current + 1;
  const nextNum = current + 1;
  const docRef = doc(db, 'settings', 'profile');
  await setDoc(docRef, { nextInvoiceNumber: nextNum }, { merge: true });
  return nextNum;
};

// Full Backup Extractor
export const fetchCompleteBackupData = async (): Promise<BackupData> => {
  const clients = await getClients();
  const settings = await getSettings();
  
  const clientsData: ClientFullData[] = [];
  for (const client of clients) {
    const [visits, payments, expenses, issues] = await Promise.all([
      getVisits(client.id),
      getPayments(client.id),
      getExpenses(client.id),
      getIssues(client.id),
    ]);
    clientsData.push({
      client,
      visits,
      payments,
      expenses,
      issues,
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    settings,
    clientsData,
  };
};
