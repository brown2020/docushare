import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
      )}
      <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
