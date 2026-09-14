'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Mail } from 'lucide-react';
import { Navbar } from '@/components/navigation/Navbar';

type VerificationState = 'loading' | 'waiting' | 'success' | 'already_verified' | 'failed' | 'expired';

function VerifyEmailContent() {
  const [status, setStatus] = useState<VerificationState>('loading');
  const [countdown, setCountdown] = useState<number>(5);
  const [cooldown, setCooldown] = useState<number>(0);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [showResendInput, setShowResendInput] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    const evaluateStatus = async () => {
      const supabase = createClient();
      const verifiedParam = searchParams.get('verified');
      const errorParam = searchParams.get('error');
      const errorCodeParam = searchParams.get('error_code');
      const codeParam = searchParams.get('code');

      // 1. Direct code handling if landed directly on /verify-email?code=...
      if (codeParam) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
        if (!exchangeError) {
          if (isMounted) setStatus('success');
          return;
        } else {
          if (isMounted) {
            if (exchangeError.message.includes('expired')) {
              setStatus('expired');
            } else {
              setStatus('failed');
            }
          }
          return;
        }
      }

      // 2. Check current authenticated user session
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        if (verifiedParam === 'true') {
          if (isMounted) setStatus('success');
        } else {
          if (isMounted) setStatus('already_verified');
        }
        return;
      }

      // 3. Handle error flags
      if (errorCodeParam === 'otp_expired' || errorParam?.toLowerCase().includes('expired')) {
        if (isMounted) setStatus('expired');
        return;
      }

      if (errorParam) {
        if (isMounted) setStatus('failed');
        return;
      }

      // 4. Default state: waiting for link click from email
      if (isMounted) setStatus('waiting');
    };

    evaluateStatus();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Handle countdown redirect on success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'success' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (status === 'success' && countdown === 0) {
      router.push('/home');
    }
    return () => clearInterval(timer);
  }, [status, countdown, router]);

  // Handle resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/verify-email`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Verification link resent successfully! Please check your inbox.');
        setCooldown(60);
        setShowResendInput(false);
      }
    } catch {
      setMessage('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 border border-slate-200 text-center shadow-xl shadow-slate-200/50">
      {/* Header Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-primary shadow-sm">
          <Scale className="w-6 h-6" />
        </div>
        <span className="font-serif font-bold text-xl tracking-wide text-primary">
          MARE-Juris
        </span>
      </div>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-primary flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verifying your email...</h1>
          <p className="text-xs text-slate-500">Communicating with Supabase Authentication service.</p>
        </div>
      )}

      {/* 1. Verified Success State */}
      {status === 'success' && (
        <div className="space-y-5 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce-subtle">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-serif">Email Verified Successfully</h1>
            <p className="text-sm text-primary font-medium mt-1">Welcome to MARE-Juris.</p>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            Your MARE-Juris account is now verified. You have full access to evidence-grounded legal intelligence.
          </p>

          <div className="pt-2">
            <Link
              href="/home"
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Continue to MARE-Juris</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-slate-500 mt-3">
              Taking you to your dashboard in <span className="text-primary font-bold">{countdown}s</span>...
            </p>
          </div>
        </div>
      )}

      {/* 2. Already Verified State */}
      {status === 'already_verified' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Your email is already verified</h1>
          <p className="text-xs text-slate-700 leading-relaxed">
            Your account is active and ready to access legal intelligence and document analysis.
          </p>
          <div className="pt-4">
            <Link
              href="/home"
              className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <span>Go to MARE-Juris Home</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Awaiting Link Click State */}
      {status === 'waiting' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-primary flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="text-xs text-slate-700 leading-relaxed">
            We&apos;ve sent a verification link to your email address. Please click the link in your email to complete verification.
          </p>
        </div>
      )}

      {/* 4. Expired State */}
      {status === 'expired' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verification Link Expired</h1>
          <p className="text-xs text-slate-700 leading-relaxed">
            Your verification link has expired. Please request a new verification email to verify your account.
          </p>
        </div>
      )}

      {/* 5. Failure State */}
      {status === 'failed' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verification Failed</h1>
          <p className="text-xs text-slate-700 leading-relaxed">
            We couldn&apos;t verify this link. Please request a new verification email.
          </p>
        </div>
      )}

      {/* Message feedback */}
      {message && (
        <p className="text-xs mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
          {message}
        </p>
      )}

      {/* Resend Actions for waiting, expired, or failed states */}
      {(status === 'waiting' || status === 'expired' || status === 'failed') && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          {showResendInput ? (
            <form onSubmit={handleResendSubmit} className="space-y-3 text-left">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Enter Email to Resend:
              </label>
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="advocate@lawfirm.in"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {resendLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Send Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResendInput(false)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 text-xs cursor-pointer shadow-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowResendInput(true)}
              disabled={cooldown > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-primary hover:text-primary-hover hover:border-blue-300 text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
              </span>
            </button>
          )}

          <p className="text-[11px] text-slate-500 pt-1">
            Need help?{' '}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Return to Login
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-100 selection:text-primary">
      <Navbar mode="auth" />
      <main className="pt-24 pb-12 px-4 flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-700">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm">Loading verification details...</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MARE-Juris Legal Intelligence Platform</p>
      </footer>
    </div>
  );
}
