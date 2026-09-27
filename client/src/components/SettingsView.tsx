import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../services/api';
import { 
  Slack, 
  Send, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState(user?.slackWebhookUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsApi.updateSettings({ slackWebhookUrl: webhookUrl });
      updateUser({ slackWebhookUrl: webhookUrl });
      toast.success('Slack settings saved successfully');
    } catch (err: any) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSlack = async () => {
    try {
      setIsTesting(true);
      const res = await settingsApi.testSlackAlert(webhookUrl);
      toast.success(res.message || 'Test alert delivered to Slack!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test alert');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Slack Integration Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#4A154B]/10 text-[#4A154B] flex items-center justify-center shrink-0">
              <Slack className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Slack Alert Integration
              </h3>
              <p className="text-sm text-gray-500">
                Receive live instant alerts in your Slack channels whenever a sender reaches their hourly rate limit.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Slack Incoming Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859]"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Paste your Slack App's Incoming Webhook URL to receive automated alerts.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#00A859] hover:bg-[#00924d] text-white font-medium px-5 py-2 rounded-xl text-sm transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Webhook URL'}
              </button>

              <button
                type="button"
                onClick={handleTestSlack}
                disabled={isTesting || !webhookUrl}
                className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-40"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{isTesting ? 'Sending Alert...' : 'Test Slack Alert'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* System Architecture & Resilience Overview */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A859] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Distributed Job Scheduler Architecture</h3>
              <p className="text-xs text-gray-500">How ReachInbox Outbox Scheduler guarantees zero dropped jobs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80">
              <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-[#00A859]" />
                <span>Zero Cron Jobs</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Adheres strictly to PRD specifications. Uses BullMQ delayed queues backed by Redis persistence instead of cron loops.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80">
              <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-gray-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Multi-Process Safety</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hourly rate limits are checked and incremented atomically via Redis Lua scripts, ensuring perfect multi-worker concurrency.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80">
              <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-gray-800">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Zero Job Drops</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                When rate limits are hit, remaining emails are postponed to the start of the next hour window rather than failed or discarded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
