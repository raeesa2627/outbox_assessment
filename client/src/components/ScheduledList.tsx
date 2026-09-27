import React, { useState } from 'react';
import { EmailJob } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Trash2, Mail, ShieldAlert, AlertCircle, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduledListProps {
  emails: EmailJob[];
  loading: boolean;
  onCancel: (id: string) => Promise<void>;
  onOpenCompose: () => void;
}

export const ScheduledList: React.FC<ScheduledListProps> = ({
  emails,
  loading,
  onCancel,
  onOpenCompose,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelClick = async (id: string) => {
    if (confirm('Are you sure you want to cancel this scheduled email? It will be removed from the BullMQ queue.')) {
      setCancellingId(id);
      try {
        await onCancel(id);
      } finally {
        setCancellingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading scheduled jobs from BullMQ...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center p-8 bg-white rounded-3xl border border-gray-200/80 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#00A859] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Scheduled Emails</h3>
          <p className="text-sm text-gray-500 mb-6">
            There are currently no emails waiting in the BullMQ queue. Schedule a single email or upload a CSV list of leads.
          </p>
          <button
            onClick={onOpenCompose}
            className="bg-[#00A859] hover:bg-[#00924d] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20 text-sm transition-all"
          >
            + Schedule an Email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/70 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Recipient</div>
          <div className="col-span-4">Subject & Excerpt</div>
          <div className="col-span-3">Scheduled Time</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {emails.map((email) => {
              const scheduledDate = new Date(email.scheduledAt);
              const isPast = scheduledDate.getTime() < Date.now();
              const formattedDate = format(scheduledDate, 'EEE d, hh:mm a');
              const timeFromNow = formatDistanceToNow(scheduledDate, { addSuffix: true });

              return (
                <motion.div
                  key={email._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group text-sm"
                >
                  {/* Recipient */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-800 font-semibold flex items-center justify-center text-xs shrink-0">
                        {email.recipientEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {email.recipientEmail}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          From: {email.senderEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject & snippet */}
                  <div className="col-span-4 min-w-0">
                    <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                      <span>{email.subject}</span>
                      {email.batchId && (
                        <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/50">
                          <FileSpreadsheet className="w-3 h-3" />
                          Batch
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs text-gray-500 truncate"
                      dangerouslySetInnerHTML={{
                        __html: email.bodyHtml.replace(/<[^>]*>?/gm, '').substring(0, 90) + '...',
                      }}
                    />
                  </div>

                  {/* Scheduled Time Badge (Matches Figma Yellow/Orange Pill) */}
                  <div className="col-span-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{formattedDate}</span>
                      <span className="text-[11px] font-normal text-amber-600">
                        ({isPast ? 'Executing now' : timeFromNow})
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 pl-1">
                      Delay: {email.delayBetweenEmailsMs / 1000}s | Limit: {email.hourlyLimit}/hr
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => handleCancelClick(email._id)}
                      disabled={cancellingId === email._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors disabled:opacity-50"
                      title="Cancel Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{cancellingId === email._id ? 'Cancelling...' : 'Cancel'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
