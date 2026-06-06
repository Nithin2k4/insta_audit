import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  BarChart2,
  RefreshCw,
  Shield,
  Download,
  Instagram,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Multi-Account Management',
    desc: 'Connect and manage up to 25 Instagram accounts from a single dashboard.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: TrendingUp,
    title: 'Follower Growth Tracking',
    desc: 'Visualize follower growth over time with interactive charts and trends.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: BarChart2,
    title: 'Engagement Analytics',
    desc: 'Track likes, comments, saves, shares, and engagement rates per post.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: RefreshCw,
    title: 'Automated Syncing',
    desc: 'Data syncs automatically every 24 hours via Instagram Graph API.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Download,
    title: 'Export Reports',
    desc: 'Export your analytics data as CSV or JSON for client reporting.',
    color: 'text-pink-600 bg-pink-50',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Access tokens are AES-256-GCM encrypted. Your data stays private.',
    color: 'text-red-600 bg-red-50',
  },
];

const benefits = [
  'Track all your clients in one place',
  'Automated daily data sync',
  'Historical data up to 90 days',
  'Export for client reports',
  'Secure OAuth authentication',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">InstaAudit</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Log in
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Instagram size={14} />
          <span>Instagram Graph API powered</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Instagram Analytics for{' '}
          <span className="text-primary-600">Social Media Managers</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Track follower growth, engagement rates, and post performance across all your client accounts in one powerful dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base py-3 px-8 flex items-center gap-2 w-full sm:w-auto justify-center">
            Start for free
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary text-base py-3 px-8 w-full sm:w-auto text-center">
            Sign in
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
          {benefits.map((b) => (
            <div key={b} className="hidden sm:flex items-center gap-1">
              <CheckCircle size={14} className="text-green-500" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
        <div className="bg-gradient-to-br from-primary-600 to-purple-800 rounded-2xl p-1 shadow-2xl">
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            {/* Mock dashboard header */}
            <div className="bg-sidebar text-white px-6 py-4 flex items-center gap-4">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <TrendingUp size={12} />
              </div>
              <span className="text-sm font-medium">InstaAudit Dashboard</span>
            </div>
            {/* Mock metrics */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Accounts', value: '12' },
                { label: 'Total Followers', value: '248K' },
                { label: 'Avg Engagement', value: '3.8%' },
                { label: 'Posts Tracked', value: '1,294' },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
                </div>
              ))}
            </div>
            {/* Mock chart bar */}
            <div className="px-6 pb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-32 flex items-end gap-1.5">
                {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100, 92, 87].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary-200 rounded-t"
                    style={{ height: `${h}%`, opacity: 0.7 + i * 0.02 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage Instagram clients</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Purpose-built for social media agencies and freelancers managing multiple Instagram accounts.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to grow your clients' Instagram?</h2>
          <p className="text-primary-100 mb-8">Start tracking analytics for free. No credit card required.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-primary-50 transition-colors">
            Get started free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <TrendingUp size={12} />
            </div>
            <span className="font-semibold">InstaAudit</span>
          </div>
          <p>&copy; {new Date().getFullYear()} InstaAudit. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
