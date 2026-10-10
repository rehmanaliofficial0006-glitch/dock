import React, { useState } from 'react';
import { Lock, KeyRound, AlertTriangle, CheckCircle, Loader2, X, Download } from 'lucide-react';
import { verifyFilePassword, downloadFileStream, formatBytes } from '../lib/api';
import { FileItem } from '../types';

interface PasswordModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ file, isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the security password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Validate password securely on backend
      const res = await verifyFilePassword(file.id, password.trim());

      if (res.success && res.downloadToken) {
        setIsSuccess(true);

        // 2. Automatically trigger secure stream download with temporary token
        await downloadFileStream(file.id, file.original_filename, res.downloadToken);

        if (onSuccess) onSuccess();

        // Close modal after brief success cue
        setTimeout(() => {
          setIsSuccess(false);
          setPassword('');
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setIsSuccess(false);
      // Prompt requirement: "If the password is incorrect, display 'Incorrect file password. Please try again.'"
      const message = err.message || 'Incorrect file password. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMessage(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c1424] border border-[#233554] rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-snug">Password Protected File</h3>
            <p className="text-xs text-slate-400">Authentication required to decrypt download token</p>
          </div>
        </div>

        {/* File Quick Summary Card */}
        <div className="bg-[#070b14] border border-slate-800 rounded-xl p-3.5 mb-5 space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target File</p>
          <p className="text-sm font-semibold text-white truncate">{file.title}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
            <span className="text-cyan-400">{file.original_filename}</span>
            <span>•</span>
            <span>{formatBytes(file.file_size)}</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>Password verified! Downloading file now...</div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Enter File Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password configured by admin..."
                disabled={isLoading || isSuccess}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Upon correct verification, a short-lived authorization token is generated to securely stream your file without exposing permanent storage paths.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  Authorized
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Verify & Download
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
