import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  HardDriveDownload,
  KeyRound,
  FileCheck2,
  Users,
  Server,
  ArrowRight,
  ShieldAlert,
  FolderLock,
  ChevronRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { isAuthenticated, isApproved, isPending, isAdmin } = useAuth();

  const handlePortalEntry = () => {
    if (!isAuthenticated) {
      navigate('/signup');
    } else if (isAdmin) {
      navigate('/admin');
    } else if (isApproved) {
      navigate('/downloads');
    } else if (isPending) {
      navigate('/pending-approval');
    } else {
      navigate('/access-denied');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 text-center overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/15 to-indigo-600/15 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4">
          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-400 mb-6 shadow-md shadow-cyan-950/40">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>ENTERPRISE AIR-GAPPED VERIFICATION GATEWAY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Confidential File Transfer & Controlled Download Portal
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            <strong className="text-white font-semibold">DOCKWORLDWIDE</strong> provides protected, high-assurance digital delivery. Accounts require strict administrator approval, and sensitive downloads are defended with single-use expiring cryptographic tokens.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePortalEntry}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>
                {isAuthenticated ? (isApproved ? 'Open File Library' : 'View Account Status') : 'Request Access (Sign Up)'}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate(isAuthenticated ? '/downloads' : '/login')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>{isAuthenticated ? 'Browse Files' : 'Sign In with Existing Account'}</span>
            </button>
          </div>

          {/* Live Status Ticker */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="bg-[#0b1222]/80 border border-slate-800/80 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono block">Access Policy</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Admin Approval Req.
              </span>
            </div>
            <div className="bg-[#0b1222]/80 border border-slate-800/80 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono block">Storage Vault</span>
              <span className="text-sm font-bold text-cyan-400 flex items-center gap-1 mt-1">
                <FolderLock className="w-4 h-4" />
                Private Non-Public
              </span>
            </div>
            <div className="bg-[#0b1222]/80 border border-slate-800/80 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono block">Direct Delivery</span>
              <span className="text-sm font-bold text-indigo-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                Approved Stream
              </span>
            </div>
            <div className="bg-[#0b1222]/80 border border-slate-800/80 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono block">Audit Logging</span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-1">
                <Activity className="w-4 h-4" />
                100% Download Audit
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 4 Stage Protocol */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-cyan-400 mb-2">
            STRICT SECURITY LIFECYCLE
          </h2>
          <h3 className="text-3xl font-extrabold text-white">How DOCKWORLDWIDE Protects Confidential Assets</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-[#0c1424] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-cyan-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-white mb-2">1. Email Registration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              New members submit their email address. Accounts are registered immediately into a strictly locked <code className="text-cyan-400">pending</code> status.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0c1424] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-amber-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-bold mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-white mb-2">2. Administrator Vetting</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              DOCKWORLDWIDE administrators review incoming requests in the private panel. Accounts can be Approved, Rejected, or Suspended at any time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0c1424] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono font-bold mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-white mb-2">3. File Library Access</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only verified approved users may inspect available file cards, metadata, file sizes, and descriptions. Unapproved requests are rejected at the API tier.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[#0c1424] border border-[#1e293b] rounded-2xl p-6 relative group hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-bold mb-4">
              04
            </div>
            <h4 className="text-base font-bold text-white mb-2">4. Secured Download Delivery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approved accounts enjoy direct, high-throughput downloads delivered securely from private server storage.
            </p>
          </div>
        </div>
      </section>

      {/* Security Architecture Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-[#0e172a] to-[#070b14] border border-[#202f4a] rounded-3xl p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Core Security Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Engineered with Enterprise-Grade Anti-Breach Measures
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Unlike generic public file hosts, DOCKWORLDWIDE prevents URL guessing, enforces server-side authentication on every packet, and logs all transactional access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#070b14]/90 p-5 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <FolderLock className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-1.5">Private Server Isolation</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files are kept in an isolated storage directory outside public web server roots. Permanent direct URLs do not exist.
              </p>
            </div>

            <div className="bg-[#070b14]/90 p-5 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-1.5">Zero-Trust Access Control</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every request is authenticated and verified against current administrator clearance before file streaming starts.
              </p>
            </div>

            <div className="bg-[#070b14]/90 p-5 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h5 className="text-base font-bold text-white mb-1.5">Adaptive Rate Limiting</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated rate limiters monitor login and password attempts, shutting down automated credential stuffing and brute force attacks.
              </p>
            </div>
          </div>

          {/* Direct Navigation Links for testing and evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>DOCKWORLDWIDE Node Cluster v4.2 • Dedicated Server Storage</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                Go to Admin Portal <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
