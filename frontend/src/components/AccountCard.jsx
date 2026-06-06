import { Link } from 'react-router-dom';
import { RefreshCw, Trash2, Users, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import { formatNumber, formatRelativeTime } from '../utils/formatters';

export default function AccountCard({ account, onSync, onDelete, syncing }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {account.profile_picture_url ? (
            <img
              src={account.profile_picture_url}
              alt={account.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {account.username?.[0]?.toUpperCase() || 'I'}
            </div>
          )}
          {!account.is_active && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/accounts/${account.id}`}
              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              @{account.username}
            </Link>
            {!account.is_active && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertCircle size={10} />
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{account.name}</p>
          {account.last_synced_at && (
            <p className="text-xs text-gray-400 mt-0.5">
              Synced {formatRelativeTime(account.last_synced_at)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSync(account.id)}
            disabled={syncing || !account.is_active}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40"
            title="Sync now"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Disconnect"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Users size={12} />
            <span className="text-xs">Followers</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{formatNumber(account.followers_count)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Eye size={12} />
            <span className="text-xs">Reach</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{formatNumber(account.latest_reach)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span className="text-xs">Posts</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{formatNumber(account.media_count)}</p>
        </div>
      </div>
    </div>
  );
}
