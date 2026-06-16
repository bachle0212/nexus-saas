import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api-nexus.bachdev.bond';

export default function EmailVerify({ onSuccess }) {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    axios.get(`${API_BASE}/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified! You can now sign in.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <Zap className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nexus AI</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold text-white mb-2">Verifying Email...</h2>
              <p className="text-slate-400 text-sm">Please wait while we confirm your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <button
                onClick={onSuccess}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition"
              >
                Sign In to Nexus AI
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <button
                onClick={onSuccess}
                className="w-full border border-slate-700 hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-bold transition"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
