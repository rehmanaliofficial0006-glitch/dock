import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldCheck,
  HardDriveDownload,
  CheckCircle2,
} from 'lucide-react';
import { fetchAvailableFiles, downloadFileStream, formatBytes } from '../lib/api';
import { FileItem } from '../types';

interface DownloadsPageProps {
  navigate: (path: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ navigate }) => {
  const { user, isAuthenticated, isApproved, isPending, isSuspended, isRejected } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Downloading in progress tracker
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Check access gate
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isPending) {
      navigate('/pending-approval');
      return;
    }
    if (isSuspended || isRejected) {
      navigate(`/access-denied?status=${user?.approval_status}`);
      return;
    }
  }, [isAuthenticated, isPending, isSuspended, isRejected, user, navigate]);

  const loadFiles = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchAvailableFiles();
      setFiles(data);
    } catch (err: any) {
      if (err.status === 'pending' || err.code === 'ACCOUNT_PENDING') {
        navigate('/pending-approval');
        return;
      }
      if (err.status === 'suspended' || err.status === 'rejected') {
        navigate(`/access-denied?status=${err.status}`);
        return;
      }
      setErrorMessage(err.message || 'Failed to fetch downloadable files.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isApproved) {
      loadFiles();
    }
  }, [isApproved]);

  const handleDownloadClick = async (file: FileItem) => {
    setDownloadingId(file.id);
    try {
      await downloadFileStream(file.id, file.original_filename);
      // Refresh count locally
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, download_count: f.download_count + 1 } : f))
      );
    } catch (err: any) {
      alert(`Download error: ${err.message || 'Unable to download file.'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Helper for file type icons
  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-6 h-6 text-rose-400" />;
    }
    if (mimeType.includes('zip') || mimeType.includes('archive') || ext === 'zip' || ext === 'tar' || ext === 'gz') {
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    }
    if (mimeType.includes('csv') || mimeType.includes('spreadsheet') || ext === 'csv' || ext === 'xlsx') {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
    if (mimeType.includes('image') || ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) {
      return <FileImage className="w-6 h-6 text-cyan-400" />;
    }
    if (['json', 'js', 'ts', 'py', 'sh', 'html', 'css'].includes(ext || '')) {
      return <FileCode className="w-6 h-6 text-indigo-400" />;
    }
    return <File className="w-6 h-6 text-slate-400" />;
  };

  const filteredFiles = files.filter((file) => {
    return (
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Approved Session
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Available Downloads</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise assets unlocked for <span className="text-slate-200 font-medium">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Catalog</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-[#0c1424] border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file title, description, or extension..."
            className="w-full pl-10 pr-4 py-2 bg-[#070b14] border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading catalog from repository vault...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredFiles.length === 0 && (
        <div className="py-16 px-4 text-center bg-[#0c1424] border border-slate-800 rounded-3xl space-y-3">
          <HardDriveDownload className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Files Match Your Search</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search keywords.'
              : 'There are currently no active files available for download.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-semibold text-cyan-400 hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Files Grid */}
      {!isLoading && filteredFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => {
            const isDownloading = downloadingId === file.id;

            return (
              <div
                key={file.id}
                className="bg-[#0c1424] border border-[#1e293b] hover:border-[#2b3d5b] rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-200 group relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {getFileIcon(file.file_type, file.original_filename)}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    DIRECT DOWNLOAD
                  </span>
                </div>

                {/* File Details */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                    {file.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {file.description || 'Enterprise asset available for authorized download.'}
                  </p>
                </div>

                {/* File Specs & Download CTA */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="truncate max-w-[150px] text-slate-300">{file.original_filename}</span>
                    <span className="text-cyan-400 font-semibold">{formatBytes(file.file_size)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Downloads: {file.download_count}</span>
                    <span>Uploaded: {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Direct Download Button */}
                  <button
                    onClick={() => handleDownloadClick(file)}
                    disabled={isDownloading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Streaming File...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
