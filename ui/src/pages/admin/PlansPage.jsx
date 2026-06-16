import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, X, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api from '../../lib/api';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const nameRef = useRef();
  const priceRef = useRef();
  const creditsRef = useRef();
  const featuresRef = useRef();

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/api/billing/plans').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return api.put(`/api/billing/plans/${payload.id}`, payload);
      }
      return api.post('/api/billing/plans', payload);
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plan updated!' : 'Plan created!');
      setIsModalOpen(false);
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error saving plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/billing/plans/${id}`),
    onSuccess: () => {
      toast.success('Plan deleted');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: () => toast.error('Failed to delete plan'),
  });

  const handleSave = () => {
    const name = nameRef.current?.value;
    if (!name) return toast.error('Plan name is required');
    const features = featuresRef.current?.value || '';
    saveMutation.mutate({
      id: editingPlan?.id,
      name,
      price_usd: parseInt(priceRef.current?.value || 0),
      monthly_credits: parseInt(creditsRef.current?.value || 0),
      features: JSON.stringify(features.split(',').map(s => s.trim()).filter(Boolean)),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <CreditCard className="text-amber-500" /> Plan Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure subscription tiers, pricing, and monthly credits.</p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-medium">Plan Name</th>
                <th className="p-4 font-medium">Price (USD)</th>
                <th className="p-4 font-medium">Monthly Credits</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{p.name}</td>
                  <td className="p-4 font-medium text-green-600">${p.price_usd}</td>
                  <td className="p-4 font-mono text-indigo-600">{p.monthly_credits} 🪙</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingPlan(p); setIsModalOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete plan ${p.name}?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No subscription plans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="text-amber-500 w-5 h-5" />
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                  <input
                    ref={nameRef}
                    type="text"
                    defaultValue={editingPlan?.name || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Pro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (USD)</label>
                    <input
                      ref={priceRef}
                      type="number"
                      defaultValue={editingPlan?.price_usd || 0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Credits</label>
                    <input
                      ref={creditsRef}
                      type="number"
                      defaultValue={editingPlan?.monthly_credits || 0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Features (comma separated)</label>
                  <textarea
                    ref={featuresRef}
                    defaultValue={editingPlan ? JSON.parse(editingPlan.features || '[]').join(', ') : ''}
                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Fast generation, 1000 credits, API Access..."
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:opacity-50"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
