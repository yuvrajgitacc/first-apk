import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface NeuCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "pressed" | "convex" | "concave";
}

const NeuCard = forwardRef<HTMLDivElement, NeuCardProps>(
  ({ className, variant = "flat", children, ...props }, ref) => {
    const variantClasses = {
      flat: "neu-flat",
      pressed: "neu-pressed",
      convex: "neu-convex",
      concave: "neu-concave",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-4",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeuCard.displayName = "NeuCard";

export { NeuCard };
