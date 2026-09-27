import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowRight, Mail, Lock, Sparkles, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const LoginView: React.FC = () => {
  const { demoLogin, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deriveNameFromEmail = (emailStr: string): string => {
    if (name.trim()) return name.trim();
    const clean = emailStr.toLowerCase().trim();
    if (clean === 'oliver.brown@domain.io') return 'Oliver Brown';
    const prefix = clean.split('@')[0] || 'User';
    return prefix
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'User';
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const computedName = deriveNameFromEmail(email);
      await demoLogin(email, computedName);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('No credential received from Google');
      return;
    }
    try {
      setIsSubmitting(true);
      await loginWithGoogle(credentialResponse.credential);
    } catch (err: any) {
      console.error('Google auth error:', err);
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

        {/* Real Google OAuth Button */}
        <div className="flex justify-center w-full min-h-[44px]">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:mx-auto">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error('Google Sign-In failed or popup was closed');
              }}
              shape="rectangular"
              size="large"
              theme="outline"
              text="signin_with"
              width="384"
              logo_alignment="center"
            />
          </div>
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
