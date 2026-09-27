import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { emailsApi, uploadApi } from '../services/api';
import { 
  X, 
  Send, 
  Clock, 
  Upload, 
  Paperclip, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, addMinutes, addHours, addDays, setHours, setMinutes } from 'date-fns';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [senderEmail, setSenderEmail] = useState(user?.email || 'oliver.brown@domain.io');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientsList, setRecipientsList] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  
  // Rate limiting & delays (PRD requirements)
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(10);

  // Scheduling state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [isImmediate, setIsImmediate] = useState(true);

  // Attachments
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; size?: number; type?: string }>>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isUploadingLeads, setIsUploadingLeads] = useState(false);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const leadFileInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  // Handle lead file upload (CSV / TXT)
  const handleLeadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLeads(true);
      const data = await uploadApi.parseLeads(file);
      if (data.emails.length > 0) {
        setRecipientsList(data.emails);
        toast.success(`Imported ${data.totalLeads} recipients from ${file.name}`);
      } else {
        toast.error('No valid email addresses found in the file.');
      }
    } catch (err: any) {
      toast.error('Failed to parse lead file');
    } finally {
      setIsUploadingLeads(false);
      if (leadFileInputRef.current) leadFileInputRef.current.value = '';
    }
  };

  // Handle attachment upload (Cloudinary / local fallback)
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAttachment(true);
      const uploaded = await uploadApi.uploadFile(file);
      setAttachments((prev) => [...prev, uploaded]);
      toast.success(`Attached ${uploaded.name}`);
    } catch (err: any) {
      toast.error('Attachment upload failed');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper formatting buttons for rich body
  const applyTag = (openTag: string, closeTag: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = bodyHtml.substring(start, end);
    const replacement = `${openTag}${selected || 'text'}${closeTag}`;

    const newContent = bodyHtml.substring(0, start) + replacement + bodyHtml.substring(end);
    setBodyHtml(newContent);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalRecipients: string[] = [];
    if (recipientsList.length > 0) {
      finalRecipients = recipientsList;
    } else if (recipientInput.trim()) {
      finalRecipients = recipientInput.split(/[,;\s]+/).map((r) => r.trim()).filter(Boolean);
    }

    if (finalRecipients.length === 0) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!bodyHtml.trim()) {
      toast.error('Please enter email body content');
      return;
    }

    const scheduleTimestamp = isImmediate
      ? new Date().toISOString()
      : scheduledDate.toISOString();

    try {
      setIsSubmitting(true);
      const response = await emailsApi.schedule({
        recipients: finalRecipients,
        subject,
        bodyHtml,
        attachments,
        scheduledAt: scheduleTimestamp,
        delayBetweenEmailsMs: delaySeconds * 1000,
        hourlyLimit,
        senderEmail,
      });

      toast.success(`Successfully queued ${response.scheduledCount} email(s) in BullMQ!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to schedule emails');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset dates
  const setPreset = (type: 'immediate' | '10min' | '1hour' | 'tomorrow') => {
    if (type === 'immediate') {
      setIsImmediate(true);
      setScheduledDate(new Date());
    } else {
      setIsImmediate(false);
      let target = new Date();
      if (type === '10min') target = addMinutes(target, 10);
      if (type === '1hour') target = addHours(target, 1);
      if (type === 'tomorrow') {
        target = setMinutes(setHours(addDays(target, 1), 9), 0);
      }
      setScheduledDate(target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">New Email Job</h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              BullMQ Queue
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Sender */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-400 w-16 uppercase">From</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859]"
              required
            />
          </div>

          {/* Recipient & Bulk Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 w-16 uppercase">To</label>
              <div>
                <input
                  type="file"
                  ref={leadFileInputRef}
                  onChange={handleLeadFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => leadFileInputRef.current?.click()}
                  disabled={isUploadingLeads}
                  className="inline-flex items-center gap-1.5 text-xs text-[#00A859] hover:text-[#008a49] font-medium py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isUploadingLeads ? 'Parsing...' : 'Upload CSV / Leads'}</span>
                </button>
              </div>
            </div>

            {recipientsList.length > 0 ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-900">{recipientsList.length} Leads</span>
                    <span className="text-emerald-700 ml-1">loaded from file</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecipientsList([])}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Clear list
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="recipient@example.com (or comma separated emails)"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859]"
              />
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-400 w-16 uppercase">Subject</label>
            <input
              type="text"
              placeholder="e.g. Invitation to try ReachInbox AI"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859]"
              required
            />
          </div>

          {/* Throttling & Rate Limits (Matches Figma Delay & Hourly Limit) */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Delay between emails (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-gray-400">Min 2s recommended</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hourly Limit (max emails/hr)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-gray-400">Redis atomic sliding limiter</span>
            </div>
          </div>

          {/* Rich Body Toolbar */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden focus-within:border-[#00A859] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between text-gray-600">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyTag('<b>', '</b>')}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-gray-900"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTag('<i>', '</i>')}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-gray-900"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTag('<ul><li>', '</li></ul>')}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-gray-900"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyTag('<blockquote>', '</blockquote>')}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 hover:text-gray-900"
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAttachmentUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-md hover:bg-white transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isUploadingAttachment ? 'Uploading...' : 'Attach Image (Cloudinary)'}</span>
                </button>
              </div>
            </div>

            <textarea
              ref={bodyTextareaRef}
              rows={6}
              placeholder="Hi there,<br><br>We are excited to share our latest product updates..."
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-700"
                >
                  <Paperclip className="w-3 h-3 text-emerald-600" />
                  <span className="font-medium max-w-[150px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Settings Panel */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery Time</span>
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                {isImmediate
                  ? 'Send Immediately (BullMQ delay: 0s)'
                  : `Scheduled for: ${format(scheduledDate, 'MMM d, yyyy @ hh:mm a')}`}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('immediate')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isImmediate
                    ? 'bg-[#00A859] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Send Immediately
              </button>
              <button
                type="button"
                onClick={() => setPreset('10min')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  !isImmediate && Math.abs(scheduledDate.getTime() - addMinutes(new Date(), 10).getTime()) < 60000
                    ? 'bg-[#00A859] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                In 10 Mins
              </button>
              <button
                type="button"
                onClick={() => setPreset('1hour')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                In 1 Hour
              </button>
              <button
                type="button"
                onClick={() => setPreset('tomorrow')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Tomorrow 9:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsImmediate(false);
                  setShowSchedulePicker(!showSchedulePicker);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Custom Date & Time...
              </button>
            </div>

            {/* Custom Date Input */}
            {showSchedulePicker && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <input
                  type="datetime-local"
                  value={format(scheduledDate, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => {
                    if (e.target.value) {
                      setIsImmediate(false);
                      setScheduledDate(new Date(e.target.value));
                    }
                  }}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00A859] hover:bg-[#00924d] active:scale-[0.98] text-white font-medium py-2.5 px-6 rounded-xl shadow-sm shadow-emerald-600/20 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enqueuing in BullMQ...' : isImmediate ? 'Send Now' : 'Schedule in BullMQ'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
