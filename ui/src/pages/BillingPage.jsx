import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function BillingPage() {
  const user = useAuthStore(s => s.user);
  const userPlan = user?.plan || 'Free';

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/api/billing/plans').then(r => r.data),
  });

  const handleSubscribe = async (plan) => {
    if (userPlan === plan.name) return;
    try {
      const res = await api.post(`/api/billing/subscribe?plan_id=${plan.id}`);
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.success(res.data.message);
      }
    } catch {
      toast.error('Subscription failed');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-2">Upgrade your Creative Power</h2>
        <p className="text-slate-500">
          You are currently on the <span className="font-bold text-indigo-600">{userPlan}</span> plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => (
          <div
            key={p.id}
            className={`bg-white p-6 rounded-2xl border-2 shadow-sm flex flex-col ${
              userPlan === p.name
                ? 'border-indigo-500 relative'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            {userPlan === p.name && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Current Plan
              </span>
            )}
            <h3 className="text-xl font-bold mb-1">{p.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">${p.price_usd}</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {p.monthly_credits} Credits / month
              </li>
              {(() => { try { return JSON.parse(p.features || '[]'); } catch { return []; } })().map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(p)}
              disabled={userPlan === p.name}
              className={`w-full py-2.5 rounded-xl font-bold transition ${
                userPlan === p.name
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {userPlan === p.name ? 'Active' : 'Upgrade Now'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
