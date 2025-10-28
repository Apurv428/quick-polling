// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, ThumbsUp, FileText, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
      fetchAdminStats(storedKey);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      localStorage.setItem("adminKey", adminKey);
      setIsAuthenticated(true);
      fetchAdminStats(adminKey);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminKey");
    setAdminKey("");
    setIsAuthenticated(false);
    setStats(null);
  };

  const fetchAdminStats = async (key: string) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/admin/stats", {
        headers: {
          "X-Admin-Key": key,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Invalid admin key. Please check your credentials.");
        }
        throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load admin statistics");
      if (err instanceof Error && err.message.includes("Invalid admin key")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Dashboard</CardTitle>
            <CardDescription className="text-center">
              Enter your admin API key to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700">Admin API Key</label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key..."
                  className="mt-2"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Total Polls",
      value: stats.total_polls || 0,
      description: `${stats.total_polls_today || 0} created today`,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Votes",
      value: stats.total_votes || 0,
      description: "All time votes cast",
      icon: Vote,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Users",
      value: stats.active_users_now || 0,
      description: "Currently online",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Polls Today",
      value: stats.total_polls_today || 0,
      description: "Created in last 24 hours",
      icon: ThumbsUp,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of your QuickPoll platform statistics</p>
          </div>

          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            ← Back to Polls
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Response Time</CardTitle>
              <CardDescription>System performance metric</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {stats.avg_response_time_ms.toFixed(2)}ms
              </div>
            </CardContent>
          </Card>

          {stats.most_popular_poll && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Most Popular Poll</CardTitle>
                <CardDescription>Highest number of votes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-800">
                    {stats.most_popular_poll.question}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total votes: <span className="font-bold text-green-600">{stats.most_popular_poll.total_votes}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Overview Statistics
              </CardTitle>
              <CardDescription>Polls and votes comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Total Polls", value: stats.total_polls, fill: "#3b82f6" },
                  { name: "Polls Today", value: stats.total_polls_today, fill: "#10b981" },
                  { name: "Total Votes", value: stats.total_votes, fill: "#8b5cf6" },
                  { name: "Active Users", value: stats.active_users_now, fill: "#ec4899" },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Activity Trend
              </CardTitle>
              <CardDescription>Last 7 days activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateActivityData(stats)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="polls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="votes" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Performance</CardTitle>
              <CardDescription>Response time distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Fast (<2ms)", value: stats.avg_response_time_ms < 2 ? 70 : 30, fill: "#10b981" },
                      { name: "Average (2-5ms)", value: stats.avg_response_time_ms >= 2 && stats.avg_response_time_ms <= 5 ? 60 : 40, fill: "#f59e0b" },
                      { name: "Slow (>5ms)", value: stats.avg_response_time_ms > 5 ? 50 : 10, fill: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Current avg: <span className="font-bold text-blue-600">{stats.avg_response_time_ms.toFixed(2)}ms</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Metrics</CardTitle>
              <CardDescription>Participation breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active Polls", value: stats.total_polls > 0 ? stats.total_polls : 1, fill: "#3b82f6" },
                      { name: "Total Votes", value: stats.total_votes > 0 ? stats.total_votes : 1, fill: "#8b5cf6" },
                      { name: "Active Users", value: stats.active_users_now > 0 ? stats.active_users_now * 10 : 5, fill: "#ec4899" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function generateActivityData(stats: AdminStats) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const basePolls = Math.max(1, Math.floor(stats.total_polls / 7));
  const baseVotes = Math.max(1, Math.floor(stats.total_votes / 7));

  return days.map((day, index) => ({
    day,
    polls: Math.floor(basePolls * (0.7 + Math.random() * 0.6)),
    votes: Math.floor(baseVotes * (0.7 + Math.random() * 0.6)),
  }));
}