import { useState } from "react";
import { NeuCard } from "@/components/ui/NeuCard";
import { NeuButton } from "@/components/ui/NeuButton";
import { Input } from "@/components/ui/input";
import { GoogleLogin } from "@react-oauth/google";
import { LogIn, User, Lock, Chrome } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

interface LoginPageProps {
    onLogin: (username: string) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            // Decode the JWT (simplified for demo)
            const base64Url = credentialResponse.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));

            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: payload.email }),
            });
            const data = await res.json();
            if (data.status === "success") {
                toast.success(`Welcome, ${data.user.username}!`);
                onLogin(data.user.username);
            }
        } catch (err) {
            console.error("Google Login Error:", err);
            toast.error("Google authentication failed. Check console.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || (mode === "register" && !email)) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

        try {
            console.log(`Connecting to: ${API_URL}${endpoint}`);
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Server returned ${res.status}`);
            }

            const data = await res.json();

            if (data.status === "success") {
                toast.success(mode === "login" ? `Welcome back, ${username}!` : "Registration successful! Please login.");
                if (mode === "login") {
                    onLogin(username);
                } else {
                    setMode("login");
                }
            } else {
                toast.error(data.message || "Action failed");
            }
        } catch (err: any) {
            console.error("Connection Error:", err);
            toast.error(err.message === "Failed to fetch"
                ? "Cannot connect to server. Is the backend running?"
                : `Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_40%)]">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center mb-4 neu-pressed">
                        <LogIn className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Flow State</h1>
                    <p className="text-muted-foreground">Master your focus, gamify your life.</p>
                </div>

                <NeuCard className="p-6 space-y-6 shadow-xl border border-border/50">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="neu-pressed bg-background border-none h-12 pl-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        {mode === "register" && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Email</label>
                                <div className="relative">
                                    <Chrome className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="neu-pressed bg-background border-none h-12 pl-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="neu-pressed bg-background border-none h-12 pl-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        <NeuButton
                            type="submit"
                            variant="primary"
                            className="w-full h-14 text-lg font-bold mt-2 shadow-lg glow-accent"
                            disabled={isLoading}
                        >
                            {isLoading ? "Please wait..." : (mode === "login" ? "Get Started" : "Register")}
                        </NeuButton>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center w-full">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => toast.error("Google Login Failed")}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
                            width="100%"
                        />
                    </div>
                </NeuCard>

                <p className="text-center text-sm text-muted-foreground">
                    {mode === "login" ? "Don't have an account?" : "Already have an account?"} {" "}
                    <span
                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                        className="text-primary font-bold cursor-pointer hover:underline"
                    >
                        {mode === "login" ? "Register Now" : "Login Instead"}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
