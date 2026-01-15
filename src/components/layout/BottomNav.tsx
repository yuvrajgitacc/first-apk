import { Home, CalendarDays, Timer, Users, BarChart3, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "calendar", icon: CalendarDays, label: "Schedule" },
  { id: "focus", icon: Timer, label: "Focus" },
  { id: "habits", icon: Flame, label: "Habits" },
  { id: "friends", icon: Users, label: "Friends" },
  { id: "progress", icon: BarChart3, label: "Progress" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-6 pt-2">
      <div className="neu-flat rounded-2xl px-1 py-2 w-full max-w-lg mx-auto overflow-hidden">
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 min-w-0 py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "neu-pressed text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 shrink-0",
                    isActive && "scale-110"
                  )}
                />
                <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export { BottomNav };
