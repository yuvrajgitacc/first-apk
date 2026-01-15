import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "icon" | "pressed";
  size?: "sm" | "md" | "lg" | "icon";
}

const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const baseClasses = "neu-button rounded-xl font-medium transition-all duration-200 active:scale-95";
    
    const variantClasses = {
      default: "text-foreground hover:text-primary",
      primary: "bg-primary text-primary-foreground shadow-neu-accent hover:brightness-110",
      icon: "text-foreground hover:text-primary",
      pressed: "neu-pressed text-foreground",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-3",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variant !== "primary" && variantClasses[variant],
          variant === "primary" && variantClasses.primary,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeuButton.displayName = "NeuButton";

export { NeuButton };
