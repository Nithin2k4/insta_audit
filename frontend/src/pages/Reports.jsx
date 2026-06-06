import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, subDays } from 'date-fns';

export default function Reports() {
  const { accounts, loading } = useAccounts();
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  const handleExport = async () => {
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    setError('');
    setExporting(true);

    try {
      const params = new URLSearchParams({ accountId, from, to, format: exportFormat });
      const token = document.cookie; // Access token managed in context; we rely on withCredentials

      // Use fetch for file download
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/reports/export?${params}`,
        {
          credentials: 'include',
          headers: {
            // The access token interceptor doesn't apply here; get from window.__access_token if needed
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await res.blob();
      const account = accounts.find((a) => a.id === accountId);
      const filename = `${account?.username || 'export'}_${from}_${to}.${exportFormat}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const quickRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-500 mt-1">Export your analytics data for client reporting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export form */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-6">Export Data</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Account select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account</label>
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-400">No accounts connected</p>
              ) : (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select an account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>@{a.username}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickRanges.map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => {
                      setFrom(format(subDays(new Date(), days), 'yyyy-MM-dd'));
                      setTo(format(new Date(), 'yyyy-MM-dd'));
                    }}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex gap-3">
                <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${exportFormat === 'json' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="sr-only"
                  />
                  <FileText size={20} className={exportFormat === 'json' ? 'text-primary-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium text-sm">JSON</p>
                    <p className="text-xs text-gray-400">Structured data</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${exportFormat === 'csv' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="sr-only"
                  />
                  <Table size={20} className={exportFormat === 'csv' ? 'text-primary-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium text-sm">CSV</p>
                    <p className="text-xs text-gray-400">Excel-compatible</p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || accounts.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Download size={18} />
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">What's included</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                'Daily follower snapshots',
                'Reach & impressions by day',
                'Profile views & website clicks',
                'Post-level engagement data',
                'Like, comment, save & share counts',
                'Engagement rate per post',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-primary-50 border-primary-100">
            <h3 className="font-semibold text-primary-900 mb-2">Pro tip</h3>
            <p className="text-sm text-primary-700">
              Export CSV to open directly in Excel or Google Sheets for custom charts and client presentations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
