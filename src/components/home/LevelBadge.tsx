import { NeuCard } from "@/components/ui/NeuCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkles } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  currentXP: number;
  requiredXP: number;
}

const LevelBadge = ({ level, currentXP, requiredXP }: LevelBadgeProps) => {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <NeuCard className="flex items-center gap-4">
      <div className="neu-pressed rounded-xl p-3 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary animate-pulse-glow" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Level {level}</span>
          <span className="text-xs text-muted-foreground">
            {currentXP} / {requiredXP} XP
          </span>
        </div>
        <ProgressBar progress={progress} variant="accent" />
      </div>
    </NeuCard>
  );
};

export { LevelBadge };
