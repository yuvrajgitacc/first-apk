import { NeuCard } from "@/components/ui/NeuCard";
import { CheckCircle2, Clock, Target, Flame } from "lucide-react";

interface StatsWidgetProps {
  tasksCompleted: number;
  totalTasks: number;
  focusHours: number;
  streak: number;
}

const StatsWidget = ({ tasksCompleted, totalTasks, focusHours, streak }: StatsWidgetProps) => {
  const stats = [
    {
      icon: CheckCircle2,
      label: "Completed",
      value: `${tasksCompleted}/${totalTasks}`,
      color: "text-success",
    },
    {
      icon: Clock,
      label: "Focus Hours",
      value: `${focusHours}h`,
      color: "text-primary",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${streak} days`,
      color: "text-destructive",
    },
    {
      icon: Target,
      label: "Goals",
      value: "3/5",
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <NeuCard key={index} className="flex items-center gap-3 py-3">
          <div className="neu-pressed rounded-lg p-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </NeuCard>
      ))}
    </div>
  );
};

export { StatsWidget };
