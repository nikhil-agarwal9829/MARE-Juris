'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } catch (err: any) {
      setErrorMsg('Failed to update password.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy-950 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full legal-card rounded-3xl p-8 md:p-10 border border-gold-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
            <Scale className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-xl tracking-wide gold-gradient-text">
            MARE-Juris
          </span>
        </div>

        {success ? (
          <div className="text-center py-6 animate-fade-in space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Password Updated</h2>
            <p className="text-sm text-slate-300">
              Your password has been successfully updated. Redirecting to your workspace...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Set New Password</h1>
              <p className="text-sm text-slate-400 mt-1">
                Enter your new password below.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-11 pr-4 py-3 bg-navy-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
