'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Scale, LogOut, Menu, X, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  userName?: string | null;
  userEmail?: string | null;
  mode?: 'auth' | 'home';
}

export const Navbar: React.FC<NavbarProps> = ({ userName, mode = 'home' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link href={userName ? '/' : '/login'} className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-primary group-hover:border-primary transition-colors">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg md:text-xl tracking-wide text-primary">
              MARE-Juris
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold hidden sm:inline-block">
              Legal Intelligence
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links (Home Mode) */}
        {mode === 'home' && (
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link
              href="/"
              className={`hover:text-blue-600 transition-colors ${pathname === '/' ? 'text-primary font-bold' : ''}`}
            >
              Home
            </Link>
            <Link
              href="/ask-juris"
              className={`hover:text-blue-600 transition-colors ${pathname === '/ask-juris' ? 'text-primary font-bold' : ''}`}
            >
              Ask MARE-Juris
            </Link>
            <Link
              href="/literacy"
              className={`hover:text-blue-600 transition-colors ${pathname === '/literacy' ? 'text-primary font-bold' : ''}`}
            >
              Legal Literacy
            </Link>
            <Link
              href="/compliance"
              className={`hover:text-blue-600 transition-colors ${pathname === '/compliance' ? 'text-primary font-bold' : ''}`}
            >
              Compliance Agent
            </Link>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {mode === 'home' && userName ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-slate-800 font-medium max-w-[140px] truncate">{userName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {pathname !== '/login' && (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-primary hover:text-blue-600 hover:border-blue-200 text-xs font-semibold transition-all"
                >
                  Sign In
                </Link>
              )}
              {pathname !== '/signup' && (
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 pb-2">
          {mode === 'home' ? (
            <>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 text-xs font-semibold ${pathname === '/' ? 'text-primary font-bold' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Home
              </Link>
              <Link
                href="/ask-juris"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 text-xs font-semibold ${pathname === '/ask-juris' ? 'text-primary font-bold' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Ask MARE-Juris
              </Link>
              <Link
                href="/literacy"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 text-xs font-semibold ${pathname === '/literacy' ? 'text-primary font-bold' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Legal Literacy
              </Link>
              <Link
                href="/compliance"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 text-xs font-semibold ${pathname === '/compliance' ? 'text-primary font-bold' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Compliance Agent
              </Link>
              {userName && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-3">
                  <span className="text-xs text-primary font-semibold">{userName}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-red-600 font-semibold flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 p-2">
              <Link
                href="/login"
                className="block text-center py-2 rounded-xl bg-white border border-slate-200 text-primary text-xs font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block text-center py-2 rounded-xl bg-primary text-white text-xs font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
