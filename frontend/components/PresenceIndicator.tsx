// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const PresenceIndicator = (props) => {
  const { viewerCount, className } = props;

  if (!viewerCount || viewerCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-gradient-to-r from-green-500 to-emerald-500",
        "text-white text-xs font-medium shadow-sm",
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Eye className="h-3 w-3" />
      </motion.div>
      <span>{viewerCount} viewing</span>
    </motion.div>
  );
};

export default PresenceIndicator;