import { useState } from "react";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Clock, MoreVertical, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/components/home/TaskWidget";

interface TaskListProps {
  tasks: Task[];
  onAddTask: () => void;
  onCompleteTask: (taskId: string) => void;
}

type TabType = "inProgress" | "completed";

const TaskList = ({ tasks, onAddTask, onCompleteTask }: TaskListProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("inProgress");

  const filteredTasks = tasks.filter((task) =>
    activeTab === "inProgress"
      ? task.status !== "completed"
      : task.status === "completed"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Tasks</h2>
        <NeuButton size="icon" variant="primary" onClick={onAddTask}>
          <Plus className="w-5 h-5" />
        </NeuButton>
      </div>

      {/* Tabs */}
      <NeuCard variant="pressed" className="p-1 flex gap-2">
        <button
          onClick={() => setActiveTab("inProgress")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            activeTab === "inProgress"
              ? "bg-primary text-primary-foreground shadow-neu-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            activeTab === "completed"
              ? "bg-primary text-primary-foreground shadow-neu-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Completed
        </button>
      </NeuCard>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <NeuCard variant="pressed" className="text-center py-8">
            <p className="text-muted-foreground">
              {activeTab === "inProgress"
                ? "No tasks in progress"
                : "No completed tasks"}
            </p>
          </NeuCard>
        ) : (
          filteredTasks.map((task) => (
            <NeuCard key={task.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {task.status !== "completed" && (
                    <NeuButton
                      size="icon"
                      variant="icon"
                      className="p-2"
                      onClick={() => onCompleteTask(task.id)}
                    >
                      <Check className="w-4 h-4" />
                    </NeuButton>
                  )}
                  <NeuButton size="icon" variant="icon" className="p-2">
                    <MoreVertical className="w-4 h-4" />
                  </NeuButton>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {task.hours} / {task.totalHours} Hrs
                  </span>
                </div>
                <span className="font-medium text-primary">
                  {Math.round((task.hours / task.totalHours) * 100)}%
                </span>
              </div>

              <ProgressBar
                progress={(task.hours / task.totalHours) * 100}
                variant={task.status === "completed" ? "success" : "default"}
              />
            </NeuCard>
          ))
        )}
      </div>
    </div>
  );
};

export { TaskList };
