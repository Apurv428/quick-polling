// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Flame, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/config";

interface TrendingPoll {
  id: string;
  title: string;
  trendingScore: number;
  likes: number;
  commentCount: number;
  options: Array<{ id: string; text: string; votes: number }>;
  createdAt: string;
}

export default function TrendingPolls() {
  const [trendingPolls, setTrendingPolls] = useState<TrendingPoll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingPolls();
    const interval = setInterval(fetchTrendingPolls, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrendingPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/polls/trending?limit=5`);
      const data = await response.json();
      setTrendingPolls(data);
    } catch (error) {
      console.error("Failed to fetch trending polls:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingPolls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending polls yet. Create one to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
          Trending Polls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendingPolls.map((poll, index) => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            const timeAgo = new Date(poll.createdAt).toLocaleDateString();

            return (
              <div
                key={poll.id}
                className="p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  const pollElement = document.getElementById(poll.id);
                  if (pollElement) {
                    pollElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    pollElement.classList.add("ring-2", "ring-primary");
                    setTimeout(() => {
                      pollElement.classList.remove("ring-2", "ring-primary");
                    }, 2000);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </span>
                </div>

                <h4 className="font-medium text-sm mb-2 line-clamp-2">{poll.title}</h4>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{totalVotes} votes</span>
                  <span>•</span>
                  <span>{poll.likes} likes</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                      style={{
                        width: `${Math.min((poll.trendingScore / trendingPolls[0].trendingScore) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {poll.trendingScore.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}