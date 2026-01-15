import { useState, useEffect, useCallback } from "react";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { Play, Pause, RotateCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FocusTimerProps {
  onSessionComplete?: (minutes: number) => void;
}

const FocusTimer = ({ onSessionComplete }: FocusTimerProps) => {
  // Load initial state from localStorage
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('focusTimer');
    return saved ? JSON.parse(saved).seconds : 0;
  });
  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem('focusTimer');
    if (saved) {
      const data = JSON.parse(saved);
      // Check if timer was running and restore it
      if (data.isRunning && data.lastUpdate) {
        const elapsed = Math.floor((Date.now() - data.lastUpdate) / 1000);
        setSeconds(data.seconds + elapsed);
        return true;
      }
    }
    return false;
  });
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('focusTimer');
    return saved ? JSON.parse(saved).sessions : 0;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('focusTimer', JSON.stringify({
      seconds,
      isRunning,
      sessions,
      lastUpdate: Date.now()
    }));
  }, [seconds, isRunning, sessions]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, "0") + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSave = () => {
    if (seconds > 0) {
      const minutes = Math.max(Math.floor(seconds / 60), 1); // At least 1 minute
      onSessionComplete?.(minutes);
      setSessions((prev) => prev + 1);
      toast.success(`Recorded ${minutes} minute${minutes > 1 ? 's' : ''} of focus!`);
      handleReset();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = (seconds % 3600) / 3600 * 100;
  const radius = 100;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <NeuCard className="flex flex-col items-center py-8 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">Stopwatch Focus</h3>
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Record your deep work sessions</p>
      </div>

      <div className="relative">
        <svg width={240} height={240} className="transform -rotate-90">
          <circle
            cx={120}
            cy={120}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={12}
            className="opacity-30"
          />
          <circle
            cx={120}
            cy={120}
            r={radius}
            fill="none"
            stroke="url(#focusGradient)"
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary)/0.6)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-foreground tracking-tighter">
            {formatTime(seconds)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {isRunning ? "Recording" : "Paused"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <NeuButton size="icon" variant="icon" onClick={handleReset} className="w-12 h-12">
          <RotateCcw className="w-5 h-5" />
        </NeuButton>
        <NeuButton
          variant="primary"
          size="lg"
          onClick={toggleTimer}
          className="px-10 h-14 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </NeuButton>
        <NeuButton
          size="icon"
          variant="icon"
          onClick={handleSave}
          className={cn("w-12 h-12 transition-all", seconds > 0 ? "text-primary border-primary/30" : "opacity-50")}
          disabled={seconds === 0}
        >
          <Target className="w-5 h-5" />
        </NeuButton>
      </div>

      <div className="flex items-center gap-6 px-6 py-3 bg-muted/5 rounded-2xl border border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Sessions</p>
          <p className="text-xl font-bold">{sessions}</p>
        </div>
        <div className="w-px h-8 bg-border/50" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Total Recorded</p>
          <p className="text-xl font-bold text-primary">{Math.floor(seconds / 60)}m</p>
        </div>
      </div>
    </NeuCard>
  );
};

export { FocusTimer };
