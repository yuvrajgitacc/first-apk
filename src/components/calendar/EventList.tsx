import { useState } from "react";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { Clock, Plus, Calendar as CalendarIcon, Tag } from "lucide-react";
import type { Event } from "./CalendarWidget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventListProps {
  events: Event[];
  selectedDate: Date | null;
  onAddEvent: (event: Omit<Event, "id">) => void;
}

const categoryColors: Record<string, string> = {
  work: "bg-primary",
  personal: "bg-success",
  meeting: "bg-amber-500",
  exercise: "bg-emerald-500",
};

const EventList = ({ events, selectedDate, onAddEvent }: EventListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "09:00 AM",
    category: "work" as const,
  });

  const filteredEvents = selectedDate
    ? events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    : events;

  const formatDate = (date: Date | null) => {
    if (!date) return "Select a date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !selectedDate) return;
    onAddEvent({
      ...newEvent,
      date: selectedDate,
    });
    setIsDialogOpen(false);
    setNewEvent({ title: "", time: "09:00 AM", category: "work" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {formatDate(selectedDate)}
        </h3>
        <NeuButton size="icon" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-5 h-5" />
        </NeuButton>
      </div>

      {filteredEvents.length === 0 ? (
        <NeuCard variant="pressed" className="text-center py-8">
          <p className="text-muted-foreground">No events scheduled</p>
          <NeuButton className="mt-3" onClick={() => setIsDialogOpen(true)}>
            Add Event
          </NeuButton>
        </NeuCard>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <NeuCard key={event.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div
                className={`w-1 h-12 rounded-full ${categoryColors[event.category] || "bg-primary"
                  }`}
              />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{event.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${categoryColors[event.category]}`} />
                    {event.category}
                  </span>
                </div>
              </div>
            </NeuCard>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" />
              New Event
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground px-1">EVENT TITLE</label>
              <Input
                placeholder="What's happening?"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="neu-pressed bg-background border-none h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-semibold text-muted-foreground px-1">TIME</label>
                <Input
                  placeholder="e.g., 2:30 PM"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="neu-pressed bg-background border-none h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground px-1 opacity-60">Format: HH:MM AM/PM (e.g., 9:30 AM, 2:45 PM)</p>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-semibold text-muted-foreground px-1">CATEGORY</label>
                <Select
                  value={newEvent.category}
                  onValueChange={(v: any) => setNewEvent({ ...newEvent, category: v })}
                >
                  <SelectTrigger className="neu-pressed bg-background border-none h-12 rounded-2xl focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-xl">
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <NeuButton
              className="w-full h-12 text-lg font-bold"
              variant="primary"
              onClick={handleCreateEvent}
            >
              Create Event
            </NeuButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { EventList };
