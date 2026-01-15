import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { NeuButton } from "@/components/ui/NeuButton";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <NeuButton size="icon" variant="icon" className="w-11 h-11">
        <Sun className="w-5 h-5 opacity-0" />
      </NeuButton>
    );
  }

  return (
    <NeuButton
      size="icon"
      variant="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-11 h-11"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-primary animate-in zoom-in duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-primary animate-in zoom-in duration-300" />
      )}
    </NeuButton>
  );
};
