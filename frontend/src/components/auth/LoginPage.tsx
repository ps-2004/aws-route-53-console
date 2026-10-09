import React, { useState } from 'react';
import { Lock, Mail, Key, Loader2, Info, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types/route53';

interface LoginPageProps {
  onSuccess: (user: User) => void;
  showToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, showToast }) => {
  const [email, setEmail] = useState('admin@route53clone.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'root' | 'iam'>('root');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      showToast({
        type: 'success',
        title: 'Authentication successful',
        message: `Welcome back, ${data.user.name}.`,
      });
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@route53clone.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex flex-col justify-between selection:bg-[#ec7211] selection:text-white">
      {/* Top Banner */}
      <div className="bg-[#161e2e] py-3.5 px-6 flex items-center justify-between border-b border-[#2a3444]">
        <div className="flex items-center space-x-2">
          <span className="text-white font-black text-xl tracking-tight">AWS</span>
          <span className="text-[#ec7211] font-black text-2xl leading-none">.</span>
          <span className="text-[#aab7b8] text-xs font-medium ml-2 hidden sm:inline">
            Management Console
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#aab7b8] hover:text-white transition-colors"
          >
            Swagger /docs
          </a>
          <span className="text-[#414750]">|</span>
          <span className="text-[#879596] font-mono text-[11px]">Route 53 Clone v1.0</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white border border-[#eaeded] shadow-lg rounded-sm w-full max-w-md p-5 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ec7211]/10 text-[#ec7211] mb-1">
              <Lock className="w-6 h-6 text-[#ec7211]" />
            </div>
            <h1 className="text-2xl font-bold text-[#16191f] tracking-tight">Sign in</h1>
            <p className="text-xs text-[#545b64]">
              Sign in to access your Route 53 DNS hosted zones and records
            </p>
          </div>

          {/* User Type Switcher Mock */}
          <div className="flex border-b border-[#eaeded] text-xs">
            <button
              type="button"
              onClick={() => setUserType('root')}
              className={`flex-1 pb-2 font-semibold text-center border-b-2 transition-colors ${
                userType === 'root'
                  ? 'border-[#ec7211] text-[#16191f]'
                  : 'border-transparent text-[#687078] hover:text-[#16191f]'
              }`}
            >
              Root user
            </button>
            <button
              type="button"
              onClick={() => setUserType('iam')}
              className={`flex-1 pb-2 font-semibold text-center border-b-2 transition-colors ${
                userType === 'iam'
                  ? 'border-[#ec7211] text-[#16191f]'
                  : 'border-transparent text-[#687078] hover:text-[#16191f]'
              }`}
            >
              IAM user
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] border border-[#eaeded] rounded-sm text-xs text-[#d13212]">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[#16191f] font-bold">
                {userType === 'root' ? 'Root user email address' : 'IAM username or email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#879596]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@route53clone.com"
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-2 pl-9 text-xs text-[#16191f] outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[#16191f] font-bold">Password</label>
                <span className="text-[11px] text-[#0073bb] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#879596]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-2 pl-9 text-xs text-[#16191f] outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-sm bg-[#ec7211] hover:bg-[#eb5f07] font-bold text-white text-xs transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:bg-[#ec7211]/50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="bg-[#f0f7fb] border border-[#0073bb]/20 rounded p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-[#0073bb] font-bold">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Test Credentials</span>
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-[#0073bb] hover:underline flex items-center space-x-1"
              >
                <span>Auto-fill</span>
              </button>
            </div>
            <div className="text-[11px] text-[#545b64] font-mono space-y-0.5">
              <p>Email: <span className="text-[#16191f] font-bold">admin@route53clone.com</span></p>
              <p>Password: <span className="text-[#16191f] font-bold">admin123</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#687078] border-t border-[#eaeded] space-y-1">
        <div className="flex justify-center space-x-4 text-[11px]">
          <span className="hover:text-[#16191f] cursor-pointer">Privacy Notice</span>
          <span>•</span>
          <span className="hover:text-[#16191f] cursor-pointer">Terms of Use</span>
          <span>•</span>
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#0073bb]">
            API Swagger Documentation
          </a>
        </div>
        <p className="text-[10px] text-[#879596]">
          © 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved. (AWS Route 53 Experience Clone)
        </p>
      </footer>
    </div>
  );
};
