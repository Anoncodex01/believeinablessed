'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const heroImage =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=1400&fit=crop&auto=format';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const initialMode = searchParams.get('type') === 'affiliate' ? 'affiliate' : 'customer';

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name || 'there'}!`);

      if (redirect) {
        router.push(redirect);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'affiliate' || user.role === 'affiliate_pending') {
        router.push('/affiliate/dashboard');
      } else {
        router.push('/orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] pb-20 pt-16 md:pb-0">
      <Navbar />

      <div className="home-shell grid min-h-[calc(100vh-4rem)] items-stretch gap-0 py-8 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        {/* Left — brand panel (desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden overflow-hidden bg-stone-900 lg:block"
        >
          <Image
            src={heroImage}
            alt="BelieveinaBlessed"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <p className="mb-4 font-display text-sm font-semibold tracking-[0.28em] text-white/85 uppercase">
              BelieveinaBlessed
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Sign in to your account
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Shop, track orders, or manage your affiliate dashboard — all in one place.
            </p>
          </div>
        </motion.div>

        {/* Right — form */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <p className="section-kicker">Account</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {mode === 'affiliate' ? 'Affiliate login' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {mode === 'affiliate'
                  ? 'Access your dashboard and earnings.'
                  : 'Sign in to shop and track your orders.'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="mb-6 flex border border-[var(--border)] p-1">
              {[
                { id: 'customer', label: 'Customer' },
                { id: 'affiliate', label: 'Affiliate' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`flex-1 py-2.5 text-sm font-medium tracking-tight transition ${
                    mode === item.id
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleLogin}
              className="border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="input"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      className="input pr-11"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition hover:text-[var(--text)]"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-neutral-950 py-3.5 text-sm font-semibold tracking-tight text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link
                href={
                  redirect
                    ? `/auth/register?redirect=${encodeURIComponent(redirect)}`
                    : mode === 'affiliate'
                    ? '/auth/register?type=affiliate'
                    : '/auth/register'
                }
                className="font-semibold text-neutral-950 transition hover:opacity-70 dark:text-white"
              >
                Create one
              </Link>
            </p>

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
              <Link
                href="/products"
                className="text-sm font-medium tracking-tight text-[var(--text-secondary)] transition hover:text-neutral-950"
              >
                Continue shopping without an account →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
          <div className="font-display text-sm tracking-[0.2em] text-[var(--text-secondary)] uppercase">
            Loading
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
