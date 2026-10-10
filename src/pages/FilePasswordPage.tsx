import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  KeyRound,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { fetchFileDetails, verifyFilePassword, downloadFileStream, formatBytes } from '../lib/api';
import { FileItem } from '../types';

interface FilePasswordPageProps {
  fileId: string;
  navigate: (path: string) => void;
}

export const FilePasswordPage: React.FC<FilePasswordPageProps> = ({ fileId, navigate }) => {
  const { isApproved, isAuthenticated } = useAuth();
  const [file, setFile] = useState<FileItem | null>(null);
  const [password, setPassword] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isApproved) {
      navigate('/pending-approval');
      return;
    }

    const load = async () => {
      setIsLoadingFile(true);
      try {
        const item = await fetchFileDetails(fileId);
        setFile(item);
      } catch (err: any) {
        setErrorMessage(err.message || 'File not found or access forbidden.');
      } finally {
        setIsLoadingFile(false);
      }
    };
    load();
  }, [fileId, isApproved, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the file password.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await verifyFilePassword(fileId, password.trim());
      if (res.success && res.downloadToken && file) {
        setIsSuccess(true);
        // Automatically start downloading with the short-lived token
        await downloadFileStream(file.id, file.original_filename, res.downloadToken);

        setTimeout(() => {
          navigate('/downloads');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect file password. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        <button
          onClick={() => navigate('/downloads')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Downloads Library</span>
        </button>

        <div className="bg-[#0c1424] border border-[#233554] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">
                Protected Resource
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">Security Password Required</h2>
            </div>
          </div>

          {/* Loading or details */}
          {isLoadingFile ? (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Retrieving file specifications...</p>
            </div>
          ) : file ? (
            <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 space-y-2">
              <h3 className="text-base font-bold text-white">{file.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{file.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80">
                <span className="text-cyan-400">{file.original_filename}</span>
                <span>{formatBytes(file.file_size)}</span>
              </div>
            </div>
          ) : null}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success display */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>Password verified! Short-lived download token authorized. Initiating stream...</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                File Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator assigned password..."
                  disabled={isVerifying || isSuccess}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || isSuccess || !file}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Password...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  Streaming Download...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Authenticate & Download
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
