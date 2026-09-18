'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured, loginWithEmail, resetPassword } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';
import { Lock, Mail, KeyRound, AlertCircle, CheckCircle2, Compass, Sun, Moon } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Toggle between sign in and sign up (for the single architect's first-time setup)
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!auth) throw new Error('Auth not ready');
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Failed to authenticate';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No architect account found with this email. Click "First time setup" to create your account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setIsResetting(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Reset error:', err);
      setResetError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] flex flex-col items-center justify-center p-4 text-stone-600 dark:text-stone-400">
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-black tracking-tight text-[#141414] dark:text-[#f4f3ef]">RSA</span>
          <span className="text-4xl font-black text-[#a67d5d] dark:text-[#c49a79] leading-none">.</span>
        </div>
        <div className="w-8 h-8 border-2 border-[#a67d5d] dark:border-[#c49a79] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stone-500 dark:text-stone-400">Initializing Studio Tracker...</p>
      </div>
    );
  }

  // If Firebase keys are not yet added to .env.local
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 text-[#a67d5d] dark:text-[#c49a79] mb-4">
            <Compass className="w-7 h-7" />
            <h1 className="text-xl font-bold text-[#141414] dark:text-[#f4f3ef] tracking-tight">Studio Setup Required</h1>
          </div>

          <p className="text-stone-600 dark:text-stone-400 text-sm mb-6 leading-relaxed">
            Firebase environment keys are needed to connect to your live Firestore and Authentication backend.
          </p>

          <div className="bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-xl p-4 text-xs font-mono text-stone-800 dark:text-stone-200 mb-6 space-y-2">
            <div className="text-stone-400 dark:text-stone-500">// 1. Create .env.local in project root:</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789</div>
            <div className="text-[#a67d5d] dark:text-[#c49a79]">NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:...</div>
          </div>

          <div className="bg-[#f5efe9] dark:bg-[#28211b] border border-[#a67d5d]/30 rounded-xl p-4 text-[#8c6546] dark:text-[#d1a684] text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#a67d5d] dark:text-[#c49a79]" />
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-100">Quick Setup:</p>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                Copy your Firebase Web App credentials into <span className="font-mono bg-white dark:bg-[#181817] px-1 py-0.5 rounded border border-stone-200 dark:border-stone-700">.env.local</span> and restart the server.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0e0e0d] flex flex-col items-center justify-center p-4 relative transition-colors">
        {/* Top right Theme Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-[#181817] text-stone-600 dark:text-stone-300 border border-[#e5e3dc] dark:border-[#292825] shadow-xs hover:border-stone-400 transition-all flex items-center gap-1.5"
            title={theme === 'dark' ? 'Switch to White Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#c49a79]" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#181817] border border-[#e5e3dc] dark:border-[#292825] rounded-2xl shadow-xl p-8 transition-colors">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center mb-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#141414] dark:text-[#f4f3ef]">
                RSA
              </span>
              <span className="text-4xl sm:text-5xl font-black text-[#a67d5d] dark:text-[#c49a79] leading-none">
                .
              </span>
            </div>
            <h1 className="text-xs font-bold uppercase tracking-[0.25em] text-[#141414] dark:text-[#f4f3ef]">
              Rahul Sharma Architects
            </h1>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] font-semibold mt-1">
              Client & Site Visit Command Center
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Architect Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="connect@rahulsharmaarchitects.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-xl text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-semibold text-[#a67d5d] dark:text-[#c49a79] hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-xl text-stone-900 dark:text-stone-100 text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#a67d5d] hover:bg-[#8f6747] active:bg-[#7b573a] disabled:opacity-50 text-white font-bold uppercase tracking-[0.15em] rounded-xl text-xs transition-colors shadow-sm shadow-[#a67d5d]/25 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : isSignUp ? 'Create Architect Account' : 'Sign In to Studio'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200 dark:border-[#292825] text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              {isSignUp ? 'Already registered? Sign in' : 'First time running? Register single architect account'}
            </button>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#181817] border border-stone-200 dark:border-[#292825] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-[#f5efe9] dark:bg-[#28211b] text-[#a67d5d] dark:text-[#c49a79] rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Reset Password</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Receive reset instructions by email</p>
                </div>
              </div>

              {resetSuccess ? (
                <div className="py-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Password reset link sent! Check your inbox.</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSuccess(false);
                    }}
                    className="w-full py-2 px-3 bg-stone-100 dark:bg-[#252522] hover:bg-stone-200 dark:hover:bg-[#2e2d2a] text-stone-800 dark:text-stone-200 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                  {resetError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg text-rose-700 dark:text-rose-400 text-xs">
                      {resetError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="connect@rahulsharmaarchitects.com"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1e1e1c] border border-stone-200 dark:border-[#2f2e2b] rounded-lg text-stone-900 dark:text-stone-100 text-xs placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-[#a67d5d] dark:focus:border-[#c49a79] focus:bg-white dark:focus:bg-[#181817]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3 py-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="px-4 py-1.5 bg-[#a67d5d] hover:bg-[#8f6747] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      {isResetting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
