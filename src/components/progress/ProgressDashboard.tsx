import { NeuCard } from "@/components/ui/NeuCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TrendingUp, Clock, CheckCircle2, Target, Calendar, BarChart3 } from "lucide-react";

interface DailyFocusData {
  day: string;
  hours: number;
}

interface ProgressStats {
  dailyProgress: number;
  todayFocusHours: number;
  tasksCompleted: number;
  totalTasks: number;
  currentStreak: number;
  dailyHistory: DailyFocusData[];
}

interface ProjectProgress {
  id: string;
  name: string;
  hoursSpent: number;
  totalHours: number;
  progress: number;
}

interface ProgressDashboardProps {
  stats: ProgressStats;
  projects: ProjectProgress[];
}

const ProgressDashboard = ({ stats, projects }: ProgressDashboardProps) => {
  const maxHours = Math.max(...stats.dailyHistory.map(d => d.hours), 1);

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <NeuCard className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Daily Progress</h3>
          <p className="text-sm text-muted-foreground">Today's study goal status</p>
        </div>
        <ProgressRing
          progress={stats.dailyProgress}
          size={80}
          strokeWidth={8}
          label="Progress"
        />
      </NeuCard>

      {/* Daily Focus Chart */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Daily Focus Hours</h3>
        </div>
        <NeuCard className="p-4 pt-6">
          <div className="flex items-end justify-between h-40 gap-2">
            {stats.dailyHistory.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-primary/20 rounded-t-lg transition-all duration-500 group-hover:bg-primary/40"
                    style={{ height: `${(data.hours / maxHours) * 100}%` }}
                  />
                  <div
                    className="absolute -top-8 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {data.hours}h
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">{data.day}</span>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <NeuCard className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="neu-pressed rounded-lg p-2">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.todayFocusHours}h</p>
          <p className="text-xs text-muted-foreground">Focus Time</p>
        </NeuCard>

        <NeuCard className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="neu-pressed rounded-lg p-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Tasks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.tasksCompleted}
            <span className="text-sm text-muted-foreground font-normal">/{stats.totalTasks}</span>
          </p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </NeuCard>

        <NeuCard className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="neu-pressed rounded-lg p-2">
              <Calendar className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.currentStreak}d</p>
          <p className="text-xs text-muted-foreground">Focus Streak</p>
        </NeuCard>
      </div>

    </div>
  );
};

export { ProgressDashboard };
export type { ProgressStats, ProjectProgress, DailyFocusData };
