import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Clock, 
  Send, 
  Activity, 
  Settings, 
  LogOut, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DashboardStats } from '../types';

interface SidebarProps {
  currentTab: 'scheduled' | 'sent' | 'queue' | 'settings';
  setCurrentTab: (tab: 'scheduled' | 'sent' | 'queue' | 'settings') => void;
  onOpenCompose: () => void;
  stats: DashboardStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCompose,
  stats,
}) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00A859] to-[#34D399] flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-200">
            O
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#111827] text-base tracking-tight">OUTBOX</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded border border-emerald-200/60 uppercase">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Email Job Scheduler</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 mx-3 my-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email?.split('@')[0] || 'User')}&background=00A859&color=fff&bold=true`}
            alt={user?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </h4>
            <p className="text-xs text-gray-500 truncate" title={user?.email}>
              {user?.email || 'user@domain.io'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>


      {/* Compose Button (Matches Figma Green CTA) */}
      <div className="px-4 mb-4">
        <button
          onClick={onOpenCompose}
          className="w-full bg-[#00A859] hover:bg-[#00924d] active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
          <span>Compose</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Mailbox
        </div>

        <button
          onClick={() => setCurrentTab('scheduled')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'scheduled'
              ? 'bg-emerald-50 text-[#00A859] font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className={`w-4 h-4 ${currentTab === 'scheduled' ? 'text-[#00A859]' : 'text-gray-400'}`} />
            <span>Scheduled</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              currentTab === 'scheduled'
                ? 'bg-emerald-200/60 text-[#00A859]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {stats?.scheduledCount ?? 0}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab('sent')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'sent'
              ? 'bg-emerald-50 text-[#00A859] font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Send className={`w-4 h-4 ${currentTab === 'sent' ? 'text-[#00A859]' : 'text-gray-400'}`} />
            <span>Sent</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              currentTab === 'sent'
                ? 'bg-emerald-200/60 text-[#00A859]'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {stats?.sentCount ?? 0}
          </span>
        </button>

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          System & Analytics
        </div>

        <button
          onClick={() => setCurrentTab('queue')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'queue'
              ? 'bg-emerald-50 text-[#00A859] font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Activity className={`w-4 h-4 ${currentTab === 'queue' ? 'text-[#00A859]' : 'text-gray-400'}`} />
            <span>CRM</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>


        <button
          onClick={() => setCurrentTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-emerald-50 text-[#00A859] font-semibold'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'text-[#00A859]' : 'text-gray-400'}`} />
          <span>Slack & Rate Limits</span>
        </button>
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Distributed Workers
          </span>
          <span className="text-emerald-600 font-semibold">Active</span>
        </div>
        <p className="text-[11px] text-gray-400">
          Redis sliding window rate limiter & BullMQ delayed queues.
        </p>
      </div>
    </aside>
  );
};
