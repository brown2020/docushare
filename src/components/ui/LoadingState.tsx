import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingState({
  text,
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className
      )}
    >
      <LoaderCircle
        className={cn("animate-spin text-blue-600", sizeClasses[size])}
      />
      {text && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
      )}
    </div>
  );
}
