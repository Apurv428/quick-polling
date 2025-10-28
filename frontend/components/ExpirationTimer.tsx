// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

interface ExpirationTimerProps {
  expiresAt: string | null;
  status?: string;
}

export default function ExpirationTimer({ expiresAt, status }: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState<"normal" | "warning" | "urgent">("normal");

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      try {
        const expiryDate = parseISO(expiresAt);
        const now = new Date();

        if (isPast(expiryDate) || status === "expired") {
          setIsExpired(true);
          setTimeLeft("Expired");
          return;
        }

        const timeRemaining = formatDistanceToNow(expiryDate, { addSuffix: true });
        setTimeLeft(timeRemaining);

        const hoursLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft < 1) {
          setUrgency("urgent");
        } else if (hoursLeft < 24) {
          setUrgency("warning");
        } else {
          setUrgency("normal");
        }
      } catch (error) {
        console.error("Failed to parse expiration date:", error);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (!expiresAt) return null;

  const getVariant = () => {
    if (isExpired) return "destructive";
    if (urgency === "urgent") return "destructive";
    if (urgency === "warning") return "default";
    return "secondary";
  };

  const getIcon = () => {
    if (isExpired || urgency === "urgent") {
      return <AlertCircle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  return (
    <Badge variant={getVariant()} className="gap-1">
      {getIcon()}
      {isExpired ? "Expired" : `Expires ${timeLeft}`}
    </Badge>
  );
}