import { useState } from 'react';
import { User, Lock, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await api.put('/auth/me', { name });
      setSaveMsg('Profile updated successfully');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwMsg('New password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? All data will be permanently deleted. This cannot be undone.')) return;
    if (!confirm('Last chance: Delete your account and all data?')) return;
    try {
      await api.delete('/auth/me');
      logout();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete account');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <User size={18} />
            </div>
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>

          {saveMsg && (
            <div className={`text-sm px-4 py-2.5 rounded-lg mb-4 ${saveMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm py-2">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Password */}
        {!user?.google_id && (
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Lock size={18} />
              </div>
              <h2 className="font-semibold text-gray-900">Change Password</h2>
            </div>

            {pwMsg && (
              <div className={`text-sm px-4 py-2.5 rounded-lg mb-4 ${pwMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {pwMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <button type="submit" disabled={pwSaving} className="btn-primary text-sm py-2">
                {pwSaving ? 'Changing...' : 'Change password'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Bell size={18} />
            </div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Token expiry alerts', desc: 'Get notified when Instagram access tokens expire', defaultChecked: true },
              { label: 'Daily sync summary', desc: 'Receive a summary of daily sync results', defaultChecked: false },
            ].map((item) => (
              <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-red-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Trash2 size={18} />
            </div>
            <h2 className="font-semibold text-gray-900">Danger Zone</h2>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Delete account</p>
              <p className="text-sm text-gray-400">Permanently delete your account and all data. This cannot be undone.</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex-shrink-0 text-sm text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
