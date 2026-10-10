import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Ban, ShieldAlert, LogOut, Home, Mail } from 'lucide-react';

interface AccessDeniedPageProps {
  navigate: (path: string) => void;
  statusOverride?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ navigate, statusOverride }) => {
  const { user, logout } = useAuth();
  const currentStatus = statusOverride || user?.approval_status || 'rejected';
  const isSuspended = currentStatus === 'suspended';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="bg-[#0c1424] border border-rose-900/60 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle top indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-rose-500 rounded-full blur-[2px]" />

          {/* Icon */}
          <div className="inline-flex w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
            <Ban className="w-10 h-10 text-rose-500" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            {isSuspended ? 'Account Suspended' : 'Access Denied'}
          </h2>

          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
            {isSuspended
              ? 'Your account access has been temporarily suspended by an administrator. Download privileges and library exploration are currently locked.'
              : 'Your registration request has been reviewed and rejected by an administrator. You do not have permission to download protected files on DOCKWORLDWIDE.'}
          </p>

          {/* Account Profile info */}
          {user && (
            <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Account</span>
                <span className="text-white font-mono">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Policy Enforcement</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {currentStatus}
                </span>
              </div>
            </div>
          )}

          {/* Support Info */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 mb-6 text-xs text-slate-400 text-left flex items-start gap-3">
            <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">Need Assistance or an Appeal?</p>
              <p className="mt-0.5">
                If you believe this status was assigned in error, please contact your organization administrator or security lead at <span className="text-cyan-400 font-mono">support@dockworldwide.com</span>.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
