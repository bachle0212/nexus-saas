import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Edit, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api from '../../lib/api';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const emailRef = useRef();
  const roleRef = useRef();
  const creditsRef = useRef();
  const passwordRef = useRef();

  const { data: usersList = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then(r => r.data),
  });

  const { data: rolesList = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/api/admin/roles').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return api.put(`/api/admin/users/${payload.id}`, payload);
      }
      return api.post('/api/admin/users', payload);
    },
    onSuccess: () => {
      toast.success(editingUser ? 'User updated!' : 'User created!');
      setIsModalOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error saving user'),
  });

  const handleSave = () => {
    const payload = {
      id: editingUser?.id,
      email: emailRef.current?.value,
      role: roleRef.current?.value,
      credits: parseInt(creditsRef.current?.value || 0),
      password: passwordRef.current?.value || undefined,
    };
    saveMutation.mutate(payload);
  };

  const openCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Zap className="text-amber-500" /> User Access Control
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage platform users, roles, and credit balances.</p>
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1 uppercase">
          <Zap className="w-3 h-3" /> ADMIN DASHBOARD
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Permissions</th>
              <th className="px-6 py-4">Credits</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium text-slate-900">#{u.id}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-amber-100 text-amber-700'
                    : u.role === 'moderator' ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(u.permissions || '').split(',').filter(Boolean).map(p => (
                      <span key={p} className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-mono border border-blue-100">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-medium">{u.credits?.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-slate-400 hover:text-indigo-600 transition p-1.5 bg-slate-50 hover:bg-indigo-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    ref={emailRef}
                    type="email"
                    defaultValue={editingUser?.email || ''}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      ref={roleRef}
                      defaultValue={editingUser?.role || 'user'}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {rolesList.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                    <input
                      ref={creditsRef}
                      type="number"
                      defaultValue={editingUser?.credits || 100}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password {editingUser && '(Leave blank to keep current)'}
                  </label>
                  <input
                    ref={passwordRef}
                    type="password"
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50"
                  >
                    {editingUser ? 'Save Changes' : 'Create User'}
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
