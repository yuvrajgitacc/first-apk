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
import { Menu, Bell, User, ClipboardList, PlusCircle, ArrowLeft, ArrowRight, LogOut, Search, X, Paperclip, Camera, Flame, CheckCircle2, Timer, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { initSocket, socket } from "@/lib/socket";
import { API_URL } from "@/lib/api";
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
  const [selectedHabitDays, setSelectedHabitDays] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileError, setProfileError] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [theme, setTheme] = useState('default');
  const [uiStyle, setUiStyle] = useState('solid');
  const [pendingProfilePic, setPendingProfilePic] = useState<string | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

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
    };

    const handleNotification = (data: any) => {
      // Play sound for all notifications
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => console.log("Audio play failed", e));

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

  const requiredXP = 3000;
  const completionRate = Math.round(
    (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
  );

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "completed" as const } : task
      )
    );
    // Add XP for completing task
    const newXP = xp + 150;
    if (newXP >= requiredXP) {
      setLevel((prev) => prev + 1);
      setXp(newXP - requiredXP);
    } else {
      setXp(newXP);
    }
  };

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "normal",
    totalHours: 1,
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = (user: string) => {
    fetch(`${API_URL}/api/user/profile?username=${user}`)
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
    fetch(`${API_URL}/api/tasks?username=${user}`)
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
      await fetch(`${API_URL}/api/focus/track`, {
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
      await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const fetchNotifications = (user: string) => {
    fetch(`${API_URL}/api/notifications?username=${user}`)
      .then(res => res.json())
      .then(setNotifications);
  };

  const handleDeleteNotification = (id: number) => {
    if (!currentUser) return;
    fetch(`${API_URL}/api/notifications?username=${currentUser}&id=${id}`, {
      method: "DELETE",
    }).then(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    });
  };

  const handleClearAll = () => {
    if (!currentUser) return;
    // We could add a backend endpoint for this, but for now we'll delete them one by one
    // Or just add a simple backend route. Let's assume we delete them all.
    notifications.forEach(n => handleDeleteNotification(n.id));
  };

  const fetchHabits = (user: string) => {
    fetch(`${API_URL}/api/habits?username=${user}`)
      .then(res => res.json())
      .then(setHabits)
      .catch(err => console.error("Habits fetch error:", err));
  };

  const fetchFriends = (user: string) => {
    fetch(`${API_URL}/api/friends?username=${user}`)
      .then(res => res.json())
      .then(setFriends)
      .catch(err => console.error("Friends fetch error:", err));
  };

  const fetchEvents = (user: string) => {
    fetch(`${API_URL}/api/events?username=${user}`)
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
      const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      events.forEach(event => {
        // Try to parse the event date. If it's a Date object, convert to string.
        const eventDateStr = event.date instanceof Date
          ? event.date.toISOString().split('T')[0]
          : event.date;

        if (eventDateStr === todayStr && event.time === currentTime && !notifiedEvents.current.has(event.id)) {
          // Play notification sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(e => console.log("Audio play failed", e));

          // Show toast
          toast(`Event Starting: ${event.title}`, {
            description: `Scheduled for ${event.time}`,
            icon: <CalendarDays className="w-4 h-4 text-primary" />,
          });

          // Create notification in backend for bell icon
          if (currentUser) {
            fetch(`${API_URL}/api/notifications/create`, {
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
      fetch(`${API_URL}/api/users/search?q=${q}`)
        .then(res => res.json())
        .then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = (target: string) => {
    fetch(`${API_URL}/api/friends/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me: currentUser, target }),
    }).then(() => toast.success("Friend request sent!"));
  };

  const handleAcceptFriend = (sender: string, notifId: number) => {
    fetch(`${API_URL}/api/friends/accept`, {
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
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !currentUser) return;

    let completion = habit.completion.split('');
    completion[dayIdx] = completion[dayIdx] === '1' ? '0' : '1';
    const newCompletion = completion.join('');

    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completion: newCompletion } : h));

    fetch(`${API_URL}/api/habits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: habitId, completion: newCompletion, username: currentUser }),
    }).then(() => fetchProfile(currentUser))
      .catch(err => console.error(`Failed to toggle habit ${habitId}:`, err));
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim() || !currentUser) return;
    try {
      const res = await fetch(`${API_URL}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newHabitName, username: currentUser }),
      });
      if (res.ok) {
        fetchHabits(currentUser);
        setNewHabitName("");
        setIsHabitDialogOpen(false);
        toast.success("Habit created!");
      }
    } catch (err) {
      toast.error("Failed to add habit");
    }
  };

  const handleAddTask = async (task: Task) => {
    if (!currentUser) return;
    setTasks([task, ...tasks]);
    try {
      await fetch(`${API_URL}/api/tasks?username=${currentUser}`, {
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

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingProfilePic(reader.result as string);
      setIsPreviewDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const confirmProfilePic = async () => {
    if (!pendingProfilePic || !currentUser) return;
    try {
      const res = await fetch(`${API_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, profilePic: pendingProfilePic }),
      });
      if (res.ok) {
        fetchProfile(currentUser);
        toast.success("Profile picture updated!");
        setIsPreviewDialogOpen(false);
        setPendingProfilePic(null);
      }
    } catch (err) {
      toast.error("Upload failed");
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
        />
      );
    }

    switch (activeTab) {
      case "home":
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
                                    const sender = n.message.split(' ')[0];
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
                  date: uiEvent.date.toISOString().split('T')[0]
                };

                fetch(`http://127.0.0.1:5000/api/events?username=${currentUser}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backendEvent),
                }).then(() => toast.success("Event scheduled!"));
              }}
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
                dailyHistory: dailyHistory
              }}
              projects={mockProjects}
            />
          </div>
        );

      case "habits":
        const currentDayIdx = (new Date().getDay() + 6) % 7; // Adjust to Mon=0
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        return (
          <div className="space-y-6 animate-scale-in pb-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <h1 className="text-xl font-bold text-foreground">Daily Habits</h1>
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

            <NeuCard className="p-4 flex justify-between items-center">
              {days.map((day, i) => {
                const isToday = i === currentDayIdx;
                return (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{day}</span>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      isToday ? "bg-primary text-white shadow-lg glow-primary" : "bg-muted/10 text-muted-foreground"
                    )}>
                      {new Date(Date.now() - (currentDayIdx - i) * 86400000).getDate()}
                    </div>
                  </div>
                )
              })}
            </NeuCard>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Daily Routine</h3>
                <span className="text-xs text-primary font-bold uppercase tracking-wider cursor-pointer">See all</span>
              </div>

              <button
                onClick={() => setIsHabitDialogOpen(true)}
                className="w-full h-16 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl flex items-center justify-center gap-3 text-primary hover:bg-primary/10 transition-all font-bold group mb-2"
              >
                <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                ADD NEW HABIT
              </button>

              <div className="space-y-3">
                {habits.length === 0 ? (
                  <div className="p-16 text-center border-2 border-dashed border-border/30 rounded-3xl bg-muted/5">
                    <p className="text-muted-foreground font-medium">Create your first habit to start building mastery.</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative">
                    {habits.map(h => {
                      const isDoneToday = h.completion[currentDayIdx] === '1';
                      return (
                        <div key={h.id} className="flex items-center gap-4 bg-muted/5 p-4 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group">
                          <button
                            onClick={() => toggleHabit(h.id, currentDayIdx)}
                            className={cn(
                              "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                              isDoneToday
                                ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                : "border-border/40 text-transparent hover:border-primary/50"
                            )}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-foreground">{h.title}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              Streak: <span className="text-primary">{h.streak || 0}</span> days
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Timer className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[10px] font-bold">5 min</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>


            <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
              <DialogContent className="bg-background border-border rounded-3xl max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New habit</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center">
                      <CalendarDays className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Name your habit</label>
                    <Input
                      placeholder="e.g. Morning Meditations"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="h-14 bg-muted/20 border-border/50 rounded-2xl focus-visible:ring-primary font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Repeat days</label>
                    <div className="flex justify-between">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                        <button
                          key={i}
                          className={cn(
                            "w-9 h-9 rounded-full font-bold text-xs transition-all",
                            i === currentDayIdx ? "bg-primary text-white" : "bg-muted/20 text-muted-foreground"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <NeuButton
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-primary text-white glow-primary"
                    onClick={handleAddHabit}
                  >
                    Save Habit
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

          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePicUpload}
              />
              <div className="w-32 h-32 rounded-full neu-pressed flex items-center justify-center text-4xl font-bold text-primary overflow-hidden border-4 border-background shadow-2xl">
                {profileData.profilePic ? (
                  <img src={profileData.profilePic} className="w-full h-full object-cover" />
                ) : (
                  profileData.username.charAt(0)
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-2xl shadow-xl border-4 border-background">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold">{profileData.username}</h1>
              <p className="text-muted-foreground flex items-center justify-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Flow State Level {profileData.level}
              </p>
            </div>
          </div>

          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Theme Color</h3>
              <div className="flex flex-wrap gap-4">
                {['default', 'red', 'green', 'blue', 'mirage'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={cn(
                      "w-12 h-12 rounded-full border-4 transition-all shadow-lg relative",
                      theme === t ? "border-primary scale-110" : "border-transparent opacity-70 hover:opacity-100",
                      t === 'default' && "bg-[#F97316]",
                      t === 'red' && "bg-red-500",
                      t === 'green' && "bg-green-600",
                      t === 'blue' && "bg-blue-500",
                      t === 'mirage' && "bg-[#141E30]"
                    )}
                  >
                    {t === 'mirage' && <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-black uppercase text-center leading-tight">Navy<br />Mirage</span>}
                  </button>
                ))}
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

          <NeuCard className="p-4 h-[250px] flex items-center justify-center relative">
            {profileData.habitradar && profileData.habitradar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profileData.habitradar}>
                  <PolarGrid stroke="hsl(var(--muted-foreground)/0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} />
                  <Radar
                    name="Habits"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                  <Flame className="w-6 h-6 text-primary/40" />
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">No Habit Data Yet</p>
              </div>
            )}
          </NeuCard>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Account Settings</h3>
            <NeuCard className="p-0 overflow-hidden">
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/5 transition-colors border-b border-border/50">
                <span className="font-medium">Edit Profile</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/5 transition-colors border-b border-border/50">
                <span className="font-medium">Notifications</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
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

  return (
    <div className={cn(
      "h-[100dvh] overflow-hidden relative",
      uiStyle === 'glass' ? "bg-transparent" : "bg-background"
    )}>
      <div className={cn(
        "h-full w-full max-w-md mx-auto flex flex-col relative",
        !chatFriend && "px-4 pt-6 pb-28 overflow-y-auto"
      )}>
        {renderContent()}
      </div>
      {!chatFriend && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      {showProfile && renderProfile()}

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

      {/* Profile Picture Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Set Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl neu-pressed">
              {pendingProfilePic && (
                <img src={pendingProfilePic} className="w-full h-full object-cover animate-in zoom-in-50 duration-300" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest px-4 opacity-70">
              Auto-centering and cropping enabled for a professional fit.
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center">
            <NeuButton onClick={() => setIsPreviewDialogOpen(false)} variant="icon" className="flex-1">Cancel</NeuButton>
            <NeuButton onClick={confirmProfilePic} variant="primary" className="flex-1">Set Profile Pic</NeuButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
