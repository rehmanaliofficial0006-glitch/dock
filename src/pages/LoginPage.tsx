import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(cleanEmail);
      // Route appropriately according to approval status
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else if (res.user.approval_status === 'approved') {
        navigate('/downloads');
      } else if (res.user.approval_status === 'pending') {
        navigate('/pending-approval');
      } else {
        navigate(`/access-denied?status=${res.user.approval_status}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand / Title Header */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-xl shadow-cyan-600/20 mb-4 items-center justify-center">
            <div className="w-full h-full bg-[#070b14] rounded-[14px] flex items-center justify-center">
              <Mail className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Portal Sign In</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email to access the <span className="font-semibold text-slate-200">DOCKWORLDWIDE</span> repository
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#0c1424] border border-[#1e293b] rounded-2xl p-7 shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field Only */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking Account Status...
                </>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Links Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3 text-center">
            <p className="text-xs text-slate-400">
              Need access?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-semibold text-cyan-400 hover:text-cyan-300 ml-1 underline cursor-pointer"
              >
                Request an account here
              </button>
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors py-1 px-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
