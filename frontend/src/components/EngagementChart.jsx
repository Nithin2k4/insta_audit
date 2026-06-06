import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatShortDate, formatNumber } from '../utils/formatters';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-2">{formatShortDate(label)}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-semibold">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function EngagementChart({ data, type = 'reach' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No data available for this period
      </div>
    );
  }

  const isPostData = data[0]?.likes !== undefined;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {isPostData ? (
          <>
            <Bar dataKey="likes" fill="#7c3aed" radius={[2, 2, 0, 0]} maxBarSize={20} />
            <Bar dataKey="comments" fill="#a78bfa" radius={[2, 2, 0, 0]} maxBarSize={20} />
            <Bar dataKey="saves" fill="#c4b5fd" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </>
        ) : (
          <>
            <Bar dataKey="reach" fill="#7c3aed" radius={[2, 2, 0, 0]} maxBarSize={20} />
            <Bar dataKey="impressions" fill="#a78bfa" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
