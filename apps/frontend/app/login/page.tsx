'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authClient } from '@/auth-client';

// eslint-disable-next-line no-undef
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

const STORAGE_KEY = 'anvara_last_login';

interface StoredLogin {
  email: string;
  password: string;
  role: 'sponsor' | 'publisher';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasStoredLogin, setHasStoredLogin] = useState(false);
  const [storedRole, setStoredRole] = useState<'sponsor' | 'publisher' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const loginData: StoredLogin = JSON.parse(stored);
        // Use setTimeout to avoid synchronous setState in effect
        const timer = setTimeout(() => {
          setEmail(loginData.email);
          setPassword(loginData.password);
          setStoredRole(loginData.role);
          setHasStoredLogin(true);
        }, 0);
        return () => clearTimeout(timer);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveLoginInfo = (email: string, password: string, role: 'sponsor' | 'publisher') => {
    const loginData: StoredLogin = { email, password, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loginData));
    setHasStoredLogin(true);
    setStoredRole(role);
  };

  const performLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          try {
            const userId = ctx.data?.user?.id;
            if (userId) {
              const roleRes = await fetch(`${API_URL}/api/auth/role/${userId}`);
              const roleData = await roleRes.json();
              const role = roleData.role === 'sponsor' ? 'sponsor' : 'publisher';

              saveLoginInfo(email, password, role);

              if (roleData.role === 'sponsor') {
                router.push('/dashboard/sponsor');
              } else if (roleData.role === 'publisher') {
                router.push('/dashboard/publisher');
              } else {
                router.push('/');
              }
            } else {
              router.push('/');
            }
          } catch {
            router.push('/');
          }
        },
        onError: (ctx) => {
          setError(ctx.error.message || 'Login failed');
          setLoading(false);
        },
      }
    );

    if (signInError) {
      setError(signInError.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const quickLogin = async (role: 'sponsor' | 'publisher') => {
    const quickEmail = role === 'sponsor' ? 'sponsor@example.com' : 'publisher@example.com';
    const quickPassword = 'password';

    if (hasStoredLogin && storedRole === role) {
      setEmail(quickEmail);
      setPassword(quickPassword);
      await performLogin(quickEmail, quickPassword);
    } else {
      setEmail(quickEmail);
      setPassword(quickPassword);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-background]">
      <div className="w-full max-w-md rounded-lg border border-[--color-border] p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">Login to Anvara</h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[--color-foreground]">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-[--color-border] bg-white px-3 py-2 text-gray-900"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[--color-foreground]">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-[--color-border] bg-white px-3 py-2 text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[--color-primary] px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-center text-sm text-[--color-muted]">Quick Login As</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => quickLogin('sponsor')}
              disabled={loading}
              className={`flex-1 rounded border border-[--color-border] px-3 py-2 text-sm transition-colors ${
                hasStoredLogin && storedRole === 'sponsor'
                  ? 'bg-blue-50 border-blue-300 font-medium'
                  : 'hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {hasStoredLogin && storedRole === 'sponsor' ? '✓ Sponsor' : 'Sponsor'}
            </button>
            <button
              type="button"
              onClick={() => quickLogin('publisher')}
              disabled={loading}
              className={`flex-1 rounded border border-[--color-border] px-3 py-2 text-sm transition-colors ${
                hasStoredLogin && storedRole === 'publisher'
                  ? 'bg-blue-50 border-blue-300 font-medium'
                  : 'hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {hasStoredLogin && storedRole === 'publisher' ? '✓ Publisher' : 'Publisher'}
            </button>
          </div>
          {hasStoredLogin ? (
            <p className="mt-2 text-center text-xs text-[--color-muted]">
              Click to login with saved credentials
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-[--color-muted]">
              Demo: sponsor@example.com / publisher@example.com (password: password)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
