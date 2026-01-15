import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { MessageCircle, UserPlus, Trophy } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  status: "online" | "offline" | "busy";
  lastActive?: string;
}

interface FriendsListProps {
  friends: Friend[];
  onChat: (friendId: string) => void;
  onAddFriend: () => void;
}

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
};

const FriendsList = ({ friends, onChat, onAddFriend }: FriendsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Friends</h3>
        <NeuButton size="icon" onClick={onAddFriend}>
          <UserPlus className="w-5 h-5" />
        </NeuButton>
      </div>

      <div className="space-y-2">
        {friends.length === 0 ? (
          <div className="text-center p-8 bg-muted/5 rounded-3xl border-2 border-dashed border-border/30">
            <p className="text-muted-foreground font-medium">No friends yet. Start by searching for someone!</p>
          </div>
        ) : (
          friends.map((friend) => (
            <NeuCard
              key={friend.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-muted/5 transition-colors"
              onClick={() => onChat(friend.id)}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl neu-pressed overflow-hidden flex items-center justify-center text-lg font-bold text-primary">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                  ) : (
                    friend.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[friend.status]
                    }`}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{friend.name}</h4>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Trophy className="w-3 h-3 text-primary" />
                    Lv.{friend.level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {friend.status === "online" ? "Online now" : friend.lastActive || friend.status}
                </p>
              </div>

              <NeuButton
                size="icon"
                variant="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onChat(friend.id);
                }}
                className="p-2"
              >
                <MessageCircle className="w-5 h-5" />
              </NeuButton>
            </NeuCard>
          ))
        )}
      </div>
    </div>
  );
};

export { FriendsList };
export type { Friend };
