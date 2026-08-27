'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'waiting' | 'success' | 'failed' | 'expired'>('waiting');
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user?.email_confirmed_at) {
        setStatus('success');
      } else {
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');

        if (errorCode === 'otp_expired' || error?.includes('expired')) {
          setStatus('expired');
        } else if (error) {
          setStatus('failed');
        } else {
          setStatus('waiting');
        }
      }
    };

    checkVerificationStatus();
  }, [searchParams]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    const email = prompt('Enter your registered email address to resend verification link:');
    if (!email) return;

    setResendLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Verification link resent successfully! Please check your inbox.');
        setCooldown(60);
      }
    } catch (err: any) {
      setMessage('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full legal-card rounded-3xl p-8 md:p-10 border border-gold-500/20 text-center">
      {/* Header Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
          <Scale className="w-6 h-6" />
        </div>
        <span className="font-serif font-bold text-xl tracking-wide gold-gradient-text">
          MARE-Juris
        </span>
      </div>

      {/* State Rendering */}
      {status === 'success' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Email Verified</h1>
          <p className="text-sm text-slate-300">
            Your account email address has been successfully verified. You can now access your legal workspace.
          </p>
          <div className="pt-4">
            <Link
              href="/home"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>Continue to MARE-Juris</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'waiting' && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Awaiting Verification</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            We&apos;ve sent a verification link to your email address. Please click the link in your email to complete verification.
          </p>
        </div>
      )}

      {(status === 'failed' || status === 'expired') && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {status === 'expired' ? 'Verification Link Expired' : 'Verification Failed'}
          </h1>
          <p className="text-sm text-slate-300">
            {status === 'expired'
              ? 'The email verification link has expired for security reasons.'
              : 'We could not verify your email link.'}
          </p>
        </div>
      )}

      {/* Feedback message */}
      {message && (
        <p className="text-xs mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
          {message}
        </p>
      )}

      {/* Resend Action */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
        <button
          onClick={handleResend}
          disabled={resendLoading || cooldown > 0}
          className="w-full py-3 px-4 rounded-xl bg-navy-900 border border-gold-500/30 text-gold-400 hover:text-gold-300 text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          <span>
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : 'Resend Verification Email'}
          </span>
        </button>

        <p className="text-xs text-slate-400">
          Need help?{' '}
          <Link href="/login" className="text-gold-400 hover:text-gold-300">
            Return to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-navy-950 p-4 md:p-8 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold-400 mb-2" />
            <p>Loading verification details...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
