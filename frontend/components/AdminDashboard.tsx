import React, { useState, useEffect } from 'react';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';
import { API_BASE_URL, FRONTEND_URL } from '@/lib/config';

interface AdminStats {
  total_polls_today: number;
  active_users_now: number;
  most_popular_poll: {
    id: string;
    question: string;
    total_votes: number;
  } | null;
  avg_response_time_ms: number;
  total_polls: number;
  total_votes: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'X-Admin-Key': adminKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated, adminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Admin Dashboard
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin API Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter admin key..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Login
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500 text-center">
            Default key: admin_secret_key_change_in_production
          </p>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time system monitoring and analytics</p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Activity className="w-8 h-8 text-blue-500" />}
            title="Polls Today"
            value={stats.total_polls_today}
            subtitle="Created in last 24h"
            color="blue"
          />
          
          <StatCard
            icon={<Users className="w-8 h-8 text-green-500" />}
            title="Active Users"
            value={stats.active_users_now}
            subtitle="Connected right now"
            color="green"
          />
          
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
            title="Total Polls"
            value={stats.total_polls}
            subtitle={`${stats.total_votes} total votes`}
            color="purple"
          />
          
          <StatCard
            icon={<Clock className="w-8 h-8 text-orange-500" />}
            title="Avg Response Time"
            value={`${stats.avg_response_time_ms.toFixed(1)}ms`}
            subtitle="API performance"
            color="orange"
          />
        </div>

        {stats.most_popular_poll && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Most Popular Poll
            </h2>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <p className="text-lg text-gray-700 font-medium mb-2">
                  {stats.most_popular_poll.question}
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.most_popular_poll.total_votes} votes
                </p>
              </div>
              <button
                onClick={() => window.open(`${FRONTEND_URL}`, '_blank')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                View Polls
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              System Health
            </h2>
            <div className="space-y-4">
              <HealthMetric
                label="API Status"
                value="Operational"
                status="healthy"
              />
              <HealthMetric
                label="Response Time"
                value={`${stats.avg_response_time_ms.toFixed(1)}ms`}
                status={stats.avg_response_time_ms < 100 ? 'healthy' : 'warning'}
              />
              <HealthMetric
                label="Database"
                value="Connected"
                status="healthy"
              />
              <HealthMetric
                label="Cache"
                value="Active"
                status="healthy"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium">
                Export All Data
              </button>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all font-medium">
                Generate Report
              </button>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium">
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-75">{subtitle}</p>
    </div>
  );
}

interface HealthMetricProps {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
}

function HealthMetric({ label, value, status }: HealthMetricProps) {
  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-gray-600">{value}</span>
    </div>
  );
}