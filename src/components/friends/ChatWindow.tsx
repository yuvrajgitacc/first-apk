import { useState, useEffect, useRef } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { ArrowLeft, Send, Smile, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket";
import { API_URL, authFetch } from "@/lib/api";

interface Message {
  id: string;
  text?: string;
  file_url?: string;
  sender: string;
  receiver?: string;
  timestamp: Date;
}

interface ChatWindowProps {
  friendName: string;
  friendAvatar?: string;
  currentUser: string | null;
  onBack: () => void;
  onViewProfile?: () => void;
}

const ChatWindow = ({
  friendName,
  friendAvatar,
  currentUser,
  onBack,
  onViewProfile,
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connection Monitoring
    const onConnect = () => {
      console.log("🟢 Socket Connected");
      setIsConnected(true);
    };
    const onDisconnect = () => {
      console.log("🔴 Socket Disconnected");
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Force connect if needed
    if (!socket.connected) {
      console.log("🔌 Force connecting socket...");
      socket.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // 1. Fetch Message History on Mount
  useEffect(() => {
    if (currentUser && friendName) {
      console.log(`📥 Fetching chat history between ${currentUser} and ${friendName}`);
      authFetch(`/api/messages?user1=${currentUser}&user2=${friendName}`)
        .then((res) => res.json())
        .then((data) => {
          const parsedMessages = data.map((msg: any) => ({
            ...msg,
            id: msg.id.toString(), // Ensure IDs are always strings
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(parsedMessages);
          scrollToBottom();
        })
        .catch((err) => console.error("❌ Failed to fetch messages:", err));
    }
  }, [currentUser, friendName]);

  // 2. Listen for Real-Time Messages
  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      console.log("📨 Socket received msg:", msg);

      const incomingMsg: Message = {
        ...msg,
        id: msg.id.toString(),
        timestamp: new Date(msg.timestamp),
      };

      const myName = (currentUser || "").toLowerCase();
      const friendNameLower = friendName.toLowerCase();
      const sender = (incomingMsg.sender || "").toLowerCase();
      const receiver = (incomingMsg.receiver || "").toLowerCase();

      // Relaxed Filtering:
      // 1. Message from Friend (to me OR to no one/public)
      // 2. Message from Me (to friend)
      const isFromFriend = sender === friendNameLower;
      const isFromMe = sender === myName && receiver === friendNameLower;

      console.log(`🔍 Chat Filter [${friendName}]: fromFriend=${isFromFriend}, fromMe=${isFromMe}`);

      if (isFromFriend || isFromMe) {
        setMessages((prev) => {
          // Robust duplicate check (handles string/number IDs)
          if (prev.some(m => String(m.id) === String(incomingMsg.id))) {
            return prev;
          }
          return [...prev, incomingMsg];
        });
        scrollToBottom();
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentUser, friendName]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !currentUser) return;

    if (!socket.connected) {
      console.warn("🔌 Socket not connected, attempting to connect...");
      socket.connect();
    }

    const text = newMessage.trim();

    // Emit to backend
    console.log(`📤 Sending message to ${friendName}: ${text}`);
    socket.emit("message", {
      text: text,
      sender: currentUser,
      receiver: friendName,
    });

    setNewMessage("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        socket.emit("message", {
          text: `file:${result}`, // Simple hack for file transfer
          sender: currentUser,
          receiver: friendName,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <NeuButton size="icon" variant="icon" onClick={onBack} className="w-10 h-10 bg-muted/20 border-border/10 shadow-none">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </NeuButton>
          <div
            className="w-10 h-10 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center font-bold text-primary text-lg cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
            onClick={onViewProfile}
          >
            {friendAvatar ? (
              <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
            ) : (
              friendName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-[16px] leading-none mb-1">{friendName}</h3>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-success" : "bg-destructive")} />
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{isConnected ? "Online" : "Disconnected"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth bg-muted/5"
      >
        {messages.map((message, idx) => {
          const isFile = message.text?.startsWith('file:');
          const fileUrl = isFile ? message.text?.replace('file:', '') : null;
          const isMe = message.sender.toLowerCase() === currentUser?.toLowerCase();

          return (
            <div
              key={message.id || idx}
              className={cn(
                "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                isMe ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] px-4 py-3 shadow-xl transition-all",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-[20px] rounded-tr-none shadow-primary/20"
                    : "bg-muted/30 border border-border/40 rounded-[20px] rounded-tl-none shadow-none text-foreground"
                )}
              >
                {isFile ? (
                  fileUrl?.startsWith('data:image') ? (
                    <img src={fileUrl} alt="Attachment" className="max-w-full rounded-lg" />
                  ) : (
                    <a href={fileUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm font-bold">View Attachment</span>
                    </a>
                  )
                ) : (
                  <p className="text-[14px] leading-relaxed font-medium">{message.text}</p>
                )}
              </div>
              <span className="text-[10px] mt-2 px-1 text-muted-foreground font-bold tracking-tight opacity-70">
                {formatTime(message.timestamp)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="shrink-0 bg-background border-t border-border/50 p-4 pb-6 md:pb-4">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-border/20">
            <NeuButton
              size="icon"
              variant="icon"
              onClick={() => document.getElementById('chat-file-input')?.click()}
              className="w-9 h-9 shrink-0 hover:bg-muted/20 bg-transparent border-none shadow-none"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground/60" />
            </NeuButton>
            <input
              type="file"
              id="chat-file-input"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Start typing..."
              className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none py-2 font-medium"
            />
          </div>
          <NeuButton
            size="icon"
            variant="primary"
            onClick={handleSend}
            className="w-11 h-11 rounded-2xl shrink-0 shadow-lg glow-accent flex items-center justify-center p-0 active:scale-90 transition-transform bg-primary"
          >
            <Send className="w-5 h-5" />
          </NeuButton>
        </div>
      </div>
    </div>
  );
};

export { ChatWindow };
export type { Message };