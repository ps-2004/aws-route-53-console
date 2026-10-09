'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Key, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@route53clone.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('r53_session_token', data.token);
      localStorage.setItem('r53_user', JSON.stringify(data.user));
      router.push('/hosted-zones');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col justify-between">
      <div className="bg-[#161e2e] py-3.5 px-6 flex items-center justify-between border-b border-[#2a3444]">
        <div className="flex items-center space-x-2">
          <span className="text-white font-black text-xl">AWS</span>
          <span className="text-[#ec7211] font-black text-2xl leading-none">.</span>
          <span className="text-[#aab7b8] text-xs font-medium ml-2">Management Console</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white border border-[#eaeded] shadow-lg rounded-sm w-full max-w-md p-8 space-y-6 text-xs">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ec7211]/10 text-[#ec7211]">
              <Lock className="w-6 h-6 text-[#ec7211]" />
            </div>
            <h1 className="text-2xl font-bold text-[#16191f]">Sign in</h1>
            <p className="text-[#545b64]">Access Route 53 DNS Console</p>
          </div>

          {error && (
            <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#16191f] font-bold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-2 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[#16191f] font-bold mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-2 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded-sm flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign in</span>}
            </button>
          </form>

          <div className="bg-[#f0f7fb] border border-[#0073bb]/20 p-3 rounded font-mono text-[11px] text-[#545b64]">
            <p className="font-bold text-[#0073bb] font-sans">Evaluation Credentials</p>
            <p>Email: admin@route53clone.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
