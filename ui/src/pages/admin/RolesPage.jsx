import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, Plus, Edit, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api from '../../lib/api';

const PERMISSION_GROUPS = {
  'Image Studio': ['generate:image'],
  'User Management': ['users:read', 'users:write'],
  'Role Management': ['roles:manage'],
  'System': ['system:logs'],
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const nameRef = useRef();
  const descRef = useRef();

  const { data: rolesList = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/api/admin/roles').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, name, description, permissions }) => {
      if (id) {
        return api.put(`/api/admin/roles/${id}`, { name, description, permissions });
      }
      return api.post('/api/admin/roles', { name, description, permissions });
    },
    onSuccess: () => {
      toast.success(editingRole ? 'Role updated!' : 'Role created!');
      setIsModalOpen(false);
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error saving role'),
  });

  const handleSave = () => {
    const name = nameRef.current?.value;
    const description = descRef.current?.value;
    if (!name) return toast.error('Role name is required');
    const checked = Array.from(document.querySelectorAll('.perm-checkbox:checked')).map(cb => cb.value);
    const permissions = checked.join(',');
    saveMutation.mutate({ id: editingRole?.id, name, description, permissions });
  };

  const openCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingRole(r);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <CheckCircle2 className="text-amber-500" /> Roles & Policies Matrix
          </h2>
          <p className="text-sm text-slate-500 mt-1">Define Roles and bind them to specific atomic Permissions.</p>
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
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rolesList.map(r => (
          <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-800 capitalize">{r.name}</h3>
                {r.name === 'admin' && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Root Role</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-4">{r.description}</p>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {(r.permissions || '').split(',').filter(Boolean).map(p => (
                    <span key={p} className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-md font-mono border border-blue-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" /> {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEdit(r)}
              className="text-slate-400 hover:text-indigo-600 transition p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg flex items-center gap-2 text-sm font-medium"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  {editingRole ? 'Edit Role Policies' : 'Create New Role'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                    <input
                      ref={nameRef}
                      type="text"
                      defaultValue={editingRole?.name || ''}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <input
                      ref={descRef}
                      type="text"
                      defaultValue={editingRole?.description || ''}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Permission Policies</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                      <div key={group} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group}</p>
                        <div className="space-y-2">
                          {perms.map(p => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group/label">
                              <input
                                type="checkbox"
                                value={p}
                                defaultChecked={(editingRole?.permissions || '').includes(p)}
                                className="perm-checkbox w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-sm text-slate-700 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 group-hover/label:border-indigo-300 transition">
                                {p}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    {editingRole ? 'Update Role' : 'Create Role'}
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
