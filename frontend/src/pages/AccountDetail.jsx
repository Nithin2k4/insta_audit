import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Users, Eye, TrendingUp, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useAccount } from '../hooks/useAccounts';
import { useOverview, useFollowerHistory, useEngagementHistory, usePosts } from '../hooks/useInsights';
import MetricCard from '../components/MetricCard';
import FollowerChart from '../components/FollowerChart';
import EngagementChart from '../components/EngagementChart';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatPercent, formatRelativeTime } from '../utils/formatters';
import api from '../utils/api';

const DATE_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function AccountDetail() {
  const { id } = useParams();
  const [days, setDays] = useState(30);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [postsPage, setPostsPage] = useState(1);
  const [postsSort, setPostsSort] = useState('posted_at');

  const { account, loading: accountLoading } = useAccount(id);
  const { data: overview, loading: overviewLoading } = useOverview(id);
  const { data: followerData, loading: followerLoading, refetch: refetchFollowers } = useFollowerHistory(id, days);
  const { snapshots, postEngagement, loading: engLoading, refetch: refetchEng } = useEngagementHistory(id, days);
  const { posts, pagination, loading: postsLoading } = usePosts(id, { page: postsPage, limit: 12, sort: postsSort });

  const handleDaysChange = (d) => {
    setDays(d);
    refetchFollowers(d);
    refetchEng(d);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await api.post(`/accounts/${id}/sync`);
      setSyncMsg(res.data.message || 'Sync started');
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      setSyncMsg(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (accountLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!account) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Account not found</p>
      <Link to="/accounts" className="text-primary-600 hover:underline text-sm mt-2 inline-block">Back to accounts</Link>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/accounts" className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div className="flex items-center gap-3">
            {account.profile_picture_url ? (
              <img src={account.profile_picture_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {account.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">@{account.username}</h1>
              {account.last_synced_at && (
                <p className="text-xs text-gray-400">Last synced {formatRelativeTime(account.last_synced_at)}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">{syncMsg}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing || !account.is_active}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Followers"
          value={formatNumber(overview?.followers || account.followers_count)}
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Reach"
          value={formatNumber(overview?.reach)}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(overview?.impressions)}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Avg Engagement"
          value={formatPercent(overview?.avg_engagement_rate)}
          icon={Heart}
          color="pink"
        />
      </div>

      {/* Date range picker */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 font-medium">Period:</span>
        {DATE_RANGES.map(({ label, days: d }) => (
          <button
            key={d}
            onClick={() => handleDaysChange(d)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              days === d
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Follower growth */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Follower Growth</h3>
          {followerLoading ? (
            <LoadingSpinner className="h-48" />
          ) : (
            <FollowerChart data={followerData} />
          )}
        </div>

        {/* Reach & Impressions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Reach & Impressions</h3>
          {engLoading ? (
            <LoadingSpinner className="h-48" />
          ) : (
            <EngagementChart data={snapshots} />
          )}
        </div>
      </div>

      {/* Post engagement */}
      {postEngagement.length > 0 && (
        <div className="card mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Post Engagement by Day</h3>
          <EngagementChart data={postEngagement} type="posts" />
        </div>
      )}

      {/* Top posts */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="font-semibold text-gray-900">Posts</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort by:</label>
            <select
              value={postsSort}
              onChange={(e) => { setPostsSort(e.target.value); setPostsPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="posted_at">Newest</option>
              <option value="engagement_rate">Engagement Rate</option>
              <option value="like_count">Most Liked</option>
              <option value="comment_count">Most Commented</option>
              <option value="reach">Most Reach</option>
            </select>
          </div>
        </div>

        {postsLoading ? (
          <LoadingSpinner className="h-48" />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No posts yet. Sync your account to fetch post data.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                  disabled={postsPage === 1}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {postsPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPostsPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={postsPage === pagination.totalPages}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
