// @ts-nocheck
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PollSkeleton = (props) => {
  const { className } = props;

  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
       
        <div className="flex items-center justify-between pt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PollListSkeleton = (props) => {
  const { count = 3 } = props;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PollSkeleton key={i} />
      ))}
    </div>
  );
};

export { PollSkeleton, PollListSkeleton };