import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface PendingApprovalPageProps {
  navigate: (path: string) => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ navigate }) => {
  const { user, refreshUser, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Poll status periodically every 12 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await refreshUser();
      if (updated && updated.approval_status === 'approved') {
        navigate('/downloads');
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshUser, navigate]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setNotification(null);
    try {
      const updated = await refreshUser();
      if (!updated) {
        setNotification('Session expired. Please sign in again.');
        return;
      }

      if (updated.approval_status === 'approved') {
        navigate('/downloads');
      } else if (updated.approval_status === 'rejected' || updated.approval_status === 'suspended') {
        navigate(`/access-denied?status=${updated.approval_status}`);
      } else {
        setNotification('Account is still under review by the administrator. Please check back shortly.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Main Status Container */}
        <div className="bg-[#0c1424] border border-[#233554] rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-[2px]" />

          {/* Animated Status Icon */}
          <div className="inline-flex w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-6 shadow-lg shadow-amber-500/10">
            <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>

          {/* Headline required by user prompt */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Your account is waiting for admin approval.
          </h2>

          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
            For security reasons, file downloads on <strong className="text-white">DOCKWORLDWIDE</strong> are restricted to vetted and approved accounts. An administrator has been notified of your registration request.
          </p>

          {/* Account Profile Details */}
          {user && (
            <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 mb-6 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Account Email</span>
                <span className="text-white font-mono font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Registration Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  {user.approval_status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Registered On</span>
                <span className="text-slate-300 font-mono">
                  {new Date(user.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Feedback Notification */}
          {notification && (
            <div className="mb-6 p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verifying with Server...' : 'Check Status Now'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            Automatic background verification is enabled. This page will refresh automatically as soon as an administrator grants approval.
          </p>
        </div>
      </div>
    </div>
  );
};
