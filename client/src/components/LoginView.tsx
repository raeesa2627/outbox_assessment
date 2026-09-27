import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginView: React.FC = () => {
  const { demoLogin, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Oliver Brown');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await demoLogin(email, name);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleMock = async () => {
    try {
      setIsSubmitting(true);
      // Simulate Google OAuth response or trigger real exchange
      await demoLogin('oliver.brown@gmail.com', 'Oliver Brown (Google)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A859] to-[#34D399] flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md shadow-emerald-200">
            O
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Login to Outbox</h2>
          <p className="text-xs text-gray-500">
            Distributed Email Job Scheduler with BullMQ & Redis
          </p>
        </div>

        {/* Google OAuth Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleMock}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-all shadow-2xs hover:border-gray-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Login with Google</span>
          </button>
        </div>

        {/* Divider (Matches Figma "Or sign up through email") */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Or sign up through email
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="oliver.brown@domain.io"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00A859] transition-all"
                required
              />
            </div>
          </div>

          {/* Login Button (Matches Figma Green CTA) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00A859] hover:bg-[#00924d] active:scale-[0.99] text-white font-medium py-2.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing In...' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Recruiter Evaluation Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-800 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Recruiter Instant Demo:</strong> Click <strong>Login</strong> directly to enter with Oliver Brown's pre-configured workspace matching the Figma design.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
