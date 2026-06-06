import { useState } from 'react';
import { Plus, RefreshCw, Instagram } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import AccountCard from '../components/AccountCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function Accounts() {
  const { accounts, loading, error, refetch, deleteAccount, syncAccount, syncAll } = useAccounts();
  const [syncingId, setSyncingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success === 'connected') {
      const count = searchParams.get('count') || 1;
      setMessage({ type: 'success', text: `Successfully connected ${count} account(s)!` });
      refetch();
    } else if (errorParam) {
      const msgs = {
        oauth_denied: 'OAuth connection was cancelled.',
        no_ig_account: 'No Instagram business account found on this Facebook profile.',
        account_limit: 'You have reached the 25 account limit.',
        oauth_failed: 'OAuth connection failed. Please try again.',
      };
      setMessage({ type: 'error', text: msgs[errorParam] || 'Connection failed.' });
    }
  }, [searchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.get('/auth/instagram/oauth-url');
      window.location.href = res.data.url;
    } catch {
      setMessage({ type: 'error', text: 'Failed to get OAuth URL. Check your Meta app settings.' });
      setConnecting(false);
    }
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const res = await syncAccount(id);
      setMessage({ type: 'success', text: res.message || 'Sync started' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync failed' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Disconnect this Instagram account? Your historical data will be deleted.')) return;
    try {
      await deleteAccount(id);
      setMessage({ type: 'success', text: 'Account disconnected successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect account' });
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await syncAll();
      setMessage({ type: 'success', text: res.message });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: 'error', text: 'Sync all failed' });
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instagram Accounts</h1>
          <p className="text-gray-500 mt-1">
            {accounts.length} of 25 accounts connected
          </p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RefreshCw size={16} className={syncingAll ? 'animate-spin' : ''} />
              Sync All
            </button>
          )}
          <button
            onClick={handleConnect}
            disabled={connecting || accounts.length >= 25}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {connecting ? 'Redirecting...' : 'Connect Account'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-inherit opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Account limit bar */}
      {accounts.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500 font-medium">Account limit</span>
            <span className="text-gray-700 font-semibold">{accounts.length} / 25</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(accounts.length / 25) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="text-center py-8 text-red-500 text-sm">{error}</div>}

      {/* Empty state */}
      {!error && accounts.length === 0 && (
        <div className="card text-center py-16">
          <Instagram size={56} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No accounts connected</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Connect your first Instagram business account to start tracking analytics.
          </p>
          <button onClick={handleConnect} disabled={connecting} className="btn-primary text-sm mx-auto inline-flex items-center gap-2">
            <Plus size={16} />
            Connect Instagram Account
          </button>
        </div>
      )}

      {/* Accounts grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onSync={handleSync}
              onDelete={handleDelete}
              syncing={syncingId === account.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
