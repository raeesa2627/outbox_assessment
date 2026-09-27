import React from 'react';
import { Search, RefreshCw, Layers, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  stats: DashboardStats | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  searchQuery,
  setSearchQuery,
  onRefresh,
  isRefreshing,
  stats,
}) => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipient or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Queue Pills */}
        {stats && (
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{stats.queue.delayed} Delayed</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-blue-600">
              <Layers className="w-3.5 h-3.5" />
              <span>{stats.queue.active} Active</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.queue.completed} Completed</span>
            </span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh"
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00A859]' : ''}`} />
        </button>
      </div>
    </header>
  );
};
