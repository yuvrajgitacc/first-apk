import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "success" | "accent";
}

const ProgressBar = ({
  progress,
  className,
  showLabel = false,
  variant = "default",
}: ProgressBarProps) => {
  const variantClasses = {
    default: "bg-gradient-to-r from-primary to-amber-400",
    success: "bg-gradient-to-r from-success to-emerald-400",
    accent: "bg-gradient-to-r from-primary to-orange-400",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="neu-pressed rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  );
};

export { ProgressBar };
