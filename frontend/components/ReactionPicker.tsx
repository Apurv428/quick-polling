// @ts-nocheck
"use client";

import { useState } from "react";
import { Heart, Smile, ThumbsUp, Brain, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";

export type ReactionType = "like" | "love" | "laugh" | "think" | "sad";

interface Reaction {
  type: ReactionType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const reactions: Reaction[] = [
  { type: "like", icon: <ThumbsUp className="h-4 w-4" />, label: "Like", color: "text-blue-500" },
  { type: "love", icon: <Heart className="h-4 w-4" />, label: "Love", color: "text-red-500" },
  { type: "laugh", icon: <Smile className="h-4 w-4" />, label: "Laugh", color: "text-yellow-500" },
  { type: "think", icon: <Brain className="h-4 w-4" />, label: "Think", color: "text-purple-500" },
  { type: "sad", icon: <Frown className="h-4 w-4" />, label: "Sad", color: "text-gray-500" },
];

interface ReactionPickerProps {
  pollId: string;
  userId: string;
  currentReaction?: ReactionType;
  reactionCounts: Record<ReactionType, number>;
  onReactionChange: (reactions: Record<ReactionType, number>) => void;
}

export default function ReactionPicker({
  pollId,
  userId,
  currentReaction,
  reactionCounts,
  onReactionChange,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReaction = async (reactionType: ReactionType) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId,
          userId,
          reactionType,
        }),
      });

      if (!response.ok) throw new Error("Failed to react");

      const data = await response.json();
      onReactionChange(data.reactions || {});
      setShowPicker(false);
    } catch (error) {
      console.error("Failed to react:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative inline-block">
      {currentReaction ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            "gap-2 transition-all",
            reactions.find((r) => r.type === currentReaction)?.color
          )}
        >
          {reactions.find((r) => r.type === currentReaction)?.icon}
          <span>{totalReactions > 0 && totalReactions}</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="gap-2"
        >
          <Smile className="h-4 w-4" />
          {totalReactions > 0 && <span>{totalReactions}</span>}
        </Button>
      )}

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 flex gap-1 z-50">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              disabled={isSubmitting}
              className={cn(
                "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all",
                "hover:scale-110 active:scale-95",
                reaction.color,
                currentReaction === reaction.type && "bg-gray-100 dark:bg-gray-700",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              title={reaction.label}
            >
              {reaction.icon}
              {reactionCounts[reaction.type] > 0 && (
                <span className="text-xs ml-1">{reactionCounts[reaction.type]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {totalReactions > 0 && !showPicker && (
        <div className="text-xs text-muted-foreground mt-1">
          {Object.entries(reactionCounts)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => {
              const reaction = reactions.find((r) => r.type === type);
              return (
                <span key={type} className="mr-2">
                  {reaction?.label}: {count}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}