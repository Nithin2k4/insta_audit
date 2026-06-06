import { useState, useEffect, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import api from '../utils/api';

function dateRange(days) {
  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), days), 'yyyy-MM-dd');
  return { from, to };
}

export function useOverview(accountId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    api.get(`/insights/${accountId}/overview`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, [accountId]);

  return { data, loading, error };
}

export function useFollowerHistory(accountId, days = 30) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (d = days) => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { from, to } = dateRange(d);
      const res = await api.get(`/insights/${accountId}/followers`, { params: { from, to } });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load follower data');
    } finally {
      setLoading(false);
    }
  }, [accountId, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useEngagementHistory(accountId, days = 30) {
  const [snapshots, setSnapshots] = useState([]);
  const [postEngagement, setPostEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (d = days) => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { from, to } = dateRange(d);
      const res = await api.get(`/insights/${accountId}/engagement`, { params: { from, to } });
      setSnapshots(res.data.snapshots);
      setPostEngagement(res.data.postEngagement);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  }, [accountId, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snapshots, postEngagement, loading, error, refetch: fetch };
}

export function usePosts(accountId, { page = 1, limit = 12, sort = 'posted_at' } = {}) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    api.get(`/insights/${accountId}/posts`, { params: { page, limit, sort } })
      .then((res) => {
        setPosts(res.data.posts);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load posts'))
      .finally(() => setLoading(false));
  }, [accountId, page, limit, sort]);

  return { posts, pagination, loading, error };
}
