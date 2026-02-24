import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { LevelBadge } from "@/components/home/LevelBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatsWidget } from "@/components/home/StatsWidget";
import { TaskWidget, type Task } from "@/components/home/TaskWidget";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { CalendarWidget, type Event } from "@/components/calendar/CalendarWidget";
import { EventList } from "@/components/calendar/EventList";
import { FriendsList, type Friend } from "@/components/friends/FriendsList";
import { ChatWindow, type Message } from "@/components/friends/ChatWindow";
import { ProgressDashboard, type ProgressStats, type ProjectProgress } from "@/components/progress/ProgressDashboard";
import { TaskList } from "@/components/tasks/TaskList";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { Skeleton } from "@/components/ui/skeleton";
import { NatureBackdrop } from "@/components/habits/NatureBackdrop";
import { Menu, Bell, User, ClipboardList, PlusCircle, ArrowLeft, ArrowRight, LogOut, Search, X, Paperclip, Camera, Flame, CheckCircle2, Timer, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn, formatDateLocal } from "@/lib/utils";
import { initSocket, socket } from "@/lib/socket";
import { API_URL, authFetch } from "@/lib/api";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data


const mockEvents: Event[] = [
  { id: "1", title: "Team Meeting", date: new Date(), time: "9:00 AM", category: "meeting" },
  { id: "2", title: "Gym Session", date: new Date(), time: "6:00 PM", category: "exercise" },
  { id: "3", title: "Project Review", date: new Date(Date.now() + 86400000), time: "2:00 PM", category: "work" },
];

const mockFriends: Friend[] = [
  { id: "1", name: "Alex Chen", avatar: "", level: 15, status: "online" },
  { id: "2", name: "Sarah Parker", avatar: "", level: 12, status: "busy", lastActive: "In focus mode" },
  { id: "3", name: "Mike Johnson", avatar: "", level: 8, status: "offline", lastActive: "2h ago" },
  { id: "4", name: "Emma Wilson", avatar: "", level: 20, status: "online" },
];



const mockProjects: ProjectProgress[] = [];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [chatFriend, setChatFriendState] = useState<Friend | null>(null);
  const chatFriendRef = useRef<Friend | null>(null);

  const setChatFriend = (friend: Friend | null) => {
    setChatFriendState(friend);
    chatFriendRef.current = friend;
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [level, setLevel] = useState(7);
  const [xp, setXp] = useState(2450);
  const [focusHours, setFocusHours] = useState(0);
  const [events, setEvents] = useState(mockEvents);
  const [profileData, setProfileData] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [dailyHistory, setDailyHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem("currentUser"));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [editHabitName, setEditHabitName] = useState("");
  const [selectedHabitDays, setSelectedHabitDays] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileError, setProfileError] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [theme, setTheme] = useState('default');
  const [uiStyle, setUiStyle] = useState('solid');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);
  const [friendProfileData, setFriendProfileData] = useState<any>(null);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.removeAttribute('data-theme');
    if (newTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleStyleChange = (newStyle: string) => {
    setUiStyle(newStyle);
    document.documentElement.removeAttribute('data-style');
    if (newStyle !== 'solid') {
      document.documentElement.setAttribute('data-style', newStyle);
    }
  };

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      // Handle off-screen notifications
      const isNotVisible = !chatFriendRef.current || chatFriendRef.current.name.toLowerCase() !== (msg.sender || "").toLowerCase();
      const isNotMe = (msg.sender || "").toLowerCase() !== currentUser?.toLowerCase();

      if (isNotVisible && isNotMe && msg.text) {
        toast(`New message from ${msg.sender}`, {
          description: msg.text.startsWith('file:') ? 'Shared a file' : msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : ''),
          action: {
            label: 'Reply',
            onClick: () => {
              const friend = friends.find(f => f.name.toLowerCase() === (msg.sender || "").toLowerCase());
              if (friend) setChatFriend(friend);
            }
          }
        });
      }
    };

    const handleXpGain = (data: any) => {
      setXp(data.new_xp);
      setLevel(data.level);
      toast.success(`+${data.amount} XP Earned!`, {
        description: data.level_up ? "LEVEL UP! 🌟" : "Keep pushing!",
        duration: 3000,
        position: "top-center",
        icon: <Flame className="w-5 h-5 text-primary animate-bounce" />
      });
    };

    const handleNotification = (data: any) => {
      // Refresh notifications and friends list
      if (currentUser) {
        fetchNotifications(currentUser);
        fetchFriends(currentUser);
      }
    };

    socket.on("xp_gain", handleXpGain);
    socket.on("new_message", handleNewMessage);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("xp_gain", handleXpGain);
      socket.off("new_message", handleNewMessage);
      socket.off("notification", handleNotification);
    };
  }, [currentUser, friends]);

  useEffect(() => {
    if (showProfile && !profileData && currentUser) {
      fetchProfile(currentUser);
    }
  }, [showProfile, profileData, currentUser]);

  const requiredXP = level * 1000;
  const completionRate = Math.round(
    (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
  );

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "normal",
    totalHours: 1,
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = (user: string) => {
    authFetch(`/api/user/profile?username=${user}`)
      .then(res => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      })
      .then(data => {
        setProfileData(data);
        setProfileError(false);
        setLevel(data.level || 1);
        setXp(data.xp || 0);
        const history = Object.entries(data.dailyStats || {}).map(([day, hours]) => ({
          day: day.split('-').slice(2).join(''),
          hours: hours as number
        })).slice(-7);
        setDailyHistory(history);
        setFocusHours(data.totalFocusHours || 0);
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
        setProfileError(true);
      });
  };

  const fetchTasks = (user: string) => {
    authFetch(`/api/tasks?username=${user}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setIsLoading(false);
      });
  };

  const handleFocusComplete = async (minutes: number) => {
    if (!currentUser || minutes < 1) return;
    const hours = Math.max(minutes / 60, 0.02); // Minimum 0.02 hours (1 minute)
    const roundedHours = Math.round(hours * 100) / 100; // Round to 2 decimals

    setFocusHours((prev) => prev + roundedHours);

    try {
      await authFetch(`/api/focus/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: roundedHours, username: currentUser }),
      });
      // Refresh profile to update chart
      setTimeout(() => fetchProfile(currentUser), 500);
    } catch (err) {
      console.error("Failed to track focus:", err);
    }

    setXp((prev) => Math.min(prev + Math.floor(minutes * 2), requiredXP - 1));
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      await authFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      toast.success("Task deleted");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const fetchNotifications = (user: string) => {
    authFetch(`/api/notifications?username=${user}`)
      .then(res => res.json())
      .then(setNotifications);
  };

  const handleDeleteNotification = (id: number) => {
    if (!currentUser) return;
    authFetch(`/api/notifications?username=${currentUser}&id=${id}`, {
      method: "DELETE",
    }).then(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    });
  };

  const handleClearAll = () => {
    if (!currentUser) return;
    authFetch(`/api/notifications/clear`, { method: "DELETE" })
      .then(() => setNotifications([]))
      .catch(err => console.error("Failed to clear notifications:", err));
  };

  const fetchHabits = (user: string) => {
    authFetch(`/api/habits?username=${user}`)
      .then(res => res.json())
      .then(setHabits)
      .catch(err => console.error("Habits fetch error:", err));
  };

  const fetchFriends = (user: string) => {
    authFetch(`/api/friends?username=${user}`)
      .then(res => res.json())
      .then(setFriends)
      .catch(err => console.error("Friends fetch error:", err));
  };

  const fetchEvents = (user: string) => {
    authFetch(`/api/events?username=${user}`)
      .then(res => res.json())
      .then(data => {
        const parsedEvents = data.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
        setEvents(parsedEvents);
      })
      .catch(err => console.error("Events fetch error:", err));
  };

  useEffect(() => {
    if (currentUser) {
      initSocket();
      fetchProfile(currentUser);
      fetchTasks(currentUser);
      fetchNotifications(currentUser);
      fetchHabits(currentUser);
      fetchFriends(currentUser);
      fetchEvents(currentUser);
    }
  }, [currentUser]);

  // Event Reminder Logic
  const notifiedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      const todayStr = formatDateLocal(now); // YYYY-MM-DD
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      events.forEach(event => {
        // Try to parse the event date. If it's a Date object, convert to string.
        const eventDateStr = event.date instanceof Date
          ? formatDateLocal(event.date)
          : event.date;

        if (eventDateStr === todayStr && event.time === currentTime && !notifiedEvents.current.has(event.id)) {
          // Show toast
          toast(`Event Starting: ${event.title}`, {
            description: `Scheduled for ${event.time}`,
            icon: <CalendarDays className="w-4 h-4 text-primary" />,
          });

          // Create notification in backend for bell icon
          if (currentUser) {
            authFetch(`/api/notifications/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: currentUser,
                title: 'Event Starting!',
                message: event.title,
                type: 'event'
              }),
            }).then(() => fetchNotifications(currentUser));
          }

          notifiedEvents.current.add(event.id);
        }
      });
    };

    const interval = setInterval(checkEvents, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [events, profileData, currentUser]);

  const handleSearchUsers = (q: string) => {
    setSearchQuery(q);
    if (q.length > 2) {
      authFetch(`/api/users/search?q=${q}`)
        .then(res => res.json())
        .then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = (target: string) => {
    authFetch(`/api/friends/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me: currentUser, target }),
    }).then(() => toast.success("Friend request sent!"));
  };

  const handleAcceptFriend = (sender: string, notifId: number) => {
    authFetch(`/api/friends/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me: currentUser, sender }),
    }).then((res) => {
      if (res.ok) {
        toast.success(`You are now friends with ${sender}!`);
        // Remove notification locally
        setNotifications(prev => prev.filter(n => n.id !== notifId));
        if (currentUser) fetchFriends(currentUser);
      }
    });
  };

  const toggleHabit = (habitId: number, dayIdx: number) => {
    if (!currentUser) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentCompletion = habit.completion.split('');
    currentCompletion[dayIdx] = currentCompletion[dayIdx] === '1' ? '0' : '1';
    const newCompletion = currentCompletion.join('');

    // Optimistically update
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completion: newCompletion } : h));

    authFetch(`/api/habits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: habitId, completion: newCompletion, username: currentUser }),
    }).catch(err => {
      console.error(`Failed to toggle habit ${habitId}:`, err);
      fetchHabits(currentUser); // Rollback
    });
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim() || !currentUser) return;

    // Create a temporary habit for optimistic UI
    const tempHabit = {
      id: Date.now(), // Temporary ID
      title: newHabitName,
      completion: "0000000",
      streak: 0,
    };

    setHabits(prev => [...prev, tempHabit]);
    setNewHabitName("");
    setIsHabitDialogOpen(false);

    try {
      const res = await authFetch(`/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tempHabit.title, username: currentUser }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update the temp habit with real ID
        setHabits(prev => prev.map(h => h.id === tempHabit.id ? { ...h, id: data.id } : h));
        toast.success("Habit created!");
      } else {
        setHabits(prev => prev.filter(h => h.id !== tempHabit.id));
        toast.error("Failed to add habit");
      }
    } catch (err) {
      setHabits(prev => prev.filter(h => h.id !== tempHabit.id));
      toast.error("Failed to add habit");
    }
  };

  const handleEditHabit = async () => {
    if (!editHabitName.trim() || !currentUser || !editingHabit) return;
    try {
      // Optimistic update
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, title: editHabitName } : h));
      setIsEditHabitDialogOpen(false);

      const res = await authFetch(`/api/habits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingHabit.id, title: editHabitName, username: currentUser }),
      });
      if (res.ok) {
        toast.success("Habit updated");
        setEditingHabit(null);
      } else {
        fetchHabits(currentUser); // Rollback
      }
    } catch (err) {
      console.error("Failed to edit habit:", err);
      if (currentUser) fetchHabits(currentUser); // Rollback
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    if (!currentUser) return;
    try {
      // Optimistic update
      setHabits(prev => prev.filter(h => h.id !== habitId));

      const res = await authFetch(`/api/habits?username=${currentUser}&id=${habitId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success("Habit deleted");
      } else {
        fetchHabits(currentUser); // Rollback
      }
    } catch (err) {
      console.error("Failed to delete habit:", err);
      fetchHabits(currentUser); // Rollback
    }
  };

  const handleAddTask = async (task: Task) => {
    if (!currentUser) return;
    setTasks([task, ...tasks]);
    try {
      await authFetch(`/api/tasks?username=${currentUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleChat = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) {
      setChatFriend(friend);
    }
  };

  const fetchFriendProfile = async (friendId: string) => {
    try {
      const res = await authFetch(`/api/user/profile?user=${friendId}`);
      const data = await res.json();
      setFriendProfileData(data);
    } catch (err) {
      console.error("Failed to fetch friend profile:", err);
      toast.error("Could not load friend profile");
    }
  };

  const renderContent = () => {
    if (chatFriend) {
      return (
        <ChatWindow
          friendName={chatFriend.name}
          friendAvatar={chatFriend.avatar}
          currentUser={currentUser}
          onBack={() => setChatFriend(null)}
          onViewProfile={() => {
            setViewingFriend(chatFriend);
            fetchFriendProfile(chatFriend.name);
          }}
        />
      );
    }

    switch (activeTab) {
      case "home":
        if (isLoading) {
          return (
            <div className="space-y-6 animate-pulse">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-48 w-full rounded-3xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          );
        }
        return (
          <div className="space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <h1 className="text-xl font-bold text-foreground">Home</h1>
              </div>
              <div className="flex items-center gap-2">
                <Popover onOpenChange={(open) => {
                  if (open && currentUser) fetchNotifications(currentUser);
                }}>
                  <PopoverTrigger asChild>
                    <NeuButton size="icon" variant="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      {notifications.some(n => !n.read) && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </NeuButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-background border-border shadow-2xl rounded-2xl">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <span className="font-bold">Notifications</span>
                      {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="text-[10px] text-primary font-bold uppercase hover:underline">Clear All</button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No alerts yet</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-border/50 hover:bg-muted/5 transition-colors relative group">
                            <button
                              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                              onClick={() => handleDeleteNotification(n.id)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="font-semibold text-sm">{n.title}</div>
                            <div className="text-xs text-muted-foreground">{n.message}</div>
                            <div className="text-[10px] text-muted-foreground/50 mt-1">{n.time}</div>

                            {n.type === 'friend_request' && (
                              <div className="mt-2">
                                <NeuButton
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    // Extract sender name from message "Name sent you..."
                                    const sender = n.sender;
                                    handleAcceptFriend(sender, n.id);
                                  }}
                                >
                                  Accept
                                </NeuButton>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <NeuButton size="icon" variant="icon" onClick={() => setShowProfile(true)}>
                  <User className="w-5 h-5" />
                </NeuButton>
              </div>
            </div>

            {/* Level Badge */}
            <LevelBadge level={level} currentXP={xp} requiredXP={requiredXP} />

            {/* Progress Ring */}
            <NeuCard className="flex flex-col items-center py-6">
              <ProgressRing
                progress={completionRate}
                size={140}
                strokeWidth={12}
                showPercentage
                label="Complete"
              />
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">To Do</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
              </div>
            </NeuCard>

            {/* Stats */}
            <StatsWidget
              tasksCompleted={tasks.filter((t) => t.status === "completed").length}
              totalTasks={tasks.length}
              focusHours={focusHours}
              streak={7}
            />

            {/* Tasks */}
            <TaskWidget
              tasks={tasks}
              onAddTask={() => setIsTaskDialogOpen(true)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-6 animate-scale-in">
            <h1 className="text-xl font-bold text-foreground">Schedule</h1>
            <CalendarWidget
              events={events}
              onDateSelect={setSelectedDate}
            />
            <EventList
              events={events}
              selectedDate={selectedDate}
              onAddEvent={(newEvent) => {
                if (!currentUser) return;
                const eventId = Math.random().toString(36).substr(2, 9);
                // For the UI, we need a Date object
                const uiEvent: Event = {
                  ...newEvent,
                  id: eventId,
                  date: newEvent.date instanceof Date ? newEvent.date : new Date(newEvent.date)
                };

                setEvents(prev => [...prev, uiEvent]);

                // For the backend, we send a string
                const backendEvent = {
                  ...uiEvent,
                  date: formatDateLocal(uiEvent.date)
                };

                authFetch(`/api/events?username=${currentUser}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backendEvent),
                }).then(() => toast.success("Event scheduled!"));
              }}
            />
          </div>
        );

      case "tasks":
        return (
          <div className="space-y-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <h1 className="text-xl font-bold text-foreground">Tasks</h1>
            </div>
            <TaskWidget
              tasks={tasks}
              onAddTask={() => setIsTaskDialogOpen(true)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        );

      case "focus":
        return (
          <div className="space-y-6 animate-scale-in">
            <h1 className="text-xl font-bold text-foreground">Focus Timer</h1>
            <FocusTimer onSessionComplete={handleFocusComplete} />
            <NeuCard className="space-y-3">
              <h3 className="font-semibold text-foreground">Today's Focus</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="neu-pressed rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{focusHours}h</p>
                  <p className="text-xs text-muted-foreground">Total Focus</p>
                </div>
                <div className="neu-pressed rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </div>
            </NeuCard>
          </div>
        );

      case "friends":
        return (
          <div className="space-y-6 animate-scale-in">
            <h1 className="text-xl font-bold text-foreground">Friends</h1>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="neu-pressed bg-background border-none h-12 rounded-2xl pl-4"
                />
              </div>
              {searchResults.length > 0 ? (
                <NeuCard className="p-2 space-y-1">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 hover:bg-muted/5 rounded-xl">
                      <span className="font-medium">{u.username}</span>
                      <NeuButton size="sm" onClick={() => {
                        handleAddFriend(u.username);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}>Add</NeuButton>
                    </div>
                  ))}
                </NeuCard>
              ) : searchQuery.length > 2 && (
                <div className="text-center p-4 text-muted-foreground text-sm font-medium">No users found for "{searchQuery}"</div>
              )}
            </div>
            <FriendsList
              friends={friends}
              onChat={handleChat}
              onAddFriend={() => { }}
              onViewProfile={(f) => {
                setViewingFriend(f);
                fetchFriendProfile(f.name);
              }}
            />
          </div>
        );

      case "progress":
        return (
          <div className="space-y-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <h1 className="text-xl font-bold text-foreground">Progress Tracking</h1>
            </div>
            <ProgressDashboard
              stats={{
                dailyProgress: completionRate,
                todayFocusHours: focusHours,
                tasksCompleted: tasks.filter(t => t.status === 'completed').length,
                totalTasks: tasks.length,
                currentStreak: 7,
                dailyHistory: dailyHistory,
                habitHistory: [0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                  const dayName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIdx];
                  const doneCount = habits.filter(h => h.completion && h.completion[dayIdx] === '1').length;
                  const total = habits.length || 1;
                  return { day: dayName, rate: Math.round((doneCount / total) * 100) };
                })
              }}
              projects={mockProjects}
            />
          </div>
        );

      case "habits":
        const currentDayIdx = (new Date().getDay() + 6) % 7; // Adjust to Mon=0
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        return (
          <div className="animate-scale-in pb-28 -mx-4">
            {/* Header Area */}
            <div className="px-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <h1 className="text-xl font-bold tracking-tight">Today</h1>
              </div>
              <NeuButton size="icon" variant="icon">
                <Menu className="w-5 h-5" />
              </NeuButton>
            </div>

            {/* Date Scroller */}
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
              {days.map((day, i) => {
                const isToday = i === currentDayIdx;
                const d = new Date(Date.now() - (currentDayIdx - i) * 86400000);
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex flex-col items-center min-w-[50px] py-3 rounded-2xl transition-all",
                      isToday ? "bg-foreground/5 shadow-inner" : "opacity-40"
                    )}
                  >
                    <span className="text-[10px] font-black uppercase mb-1">{day}</span>
                    <span className={cn(
                      "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full",
                      isToday && "bg-primary text-white"
                    )}>{d.getDate()}</span>
                  </div>
                )
              })}
            </div>

            {/* Habit List */}
            <div className="px-4 space-y-3 mt-6">
              <button
                onClick={() => setIsHabitDialogOpen(true)}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5 transition-all mb-4"
              >
                <PlusCircle className="w-5 h-5" />
                NEW HABIT
              </button>

              {habits.length === 0 ? (
                <div className="p-16 text-center opacity-30">
                  <p className="font-bold uppercase tracking-widest text-xs">No habits found</p>
                </div>
              ) : (
                habits.map((h, i) => {
                  const isDoneToday = h.completion[currentDayIdx] === '1';
                  // Map titles to icons and colors for creative look
                  const isWater = h.title.toLowerCase().includes('water');
                  const isExercise = h.title.toLowerCase().includes('exercise') || h.title.toLowerCase().includes('run');
                  const isRead = h.title.toLowerCase().includes('read') || h.title.toLowerCase().includes('book');

                  return (
                    <div
                      key={h.id}
                      className={cn(
                        "group relative overflow-hidden rounded-[2rem] p-5 flex items-center gap-5 transition-all",
                        isDoneToday ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-muted/5 border-transparent border"
                      )}
                    >
                      <div
                        onClick={() => toggleHabit(h.id, currentDayIdx)}
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95",
                          isWater ? "bg-blue-500/10 text-blue-500" :
                            isExercise ? "bg-orange-500/10 text-orange-500" :
                              isRead ? "bg-purple-500/10 text-purple-500" :
                                "bg-foreground/5 text-foreground/40"
                        )}
                      >
                        {isWater ? <Flame className="w-7 h-7 fill-current" /> :
                          isExercise ? <Timer className="w-7 h-7" /> :
                            isRead ? <ClipboardList className="w-7 h-7" /> :
                              <CheckCircle2 className="w-7 h-7" />}
                      </div>

                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => toggleHabit(h.id, currentDayIdx)}
                      >
                        <h4 className="font-black text-base uppercase tracking-tight">{h.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-primary uppercase">★ ACTIVE</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{h.streak || 0}-day streak</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <NeuButton size="icon" variant="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Menu className="w-4 h-4" />
                            </NeuButton>
                          </PopoverTrigger>
                          <PopoverContent className="w-32 p-1 rounded-2xl bg-background border-border shadow-2xl">
                            <button
                              onClick={() => {
                                setEditingHabit(h);
                                setEditHabitName(h.title);
                                setIsEditHabitDialogOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-primary/5 text-primary rounded-xl"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteHabit(h.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-destructive/5 text-destructive rounded-xl"
                            >
                              Delete
                            </button>
                          </PopoverContent>
                        </Popover>

                        <div className="text-right">
                          <div className="text-sm font-black italic">
                            <span className={isDoneToday ? "text-primary" : "text-muted-foreground/30"}>
                              {isDoneToday ? '1' : '0'}
                            </span>
                            <span className="text-muted-foreground/30 ml-0.5">/1</span>
                          </div>
                        </div>
                      </div>

                      {/* Animated checkmark overlay */}
                      {isDoneToday && (
                        <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 bg-primary text-white rounded-full scale-75 animate-scale-in">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
              <DialogContent className="bg-background border-border rounded-[2.5rem] max-w-sm p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">New Quest</DialogTitle>
                </DialogHeader>
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 border border-primary/20">
                      <CalendarDays className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Target Name</label>
                    <Input
                      placeholder="e.g. Daily Meditation"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="h-16 bg-muted/5 border-transparent border rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-black text-lg"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-8">
                  <NeuButton
                    className="w-full h-16 rounded-2xl text-lg font-black italic uppercase bg-primary text-white shadow-lg glow-primary"
                    onClick={handleAddHabit}
                  >
                    Set Target
                  </NeuButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditHabitDialogOpen} onOpenChange={setIsEditHabitDialogOpen}>
              <DialogContent className="bg-background border-border rounded-[2.5rem] max-w-sm p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Edit Target</DialogTitle>
                </DialogHeader>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Target Name</label>
                    <Input
                      placeholder="e.g. Daily Meditation"
                      value={editHabitName}
                      onChange={(e) => setEditHabitName(e.target.value)}
                      className="h-16 bg-muted/5 border-transparent border rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-black text-lg"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-8">
                  <NeuButton
                    className="w-full h-16 rounded-2xl text-lg font-black italic uppercase bg-primary text-white shadow-lg glow-primary"
                    onClick={handleEditHabit}
                  >
                    Update Target
                  </NeuButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
    }
  };

  const renderProfile = () => {
    if (!profileData) {
      return (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            {profileError ? (
              <>
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-foreground font-bold text-lg">Failed to load profile</p>
                <p className="text-muted-foreground text-sm mb-6">There was an error connecting to the server.</p>
                <div className="flex flex-col gap-3">
                  <NeuButton onClick={() => { setProfileError(false); fetchProfile(currentUser!); }} variant="primary" className="w-full h-12">Try Again</NeuButton>
                  <NeuButton onClick={() => {
                    localStorage.removeItem("currentUser");
                    window.location.href = '/login';
                  }} variant="icon" className="w-full h-12 text-destructive font-bold">Log Out & Reset</NeuButton>
                  <NeuButton onClick={() => setShowProfile(false)} variant="icon" className="w-full h-12">Go Back</NeuButton>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground font-medium">Synchronizing Data...</p>
                <NeuButton onClick={() => setShowProfile(false)} variant="icon" className="mt-4">Cancel</NeuButton>
              </>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className={cn(
        "fixed inset-0 z-[100] animate-in slide-in-from-right duration-300",
        uiStyle === 'glass' ? "bg-black/20 backdrop-blur-xl" : "bg-background"
      )}>
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <NeuButton size="icon" variant="icon" onClick={() => setShowProfile(false)}>
              <ArrowLeft className="w-5 h-5" />
            </NeuButton>
            <h2 className="text-xl font-bold">Profile</h2>
            <div className="w-10" />
          </div>

          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full neu-pressed flex items-center justify-center text-4xl font-bold text-primary overflow-hidden border-4 border-background shadow-2xl">
              {profileData.profilePic ? (
                <img src={profileData.profilePic} className="w-full h-full object-cover" />
              ) : (
                profileData.username.charAt(0)
              )}
            </div>
          </div>
          <div className="text-center w-full px-4">
            {isEditingName ? (
              <div className="flex flex-col items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none text-center w-full max-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setProfileData(prev => ({ ...prev, username: editedName }));
                      setIsEditingName(false);
                      toast.success("Profile updated");
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setProfileData(prev => ({ ...prev, username: editedName }));
                      setIsEditingName(false);
                      toast.success("Profile updated");
                    }}
                    className="text-[10px] font-black uppercase text-primary hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-[10px] font-black uppercase text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative inline-block">
                <h1 className="text-3xl font-bold">{profileData.username}</h1>
                <button
                  onClick={() => {
                    setEditedName(profileData.username);
                    setIsEditingName(true);
                  }}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                >
                  <ArrowRight className="w-4 h-4 rotate-[-45deg]" />
                </button>
              </div>
            )}
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
              <Flame className="w-4 h-4 text-primary" />
              Flow State Level {profileData.level}
            </p>
          </div>

          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Theme Color</h3>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'default', level: 1, color: '#F97316', label: 'Orange' },
                  { id: 'red', level: 3, color: '#EF4444', label: 'Red' },
                  { id: 'green', level: 3, color: '#16A34A', label: 'Green' },
                  { id: 'blue', level: 5, color: '#3B82F6', label: 'Blue' },
                  { id: 'mirage', level: 10, color: '#141E30', label: 'Mirage' }
                ].map(t => {
                  const isLocked = (profileData.level || 1) < t.level;
                  return (
                    <div key={t.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          if (isLocked) {
                            toast.error(`Unlock this at Level ${t.level}!`);
                            return;
                          }
                          handleThemeChange(t.id);
                        }}
                        className={cn(
                          "w-12 h-12 rounded-full border-4 transition-all shadow-lg relative flex items-center justify-center",
                          theme === t.id ? "border-primary scale-110" : "border-transparent opacity-70 hover:opacity-100",
                          isLocked && "grayscale cursor-not-allowed"
                        )}
                        style={{ backgroundColor: t.color }}
                      >
                        {isLocked && <Lock className="w-4 h-4 text-white/50" />}
                        {t.id === 'mirage' && !isLocked && <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-black uppercase text-center leading-tight">Navy<br />Mirage</span>}
                      </button>
                      <span className="text-[10px] font-bold uppercase opacity-50">{isLocked ? `Lvl ${t.level}` : t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-lg">UI Style</h3>
              <div className="flex gap-2 p-1.5 neu-pressed rounded-2xl w-fit">
                {['solid', 'glass'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleStyleChange(s)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                      uiStyle === s
                        ? "bg-primary text-white shadow-lg glow-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {(theme !== 'default' || uiStyle !== 'solid') && <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Custom Theme Active</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NeuCard className="p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-primary">{profileData.totalFocusHours}h</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Focus</p>
            </NeuCard>
            <NeuCard className="p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-success">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Missions Done</p>
            </NeuCard>
          </div>



          <div className="space-y-4">
            <h3 className="font-bold text-lg">Account Settings</h3>
            <NeuCard className="p-0 overflow-hidden">
              <button
                onClick={() => {
                  setEditedName(profileData.username);
                  setIsEditingName(true);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/5 transition-colors border-b border-border/50"
              >
                <span className="font-medium">Edit Profile</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Change Name <ArrowRight className="w-3 h-3" />
                </span>
              </button>
              <button
                onClick={() => {
                  const url = prompt("Enter an Avatar image URL:");
                  if (url) {
                    authFetch("/api/user/update", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profilePic: url }),
                    }).then(() => {
                      setProfileData(prev => ({ ...prev, profilePic: url }));
                      toast.success("Avatar updated!");
                    });
                  }
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/5 transition-colors border-b border-border/50"
              >
                <span className="font-medium">Change Avatar</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Image URL <ArrowRight className="w-3 h-3" />
                </span>
              </button>
              <div className="w-full p-4 flex items-center justify-between border-b border-border/50">
                <div className="flex flex-col text-left">
                  <span className="font-medium">Notifications</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">System alerts & Sounds</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1 transition-colors duration-300",
                    notificationsEnabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                    notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("currentUser");
                  window.location.href = '/login';
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 text-destructive transition-colors"
              >
                <span className="font-bold">Logout</span>
                <LogOut className="w-4 h-4" />
              </button>
            </NeuCard>
          </div>
        </div>
      </div>
    );
  };

  const renderFriendProfile = () => {
    if (!viewingFriend) return null;

    // Use friendProfileData if available, otherwise use friend object basics
    const data = friendProfileData || {
      username: viewingFriend.name,
      level: viewingFriend.level,
      totalFocusHours: 0,
      missionsDone: 0,
      habitradar: []
    };

    return (
      <div className={cn(
        "fixed inset-0 z-[150] animate-in slide-in-from-bottom duration-300",
        uiStyle === 'glass' ? "bg-black/40 backdrop-blur-xl" : "bg-background/95"
      )}>
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <NeuButton size="icon" variant="icon" onClick={() => {
              setViewingFriend(null);
              setFriendProfileData(null);
            }}>
              <X className="w-5 h-5" />
            </NeuButton>
            <h2 className="text-xl font-bold uppercase tracking-tighter">Player Card</h2>
            <div className="w-10" />
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl neu-pressed flex items-center justify-center text-4xl font-bold text-primary overflow-hidden border-4 border-background shadow-2xl rotate-3">
                {viewingFriend.avatar ? (
                  <img src={viewingFriend.avatar} className="w-full h-full object-cover" />
                ) : (
                  viewingFriend.name.charAt(0)
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black shadow-lg border-2 border-background -rotate-3">
                {data.level}
              </div>
            </div>

            <div className="text-center w-full px-4">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">{data.username}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className={cn("w-2 h-2 rounded-full", viewingFriend.status === 'online' ? "bg-success" : "bg-muted-foreground")} />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                  {viewingFriend.status === 'online' ? "Online Now" : viewingFriend.lastActive || "Status Hidden"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NeuCard className="p-4 text-center space-y-1">
              <p className="text-2xl font-black text-primary">{data.totalFocusHours || 0}h</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Focus</p>
            </NeuCard>
            <NeuCard className="p-4 text-center space-y-1">
              <p className="text-2xl font-black text-success">{data.missionsDone || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Completed</p>
            </NeuCard>
          </div>



          <div className="pt-4">
            <NeuButton
              className="w-full h-14 rounded-2xl text-sm font-black uppercase italic tracking-wider shadow-lg bg-primary text-white"
              onClick={() => {
                handleChat(viewingFriend.id);
                setViewingFriend(null);
                setFriendProfileData(null);
                setActiveTab("friends");
              }}
            >
              Send Message
            </NeuButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "h-[100dvh] overflow-hidden relative",
      uiStyle === 'glass' ? "bg-transparent" : "bg-background"
    )}>
      <div className={cn(
        "h-full w-full md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col relative",
        !chatFriend && "px-4 pt-6 pb-28 overflow-y-auto"
      )}>
        {renderContent()}
      </div>
      {!chatFriend && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      {showProfile && renderProfile()}
      {viewingFriend && renderFriendProfile()}

      {/* Add Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              New Task
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground px-1">TASK TITLE</label>
              <Input
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="neu-pressed bg-background border-none h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground px-1">DESCRIPTION (OPTIONAL)</label>
              <Input
                placeholder="Add some details..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="neu-pressed bg-background border-none h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground px-1">PRIORITY</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}
                >
                  <SelectTrigger className="neu-pressed bg-background border-none h-12 rounded-2xl focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-xl">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground px-1">EST. HOURS</label>
                <Input
                  type="number"
                  min="1"
                  value={newTask.totalHours}
                  onChange={(e) => setNewTask({ ...newTask, totalHours: parseInt(e.target.value) || 1 })}
                  className="neu-pressed bg-background border-none h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <NeuButton
              className="w-full h-12 text-lg font-bold"
              variant="primary"
              onClick={() => {
                if (!newTask.title) return;
                const taskToAdd: Task = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: newTask.title,
                  description: newTask.description,
                  priority: newTask.priority as any,
                  totalHours: newTask.totalHours || 1,
                  hours: 0,
                  assignees: 1,
                  status: "todo",
                  subtasks: [],
                };
                handleAddTask(taskToAdd);
                setIsTaskDialogOpen(false);
                setNewTask({ title: "", description: "", priority: "normal", totalHours: 1 });
              }}
            >
              Add Task
            </NeuButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
