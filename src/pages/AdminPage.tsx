import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  HardDriveDownload,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
  Edit,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  File,
  Layers,
  Activity,
  Check,
  ChevronDown,
  X,
  Eye,
  Replace,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminUserStatus,
  deleteAdminUser,
  fetchAdminFiles,
  uploadAdminFile,
  updateAdminFile,
  replaceAdminFile,
  deleteAdminFile,
  fetchAdminLogs,
  formatBytes,
} from '../lib/api';
import { User, FileItem, DownloadLog, AdminStats } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { AdminLoginPage } from './AdminLoginPage';

interface AdminPageProps {
  navigate: (path: string) => void;
}

const AdminDashboardContent: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'files' | 'logs'>('overview');

  // Stats state
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    suspendedUsers: 0,
    totalFiles: 0,
    totalDownloads: 0,
  });

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersLoading, setUsersLoading] = useState(false);

  // Files state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<DownloadLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // File Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsActive, setUploadIsActive] = useState(true);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // File Edit Modal state
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Replace File Modal state
  const [replacingFile, setReplacingFile] = useState<FileItem | null>(null);
  const [replaceFileObj, setReplaceFileObj] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
    }
  };

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await fetchAdminUsers(userSearch, userStatusFilter);
      setUsers(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Load files
  const loadFiles = async () => {
    setFilesLoading(true);
    try {
      const data = await fetchAdminFiles();
      setFiles(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load files.');
    } finally {
      setFilesLoading(false);
    }
  };

  // Load logs
  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await fetchAdminLogs();
      setLogs(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load activity logs.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (activeTab === 'overview') {
      loadStats();
      loadUsers();
      loadFiles();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'files') {
      loadFiles();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, userStatusFilter]);

  // Handle User Status Change (Approve, Reject, Suspend, Pending)
  const handleUserStatusUpdate = async (userId: string, newStatus: User['approval_status']) => {
    try {
      await updateAdminUserStatus(userId, newStatus);
      showToast(`User status updated to ${newStatus.toUpperCase()}`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user status.');
    }
  };

  // Handle User Delete
  const handleUserDelete = (userItem: User) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the account for "${userItem.email}"? This action cannot be undone.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteAdminUser(userItem.id);
          showToast('User account successfully deleted.');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadUsers();
          loadStats();
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to delete user.');
        }
      },
    });
  };

  // Handle File Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileObj) {
      setErrorMessage('Please select a file to upload from your device.');
      return;
    }
    if (!uploadTitle.trim()) {
      setErrorMessage('Please provide a title for the file.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', uploadFileObj);
    formData.append('title', uploadTitle.trim());
    formData.append('description', uploadDescription.trim());
    formData.append('is_active', String(uploadIsActive));

    try {
      await uploadAdminFile(formData);
      showToast('File successfully uploaded to private storage.');
      setIsUploadModalOpen(false);
      // Reset form
      setUploadTitle('');
      setUploadDescription('');
      setUploadFileObj(null);
      setUploadIsActive(true);
      loadFiles();
      loadStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Edit
  const openEditModal = (file: FileItem) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditDescription(file.description);
    setEditIsActive(file.is_active !== false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    setIsSavingEdit(true);
    try {
      await updateAdminFile(editingFile.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        is_active: editIsActive,
      });
      showToast('File metadata updated successfully.');
      setEditingFile(null);
      loadFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update file.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle File Replace
  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingFile || !replaceFileObj) return;

    setIsReplacing(true);
    const formData = new FormData();
    formData.append('file', replaceFileObj);

    try {
      await replaceAdminFile(replacingFile.id, formData);
      showToast('File binary replaced with newer version.');
      setReplacingFile(null);
      setReplaceFileObj(null);
      loadFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to replace file.');
    } finally {
      setIsReplacing(false);
    }
  };

  // Handle File Delete
  const handleFileDelete = (file: FileItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete File from Storage',
      message: `Permanently delete "${file.title}" (${file.original_filename})? The physical file will be unlinked from private storage and users will lose access.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteAdminFile(file.id);
          showToast('File permanently deleted.');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadFiles();
          loadStats();
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to delete file.');
        }
      },
    });
  };

  // Render Status Badge
  const renderStatusBadge = (status: User['approval_status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3 animate-pulse" /> PENDING
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Ban className="w-3 h-3" /> SUSPENDED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-100 text-sm shadow-2xl flex items-center gap-2.5 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              RESTRICTED ROOT ADMINISTRATOR
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Governance console for <span className="text-white font-mono">DOCKWORLDWIDE</span> user approvals and secure file storage
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New File</span>
          </button>
          <button
            onClick={() => {
              loadStats();
              if (activeTab === 'users') loadUsers();
              if (activeTab === 'files') loadFiles();
              if (activeTab === 'logs') loadLogs();
            }}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Dashboard & Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Approvals ({stats.pendingUsers > 0 ? `${stats.pendingUsers} Pending` : stats.totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'files'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardDriveDownload className="w-4 h-4" />
          <span>File Management ({stats.totalFiles})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Download Audit Logs</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW & STATISTICS ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Required Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-[#0c1424] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Registered Users</span>
              <p className="text-2xl font-extrabold text-white font-mono mt-1">{stats.totalUsers}</p>
            </div>

            <div className="bg-[#0c1424] border border-amber-500/40 p-4 rounded-2xl relative">
              <span className="text-[11px] font-mono text-amber-300 uppercase font-semibold">Pending Requests</span>
              <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{stats.pendingUsers}</p>
              {stats.pendingUsers > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </div>

            <div className="bg-[#0c1424] border border-emerald-500/40 p-4 rounded-2xl">
              <span className="text-[11px] font-mono text-emerald-300 uppercase font-semibold">Approved Users</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{stats.approvedUsers}</p>
            </div>

            <div className="bg-[#0c1424] border border-rose-500/40 p-4 rounded-2xl">
              <span className="text-[11px] font-mono text-rose-300 uppercase font-semibold">Rejected Users</span>
              <p className="text-2xl font-extrabold text-rose-400 font-mono mt-1">{stats.rejectedUsers}</p>
            </div>

            <div className="bg-[#0c1424] border border-cyan-500/40 p-4 rounded-2xl">
              <span className="text-[11px] font-mono text-cyan-300 uppercase font-semibold">Uploaded Files</span>
              <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">{stats.totalFiles}</p>
            </div>

            <div className="bg-[#0c1424] border border-indigo-500/40 p-4 rounded-2xl">
              <span className="text-[11px] font-mono text-indigo-300 uppercase font-semibold">Total Downloads</span>
              <p className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">{stats.totalDownloads}</p>
            </div>
          </div>

          {/* Quick Pending Review Banner */}
          {stats.pendingUsers > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    Action Needed: {stats.pendingUsers} account{stats.pendingUsers > 1 ? 's are' : ' is'} waiting for approval
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    Pending users cannot download any files until you review and grant authorization.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserStatusFilter('pending');
                  setActiveTab('users');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Review Pending Users
              </button>
            </div>
          )}

          {/* Dual Quick Tables: Recent Users & Recent Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Registrations */}
            <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Recent User Registrations
                </h3>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">{u.email}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(u.approval_status)}
                      {u.approval_status === 'pending' && (
                        <button
                          onClick={() => handleUserStatusUpdate(u.id, 'approved')}
                          className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cataloged Files Quick View */}
            <div className="bg-[#0c1424] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-cyan-400" />
                  Active Files in Vault
                </h3>
                <button
                  onClick={() => setActiveTab('files')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Manage Files
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {files.slice(0, 5).map((f) => (
                  <div key={f.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[220px]">{f.title}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatBytes(f.file_size)} • {f.download_count} downloads
                      </p>
                    </div>
                    <div>
                      {f.is_password_protected ? (
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Password
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Direct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USER MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c1424] p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="Search user accounts by email..."
                className="w-full pl-10 pr-4 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'pending', 'approved', 'rejected', 'suspended'].map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setUserStatusFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 ${
                    userStatusFilter === statusKey
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {statusKey}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">User Email</th>
                    <th className="px-5 py-3.5">Registration Date</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-center">One-Click Decision</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No registered users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white">
                          <span className="font-mono">{u.email}</span>
                          {u.role === 'admin' && (
                            <span className="ml-2 text-[10px] text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">
                              ROOT
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-400">
                          {new Date(u.created_at).toLocaleString()}
                        </td>

                        <td className="px-5 py-3.5">
                          {renderStatusBadge(u.approval_status)}
                        </td>

                        {/* One-Click Approval / Rejection Buttons */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {u.approval_status !== 'approved' && (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'approved')}
                                className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Approve User"
                              >
                                Approve
                              </button>
                            )}

                            {u.approval_status !== 'rejected' && (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'rejected')}
                                className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Reject User"
                              >
                                Reject
                              </button>
                            )}

                            {u.approval_status !== 'suspended' && u.approval_status === 'approved' && (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'suspended')}
                                className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Suspend Account"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Full Action Dropdown & Delete */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Change status select */}
                            <select
                              value={u.approval_status}
                              onChange={(e) =>
                                handleUserStatusUpdate(u.id, e.target.value as User['approval_status'])
                              }
                              className="bg-[#070b14] border border-slate-700 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="suspended">Suspended</option>
                            </select>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleUserDelete(u)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: FILE MANAGEMENT ================= */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c1424] p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Private Repository Storage</h3>
              <p className="text-xs text-slate-400">
                Encrypted binary storage isolated from web root. Downloads gated by user approval.
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>

          {/* Files Table (Title, File type, Upload date, Password protection status, Download count, Actions) */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Title & Filename</th>
                    <th className="px-5 py-3.5">Type & Size</th>
                    <th className="px-5 py-3.5">Upload Date</th>
                    <th className="px-5 py-3.5">Access Policy</th>
                    <th className="px-5 py-3.5 text-center">Downloads</th>
                    <th className="px-5 py-3.5 text-center">Availability</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {filesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                        Loading files...
                      </td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No files in storage vault. Click "Upload New File" to add files.
                      </td>
                    </tr>
                  ) : (
                    files.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-white truncate max-w-[240px]">{f.title}</p>
                          <p className="font-mono text-[11px] text-cyan-400/80 truncate max-w-[240px]">
                            {f.original_filename}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-300">
                          <div>{f.file_type}</div>
                          <div className="text-slate-500">{formatBytes(f.file_size)}</div>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-400">
                          {new Date(f.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            APPROVED USERS
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center font-mono font-bold text-white">
                          {f.download_count}
                        </td>

                        {/* Availability Toggle */}
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={async () => {
                              try {
                                await updateAdminFile(f.id, { is_active: !f.is_active });
                                showToast(`File ${!f.is_active ? 'enabled' : 'disabled'}`);
                                loadFiles();
                              } catch (err: any) {
                                setErrorMessage(err.message);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              f.is_active !== false
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {f.is_active !== false ? 'ACTIVE' : 'DISABLED'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Details */}
                            <button
                              onClick={() => openEditModal(f)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                              title="Edit Details & Password"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Replace File Binary */}
                            <button
                              onClick={() => {
                                setReplacingFile(f);
                                setReplaceFileObj(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                              title="Replace File Version"
                            >
                              <Replace className="w-4 h-4" />
                            </button>

                            {/* Delete File */}
                            <button
                              onClick={() => handleFileDelete(f)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: AUDIT LOGS ================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-[#0c1424] p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white">Cryptographic Download Activity Audit</h3>
            <p className="text-xs text-slate-400">
              Immutable ledger of authorized downloads, recipient identities, and delivery timestamps.
            </p>
          </div>

          <div className="bg-[#0c1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070b14] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Downloaded Asset</th>
                    <th className="px-5 py-3.5">Authorized User Email</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                        Loading activity logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500">
                        No downloads have been recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {log.file_title}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-cyan-300">
                          {log.user_email}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">
                          {new Date(log.downloaded_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD FILE ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0c1424] border border-[#233554] rounded-3xl shadow-2xl p-7 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload File to Private Vault</h3>
                <p className="text-xs text-slate-400">Stores file securely on server; configure access rules</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Choose File from Computer or Mobile
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    setUploadFileObj(picked);
                    if (picked && !uploadTitle) {
                      setUploadTitle(picked.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer bg-[#070b14] border border-slate-700 rounded-xl p-2"
                />
                {uploadFileObj && (
                  <p className="text-[11px] text-cyan-400 mt-1 font-mono">
                    Selected: {uploadFileObj.name} ({formatBytes(uploadFileObj.size)})
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  File Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Enterprise Client SDK v2.8"
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  File Description
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Details regarding purpose, contents, or release notes..."
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="uploadIsActive"
                  checked={uploadIsActive}
                  onChange={(e) => setUploadIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-700 bg-slate-900"
                />
                <label htmlFor="uploadIsActive" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Make available for download immediately
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving to Storage...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT FILE ================= */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0c1424] border border-[#233554] rounded-3xl shadow-2xl p-7 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingFile(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit File Details</h3>
                <p className="text-xs text-slate-400 font-mono">{editingFile.original_filename}</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-900"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Available in download library
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPLACE FILE ================= */}
      {replacingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0c1424] border border-[#233554] rounded-3xl shadow-2xl p-7 text-slate-100">
            <button
              onClick={() => setReplacingFile(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Replace className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Replace File Binary</h3>
                <p className="text-xs text-slate-400">Upload replacement file version</p>
              </div>
            </div>

            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-3 mb-4 text-xs font-mono text-slate-400 space-y-1">
              <div>Target: <span className="text-white font-semibold">{replacingFile.title}</span></div>
              <div>Current File: <span className="text-cyan-400">{replacingFile.original_filename}</span></div>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Replacement File
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setReplaceFileObj(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-[#070b14] border border-slate-700 rounded-xl p-2"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReplacingFile(null)}
                  disabled={isReplacing}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replaceFileObj}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isReplacing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Replacing File...
                    </>
                  ) : (
                    'Confirm Replacement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return <AdminLoginPage navigate={navigate} />;
  }

  return <AdminDashboardContent navigate={navigate} />;
};

