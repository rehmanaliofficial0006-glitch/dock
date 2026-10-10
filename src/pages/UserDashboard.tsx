import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  HardDriveDownload,
  FileCheck2,
  ArrowRight,
  CheckCircle,
  FileText,
  Layers,
} from 'lucide-react';
import { fetchAvailableFiles, formatBytes } from '../lib/api';
import { FileItem } from '../types';

interface UserDashboardProps {
  navigate: (path: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ navigate }) => {
  const { user, isApproved } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isApproved) {
      fetchAvailableFiles()
        .then((data) => setFiles(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isApproved]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-[#0c1424] via-[#111e38] to-[#0c1424] border border-[#233554] rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>ACCOUNT STATUS: APPROVED</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome to DOCKWORLDWIDE
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your identity <strong className="text-white font-mono">{user?.email}</strong> has received active clearance from portal administrators. You have complete authorization to inspect and download assets from the repository.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/downloads')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Browse File Downloads</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0c1424] border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Cataloged Files</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{files.length}</p>
          <p className="text-xs text-slate-500 mt-1">Available in secure vault</p>
        </div>

        <div className="bg-[#0c1424] border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Direct Downloads</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-mono">{files.length}</p>
          <p className="text-xs text-slate-500 mt-1">Available for direct download</p>
        </div>

        <div className="bg-[#0c1424] border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Access Clearance</span>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-base font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
            VERIFIED
          </p>
          <p className="text-xs text-slate-500 mt-1">Full portal privileges</p>
        </div>

        <div className="bg-[#0c1424] border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Session Security</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE CLEARANCE
          </p>
          <p className="text-xs text-slate-500 mt-1">Monitored & Rate-Protected</p>
        </div>
      </div>

      {/* Featured Files Quick List */}
      <div className="bg-[#0c1424] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recently Cataloged Assets</h2>
            <p className="text-xs text-slate-400">Directly accessible through your approved session</p>
          </div>
          <button
            onClick={() => navigate('/downloads')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {files.slice(0, 3).map((f) => (
            <div
              key={f.id}
              className="bg-[#070b14] border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{f.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>{f.original_filename}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{formatBytes(f.file_size)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/downloads')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0 ml-4 cursor-pointer"
              >
                Go to File
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
