import React from 'react';
import { EmailJob } from '../types';
import { format } from 'date-fns';
import { X, ExternalLink, Paperclip, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailDetailModalProps {
  email: EmailJob | null;
  onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  const isSent = email.status === 'sent';
  const displayDate = email.sentAt ? new Date(email.sentAt) : new Date(email.scheduledAt);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-gray-400">
                JOB ID: {email._id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isSent
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {email.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Email Header Info */}
          <div className="px-8 py-6 border-b border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{email.subject}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium">FROM</div>
                <div className="text-gray-800 font-medium">{email.senderEmail}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium">TO</div>
                <div className="text-gray-800 font-medium">{email.recipientEmail}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium">
                  {isSent ? 'SENT AT' : 'SCHEDULED FOR'}
                </div>
                <div className="text-gray-800 font-medium">
                  {format(displayDate, 'EEEE, MMMM d, yyyy @ hh:mm a')}
                </div>
              </div>
              {email.etherealPreviewUrl && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 font-medium">ETHEREAL SMTP PREVIEW</div>
                  <a
                    href={email.etherealPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#00A859] hover:underline font-medium text-xs"
                  >
                    <span>Inspect Raw Rendered Email</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-8 overflow-y-auto flex-1 text-gray-800 text-sm leading-relaxed space-y-4">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />

            {/* Attachments Gallery (Matches Figma Tennis Coach Profile attachments) */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({email.attachments.length})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {email.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 bg-gray-50/50 hover:bg-emerald-50/10 transition-all flex flex-col gap-2"
                    >
                      <div className="w-full h-28 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {att.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#00A859]">
                          {att.name}
                        </p>
                        {att.size && (
                          <p className="text-[10px] text-gray-400">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
