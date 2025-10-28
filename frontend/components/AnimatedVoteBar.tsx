// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const AnimatedVoteBar = (props) => {
  const { option, percentage, votes, isSelected, className } = props;

  return (
    <div className={cn("relative overflow-hidden rounded-lg border", className)}>
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          isSelected
            ? "from-blue-500 to-purple-500"
            : "from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentage, isSelected ? 100 : 0)}%` }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          duration: 0.8,
        }}
      />

      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-medium",
            isSelected ? "text-white" : "text-gray-900 dark:text-gray-100"
          )}>
            {option}
          </span>
          <motion.span
            className={cn(
              "text-sm font-semibold",
              isSelected ? "text-white" : "text-gray-600 dark:text-gray-400"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {votes} {votes === 1 ? "vote" : "votes"}
          </motion.span>
        </div>

        <motion.span
          className={cn(
            "text-lg font-bold",
            isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
          )}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {percentage.toFixed(1)}%
        </motion.span>
      </div>

      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  );
};

export default AnimatedVoteBar;