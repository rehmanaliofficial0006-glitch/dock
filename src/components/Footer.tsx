import React from 'react';
import { Shield, Lock, Server, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050810] border-t border-[#182338] text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">
                DOCK<span className="text-cyan-400">WORLDWIDE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              DOCKWORLDWIDE is an enterprise file delivery and access governance platform. All downloads are protected by real-time role-based access control, cryptographic verification, and strict administrator approval protocols.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Node Cluster Active
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" /> AES-256 Storage
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-indigo-400" /> SLA 99.99%
              </span>
            </div>
          </div>

          {/* Compliance & Standards */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Security Standards</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                Zero-Trust Account Approval
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                Bcrypt Salted Key Hashing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                Single-Use Expiring Tokens
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                Rate-Limited Brute Force Guard
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Portal Directory</h4>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <a href="/" className="hover:text-cyan-400 transition-colors">Home Gateway</a>
              <a href="/downloads" className="hover:text-cyan-400 transition-colors">Available Downloads</a>
              <a href="/pending-approval" className="hover:text-cyan-400 transition-colors">Pending Approval Status</a>
              <a href="/admin" className="hover:text-purple-400 transition-colors">Admin Control Center</a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DOCKWORLDWIDE Portal Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px] text-slate-400">
            CONFIDENTIAL • AUTHORIZED ENTERPRISE ACCESS ONLY
          </p>
        </div>
      </div>
    </footer>
  );
};
