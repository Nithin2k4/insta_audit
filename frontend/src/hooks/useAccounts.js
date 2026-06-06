import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/accounts');
      setAccounts(res.data.accounts);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id) => {
    await api.delete(`/accounts/${id}`);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const syncAccount = useCallback(async (id) => {
    const res = await api.post(`/accounts/${id}/sync`);
    return res.data;
  }, []);

  const syncAll = useCallback(async () => {
    const res = await api.post('/accounts/sync-all');
    return res.data;
  }, []);

  return { accounts, loading, error, refetch: fetchAccounts, deleteAccount, syncAccount, syncAll };
}

export function useAccount(id) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/accounts/${id}/summary`)
      .then((res) => setAccount(res.data.account))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load account'))
      .finally(() => setLoading(false));
  }, [id]);

  return { account, loading, error };
}
