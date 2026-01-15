import { useState } from "react";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Clock, Users, Plus, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  hours: number;
  totalHours: number;
  priority: "urgent" | "normal" | "low";
  assignees: number;
  status: "todo" | "inProgress" | "completed";
  subtasks?: SubTask[];
}

interface TaskWidgetProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const priorityColors = {
  urgent: "text-destructive",
  normal: "text-primary",
  low: "text-muted-foreground",
};

const priorityLabels = {
  urgent: "Urgent",
  normal: "Normal",
  low: "Low",
};

const TaskWidget = ({ tasks, onAddTask, onUpdateTask }: TaskWidgetProps) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const toggleTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    onUpdateTask?.(taskId, { subtasks: updatedSubtasks });
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    const newSubtask: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtaskTitle,
      completed: false
    };

    onUpdateTask?.(taskId, {
      subtasks: [...(task?.subtasks || []), newSubtask]
    });
    setNewSubtaskTitle("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
        <NeuButton size="icon" onClick={onAddTask}>
          <Plus className="w-5 h-5" />
        </NeuButton>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
          const totalSubtasks = task.subtasks?.length || 0;
          const progress = totalSubtasks > 0
            ? (completedSubtasks / totalSubtasks) * 100
            : (task.hours / task.totalHours) * 100;

          return (
            <NeuCard key={task.id} className="space-y-3 cursor-pointer" onClick={() => toggleTask(task.id)}>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <span className={cn("text-xs font-medium", priorityColors[task.priority])}>
                    {priorityLabels[task.priority]}
                  </span>
                  <div className="flex items-center gap-2">
                    <h4 className={cn("font-medium text-foreground", task.status === 'completed' && "line-through opacity-50")}>
                      {task.title}
                    </h4>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <NeuButton
                    size="icon"
                    variant="icon"
                    className="p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTask?.(task.id, { status: task.status === 'completed' ? 'inProgress' : 'completed' });
                    }}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </NeuButton>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              <ProgressBar
                progress={progress}
                variant={task.priority === "urgent" ? "accent" : "default"}
              />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} Tasks` : `${task.hours}/${task.totalHours} Hrs`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{task.assignees}</span>
                </div>
              </div>

              {/* Subtasks Section */}
              {isExpanded && (
                <div className="pt-4 mt-2 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtasks</h5>
                  <div className="space-y-2">
                    {task.subtasks?.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-xl neu-pressed bg-background/50">
                        <Checkbox
                          id={subtask.id}
                          checked={subtask.completed}
                          onCheckedChange={() => handleToggleSubtask(task.id, subtask.id)}
                        />
                        <label
                          htmlFor={subtask.id}
                          className={cn("text-sm flex-1 cursor-pointer", subtask.completed && "line-through opacity-50")}
                        >
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 bg-background neu-pressed rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                    />
                    <NeuButton size="icon" className="h-9 w-9" onClick={() => handleAddSubtask(task.id)}>
                      <Plus className="w-4 h-4" />
                    </NeuButton>
                  </div>
                </div>
              )}
            </NeuCard>
          );
        })}
      </div>
    </div>
  );
};

export { TaskWidget };
export type { Task, SubTask };
