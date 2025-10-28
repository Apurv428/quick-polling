// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, MessageSquare, ThumbsUp, Clock, Globe } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

interface Analytics {
  totalVotes: number;
  totalLikes: number;
  votesOverTime: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
  };
  geographic: {
    byCountry: Record<string, number>;
    byRegion: Record<string, number>;
  };
  peakTimes: {
    byHour: Record<string, number>;
    byDayOfWeek: Record<string, number>;
  };
  optionDistribution: Array<{
    option: string;
    votes: number;
    percentage: number;
  }>;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AnalyticsDashboard({ pollId }: { pollId: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [pollId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const dailyVotesData = Object.entries(analytics.votesOverTime.daily).map(([date, count]) => ({
    date,
    votes: count,
  }));

  const hourlyVotesData = Object.entries(analytics.peakTimes.byHour)
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      votes: count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const dayOfWeekData = Object.entries(analytics.peakTimes.byDayOfWeek).map(([day, count]) => ({
    day: DAYS[parseInt(day)],
    votes: count,
  }));

  const countryData = Object.entries(analytics.geographic.byCountry)
    .map(([country, count]) => ({
      country,
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {analytics.optionDistribution.length} options
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLikes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics.totalLikes / Math.max(analytics.totalVotes, 1) * 100).toFixed(1)}% like rate
            </p>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Vote Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="peak">Peak Times</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution by Option</CardTitle>
              <CardDescription>How votes are distributed across options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.optionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ option, percentage }) => `${option}: ${percentage.toFixed(1)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {analytics.optionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Option Comparison</CardTitle>
              <CardDescription>Bar chart comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.optionDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="option" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Votes Over Time (Daily)</CardTitle>
              <CardDescription>Daily voting activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyVotesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="votes"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peak" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Clock className="inline mr-2 h-5 w-5" />
                Peak Voting Times (by Hour)
              </CardTitle>
              <CardDescription>When do people vote most?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyVotesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Voting Days</CardTitle>
              <CardDescription>Vote distribution by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Globe className="inline mr-2 h-5 w-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Where are voters from? (Top 10 countries)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}