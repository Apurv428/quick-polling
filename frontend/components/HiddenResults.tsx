// @ts-nocheck
"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HiddenResultsProps {
  isHidden: boolean;
  hasVoted: boolean;
  onVoteToReveal?: () => void;
}

export default function HiddenResults({
  isHidden,
  hasVoted,
  onVoteToReveal,
}: HiddenResultsProps) {
  if (!isHidden || hasVoted) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-dashed">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md">
            <EyeOff className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Results Hidden
          </h3>
          <p className="text-sm text-muted-foreground">
            Vote on this poll to see the results and avoid bias!
          </p>
        </div>

        <Badge variant="secondary" className="gap-2">
          <Eye className="h-3 w-3" />
          Reveal results after voting
        </Badge>

        {onVoteToReveal && (
          <Button
            onClick={onVoteToReveal}
            className="mt-4"
            variant="default"
          >
            Vote to See Results
          </Button>
        )}
      </div>
    </Card>
  );
}