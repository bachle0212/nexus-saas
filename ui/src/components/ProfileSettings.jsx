import { useState } from 'react';
import { User, Key, Lock, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfileSettings({ api, user, onUpdate }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/api/auth/me/profile', { display_name: displayName, avatar_url: avatarUrl });
      toast.success('Profile updated!');
      onUpdate?.({ display_name: displayName, avatar_url: avatarUrl });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating profile');
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPw !== confirmPw) return toast.error('Passwords do not match');
    if (newPw.length < 8) return toast.error('Password must be at least 8 characters');
    setChangingPw(true);
    try {
      await api.post('/api/auth/me/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error changing password');
    }
    setChangingPw(false);
  };

  const loadApiKey = async () => {
    const res = await api.get('/api/auth/me/api-key');
    setApiKey(res.data.api_key);
    setShowKey(true);
  };

  const regenerateKey = async () => {
    if (!confirm('Regenerate API key? Your current key will stop working immediately.')) return;
    const res = await api.post('/api/auth/me/api-key/regenerate');
    setApiKey(res.data.api_key);
    setShowKey(true);
    toast.success('API key regenerated!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" /> Profile Information
        </h3>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              (displayName?.[0] || user?.email?.[0] || '?').toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="Avatar URL (https://...)"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Paste any image URL to use as avatar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              value={user?.email}
              disabled
              className="w-full border border-slate-100 rounded-lg px-3 py-2 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-5 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-500" /> Change Password
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw },
            { label: 'New Password', val: newPw, set: setNewPw },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type="password"
                value={val}
                onChange={e => set(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          onClick={changePassword}
          disabled={changingPw || !currentPw || !newPw || !confirmPw}
          className="mt-5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          <Lock className="w-4 h-4" /> {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-500" /> API Key
        </h3>
        <p className="text-sm text-slate-500 mb-4">Use this key to access the Nexus API from external applications.</p>
        {showKey ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={apiKey}
              className="flex-1 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            />
            <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('Copied!'); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition">Copy</button>
          </div>
        ) : (
          <button onClick={loadApiKey} className="border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
            Show API Key
          </button>
        )}
        <button
          onClick={regenerateKey}
          className="mt-3 flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition"
        >
          <RefreshCw className="w-3 h-3" /> Regenerate Key
        </button>
      </div>
    </div>
  );
}
