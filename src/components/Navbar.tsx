import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  HardDriveDownload,
  LayoutDashboard,
  Lock,
  LogOut,
  User,
  Menu,
  X,
  Clock,
  Ban,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, isAuthenticated, isAdmin, isApproved, isPending, isSuspended, isRejected, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('/')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#070b14] rounded-[7px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-xl text-white block leading-tight font-mono">
                DOCK<span className="text-cyan-400">WORLDWIDE</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">
                Secure File Gateway
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => handleNav('/')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPath === '/'
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Home
            </button>

            {/* Downloads is visible to all, but requires approval when clicked */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  handleNav('/login');
                } else if (isPending) {
                  handleNav('/pending-approval');
                } else if (isSuspended || isRejected) {
                  handleNav(`/access-denied?status=${user?.approval_status}`);
                } else {
                  handleNav('/downloads');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                currentPath === '/downloads'
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <HardDriveDownload className="w-4 h-4 text-cyan-400" />
              Downloads
            </button>

            {isApproved && (
              <button
                onClick={() => handleNav('/dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  currentPath === '/dashboard'
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                Dashboard
              </button>
            )}

            <button
              onClick={() => handleNav(isAdmin ? '/admin' : '/admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                currentPath.startsWith('/admin')
                  ? 'text-purple-400 bg-purple-950/40 border border-purple-800/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-4 h-4 text-purple-400" />
              Admin Portal
            </button>
          </nav>

          {/* User Status & Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-slate-600 transition-colors"
                >
                  {/* Status Indicator */}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      ADMIN
                    </span>
                  )}
                  {isApproved && !isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> APPROVED
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3 h-3 animate-pulse" /> PENDING
                    </span>
                  )}
                  {(isSuspended || isRejected) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <Ban className="w-3 h-3" /> {user.approval_status.toUpperCase()}
                    </span>
                  )}

                  <span className="text-sm font-medium text-slate-200 max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0d1527] border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      <p className="text-xs text-cyan-400 font-mono mt-0.5 capitalize">
                        Role: {user.role} • Status: {user.approval_status}
                      </p>
                    </div>

                    {isApproved && (
                      <button
                        onClick={() => handleNav('/dashboard')}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        My Dashboard
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full text-left px-4 py-2 text-sm text-purple-300 hover:bg-slate-800/80 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Admin Control Center
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleNav('/pending-approval')}
                        className="w-full text-left px-4 py-2 text-sm text-amber-300 hover:bg-slate-800/80 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Approval Status Page
                      </button>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('/signup')}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-500/20 transition-all"
                >
                  Request Access
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#070b14] px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => handleNav('/')}
            className="w-full text-left py-2 px-3 rounded-md text-slate-300 hover:bg-slate-800/60 font-medium"
          >
            Home
          </button>
          <button
            onClick={() => handleNav(isAuthenticated ? '/downloads' : '/login')}
            className="w-full text-left py-2 px-3 rounded-md text-slate-300 hover:bg-slate-800/60 font-medium flex items-center gap-2"
          >
            <HardDriveDownload className="w-4 h-4 text-cyan-400" />
            Downloads
          </button>
          {isApproved && (
            <button
              onClick={() => handleNav('/dashboard')}
              className="w-full text-left py-2 px-3 rounded-md text-slate-300 hover:bg-slate-800/60 font-medium flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Dashboard
            </button>
          )}
          <button
            onClick={() => handleNav('/admin')}
            className="w-full text-left py-2 px-3 rounded-md text-purple-300 hover:bg-slate-800/60 font-medium flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Admin Portal
          </button>

          <div className="pt-3 border-t border-slate-800">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 bg-slate-900 rounded-lg">
                  <p className="text-xs text-slate-400">Signed in as:</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  <p className="text-xs text-cyan-400 uppercase font-mono mt-0.5">Status: {user.approval_status}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 rounded-md text-rose-400 hover:bg-rose-500/10 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2 text-center rounded-lg bg-slate-800 text-slate-200 font-semibold text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('/signup')}
                  className="w-full py-2 text-center rounded-lg bg-cyan-600 text-white font-semibold text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
