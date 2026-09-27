import React from 'react';
import { DashboardStats } from '../types';
import { ExternalLink, RefreshCw, Activity, Layers, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';

interface QueueMonitorViewProps {
  stats: DashboardStats | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const QueueMonitorView: React.FC<QueueMonitorViewProps> = ({
  stats,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Delayed</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{stats?.queue.delayed ?? 0}</span>
            <span className="text-xs text-gray-400 ml-2">in BullMQ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Active</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{stats?.queue.active ?? 0}</span>
            <span className="text-xs text-gray-400 ml-2">processing</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Waiting</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{stats?.queue.waiting ?? 0}</span>
            <span className="text-xs text-gray-400 ml-2">ready to send</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{stats?.queue.completed ?? 0}</span>
            <span className="text-xs text-gray-400 ml-2">successful</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Failed</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">{stats?.queue.failed ?? 0}</span>
            <span className="text-xs text-gray-400 ml-2">errors</span>
          </div>
        </div>
      </div>

      {/* Embedded Bull Board Panel */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">
              CRM & Queue Operations Dashboard (@bull-board)
            </span>

          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Refresh Queue Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00A859]' : ''}`} />
            </button>

            <a
              href="http://localhost:5000/admin/queues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#00A859] font-medium text-xs rounded-xl border border-emerald-200 transition-colors"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 w-full bg-gray-100 min-h-[500px]">
          <iframe
            src="http://localhost:5000/admin/queues"
            title="BullMQ Queue Board"
            className="w-full h-full border-none min-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
};
