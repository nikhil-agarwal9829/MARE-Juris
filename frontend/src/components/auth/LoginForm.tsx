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
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setErrorMsg('Cannot connect to Supabase server. If your Supabase free project is paused, please unpause it in your Supabase Dashboard.');
      } else {
        setErrorMsg('An unexpected error occurred during sign in.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[85vh] w-full max-w-6xl mx-auto rounded-3xl overflow-hidden legal-card border border-slate-200 my-6 bg-white shadow-xl shadow-slate-200/50">
      {/* Left Column: Premium Legal 3D Visual */}
      <div className="lg:col-span-6 bg-gradient-to-b from-blue-50 via-white to-blue-50 p-8 md:p-12 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
        {/* Subtle Brand Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-primary shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-xl tracking-wide text-primary">
            MARE-Juris
          </span>
        </div>

        {/* Hero Visual */}
        <div className="my-8 relative z-10">
          <ScalesOfJustice3D />
          <div className="mt-6 text-center lg:text-left">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              Legal intelligence, <br />
              <span className="text-primary">grounded in evidence.</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed max-w-md">
              Understand Indian statutes, regulations, and case law with clear, evidence-backed explanations.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-slate-200 pt-4 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Session</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>RLS Data Isolated</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Panel */}
      <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-white relative">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sign in to continue to your MARE-Juris workspace.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lawyer@firm.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center flex flex-col gap-3">
            <Link
              href="/otp"
              className="text-xs text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Sign in with Email Passcode (OTP)</span>
            </Link>

            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
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
