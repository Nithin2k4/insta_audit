import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Eye, TrendingUp, Instagram, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatRelativeTime, formatPercent } from '../utils/formatters';

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, loading, error, syncAll, syncAccount } = useAccounts();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers_count || 0), 0);
  const totalReach = accounts.reduce((sum, a) => sum + (a.latest_reach || 0), 0);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await syncAll();
      setSyncMsg(res.message);
      setTimeout(() => setSyncMsg(''), 4000);
    } catch {
      setSyncMsg('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">Here's your Instagram analytics overview</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">{syncMsg}</span>
          )}
          <button
            onClick={handleSyncAll}
            disabled={syncing || activeAccounts.length === 0}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Sync All
          </button>
          <Link to="/accounts" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            Add Account
          </Link>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Connected Accounts"
          value={accounts.length}
          icon={Instagram}
          color="primary"
        />
        <MetricCard
          title="Total Followers"
          value={formatNumber(totalFollowers)}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Reach (latest)"
          value={formatNumber(totalReach)}
          icon={Eye}
          color="green"
        />
        <MetricCard
          title="Active Accounts"
          value={activeAccounts.length}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Inactive accounts warning */}
      {accounts.some((a) => !a.is_active) && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            {accounts.filter((a) => !a.is_active).length} account(s) need reconnecting.{' '}
            <Link to="/accounts" className="underline font-medium">View accounts</Link>
          </span>
        </div>
      )}

      {/* Accounts list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Connected Accounts</h2>
          <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>

        {error && (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        )}

        {!error && accounts.length === 0 && (
          <div className="text-center py-12">
            <Instagram size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 mb-4">No accounts connected yet</p>
            <Link to="/accounts" className="btn-primary text-sm">
              Connect Instagram Account
            </Link>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Account</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Followers</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium hidden sm:table-cell">Reach</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium hidden md:table-cell">Posts</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium hidden lg:table-cell">Last Sync</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Status</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {account.profile_picture_url ? (
                          <img src={account.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {account.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <Link to={`/accounts/${account.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          @{account.username}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-700">
                      {formatNumber(account.followers_count)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 hidden sm:table-cell">
                      {formatNumber(account.latest_reach)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500 hidden md:table-cell">
                      {formatNumber(account.media_count)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-400 text-xs hidden lg:table-cell">
                      {account.last_synced_at ? formatRelativeTime(account.last_synced_at) : 'Never'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/accounts/${account.id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
