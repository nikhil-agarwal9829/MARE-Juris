'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { ScalesOfJustice3D } from '@/components/visual/ScalesOfJustice3D';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/home');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[85vh] w-full max-w-6xl mx-auto rounded-3xl overflow-hidden legal-card border border-gold-500/20 my-6">
      {/* Left Column: Premium Legal 3D Visual */}
      <div className="lg:col-span-6 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 p-8 md:p-12 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-gold-500/15 overflow-hidden">
        {/* Subtle Brand Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="p-2 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
            <Scale className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-xl tracking-wide gold-gradient-text">
            MARE-Juris
          </span>
        </div>

        {/* Hero Visual */}
        <div className="my-8 relative z-10">
          <ScalesOfJustice3D />
          <div className="mt-6 text-center lg:text-left">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
              Legal intelligence, <br />
              <span className="gold-gradient-text">grounded in evidence.</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-400 leading-relaxed max-w-md">
              Understand Indian statutes, regulations, and case law with clear, evidence-backed explanations.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 pt-4 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Session</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold-400" />
            <span>RLS Data Isolated</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Panel */}
      <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-navy-900/90 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to continue to your MARE-Juris workspace.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="lawyer@firm.com"
                  className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-navy-950 font-semibold text-sm transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center flex flex-col gap-3">
            <Link
              href="/otp"
              className="text-xs text-slate-400 hover:text-gold-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-gold-400" />
              <span>Sign in with Email Passcode (OTP)</span>
            </Link>

            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
