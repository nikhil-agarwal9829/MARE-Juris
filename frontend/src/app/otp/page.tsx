'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Scale, Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OtpPage() {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setStep('verify');
      setCooldown(60);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Failed to send OTP code.');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste Handling
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6 && /^\d$/.test(char)) {
          newOtp[i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');

    if (token.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP passcode.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
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
      setErrorMsg('Invalid or expired OTP passcode.');
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

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {errorMsg}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Sign in with OTP</h1>
              <p className="text-sm text-slate-400 mt-1">
                Enter your email to receive a 6-digit passcode.
              </p>
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
                  placeholder="lawyer@firm.com"
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
                  <span>Send Passcode</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Enter Passcode</h1>
              <p className="text-sm text-slate-400 mt-1">
                We sent a 6-digit OTP code to <strong className="text-gold-300">{email}</strong>.
              </p>
            </div>

            {/* 6 Digit Input Group */}
            <div className="flex justify-between gap-2 my-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-navy-950/90 border border-slate-700/80 rounded-xl text-gold-300 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Passcode & Sign In</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={cooldown > 0}
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-gold-400 transition-colors"
          >
            Back to Password Login
          </Link>
        </div>
      </div>
    </main>
  );
}
