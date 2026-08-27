'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Scale, Lock, Mail, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during account creation.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy-950 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full legal-card rounded-3xl p-8 md:p-10 border border-gold-500/20">
        {/* Logo Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
            <Scale className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-xl tracking-wide gold-gradient-text">
            MARE-Juris
          </span>
        </div>

        {submitted ? (
          <div className="text-center py-6 animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Check your email</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your verification link has been sent to{' '}
              <strong className="text-gold-300">{email}</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Please click the link in your email to verify your account before signing in.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 hover:text-gold-300 text-sm font-semibold transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
              <p className="text-sm text-slate-400 mt-1">
                Access evidence-grounded legal intelligence and case insights.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Advocate Rajesh Sharma"
                    className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@lawfirm.in"
                    className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-semibold text-sm transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
