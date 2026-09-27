import React from 'react';
import { EmailJob } from '../types';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, ExternalLink, Paperclip, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface SentListProps {
  emails: EmailJob[];
  loading: boolean;
  onSelectEmail: (email: EmailJob) => void;
}

export const SentList: React.FC<SentListProps> = ({
  emails,
  loading,
  onSelectEmail,
}) => {
  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Fetching sent email history...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md text-center p-8 bg-white rounded-3xl border border-gray-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Sent Emails Yet</h3>
          <p className="text-sm text-gray-500">
            Once BullMQ workers process your scheduled email jobs, they will appear here with live Ethereal preview links and delivery timestamps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/70 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Recipient</div>
          <div className="col-span-4">Subject & Content</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Sent Time & Previews</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {emails.map((email) => {
            const isSent = email.status === 'sent';
            const sentDate = email.sentAt ? new Date(email.sentAt) : new Date(email.updatedAt);
            const formattedDate = format(sentDate, 'MMM d, hh:mm a');

            return (
              <motion.div
                key={email._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => onSelectEmail(email)}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-emerald-50/20 cursor-pointer transition-colors group text-sm"
              >
                {/* Recipient */}
                <div className="col-span-3 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full font-semibold flex items-center justify-center text-xs shrink-0 ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
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

                {/* Subject & preview */}
                <div className="col-span-4 min-w-0">
                  <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                    <span>{email.subject}</span>
                    {email.attachments && email.attachments.length > 0 && (
                      <span className="shrink-0 flex items-center gap-0.5 text-xs text-gray-400 font-normal">
                        <Paperclip className="w-3.5 h-3.5" />
                        {email.attachments.length}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs text-gray-500 truncate"
                    dangerouslySetInnerHTML={{
                      __html: email.bodyHtml.replace(/<[^>]*>?/gm, '').substring(0, 90) + '...',
                    }}
                  />
                  {email.errorReason && (
                    <div className="text-xs text-red-500 truncate mt-0.5">
                      Error: {email.errorReason}
                    </div>
                  )}
                </div>

                {/* Status Pill (Matches Figma Green Pill) */}
                <div className="col-span-2">
                  {isSent ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sent</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/60 text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Failed</span>
                    </span>
                  )}
                </div>

                {/* Sent Time & Ethereal Preview Button */}
                <div className="col-span-3 text-right flex items-center justify-end gap-3">
                  <span className="text-xs text-gray-500">{formattedDate}</span>

                  {email.etherealPreviewUrl && (
                    <a
                      href={email.etherealPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open full Ethereal email preview"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00A859] hover:bg-emerald-100 text-xs font-medium border border-emerald-200 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
