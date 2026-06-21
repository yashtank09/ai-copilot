import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import { io, Socket } from "socket.io-client";
import { ChatSection, ChatMessage, ChatMode } from "./components/ChatSection";
import {
  SettingsSection,
  DisplaySettings,
  AgentConfig,
  MeetingLog
} from "./components/SettingsSection";
import {
  MessageSquare,
  Settings as SettingsIcon,
  Tv,
  Maximize2,
  Minimize2,
  Users,
  TrendingUp,
  Award,
  Zap,
  Mic,
  X,
  Minus,
  Square
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const defaultHistory: MeetingLog[] = [
  {
    id: "1",
    title: "AI-Copilot Design Sprint & Architecture Review",
    date: "June 20, 2026",
    duration: "45 mins",
    transcript: "Speaker 1 (0:05): Let's plan the migration to Tauri v2 and React 19.\nSpeaker 2 (0:40): I'll take care of setting up Tailwind v4 and clean modular sub-tabs."
  },
  {
    id: "2",
    title: "Standup & Daily Progress Sync",
    date: "June 19, 2026",
    duration: "15 mins",
    transcript: "Speaker 1 (0:02): Audio streaming NestJS backend setup is completed.\nSpeaker 2 (0:05): The socket gateway echoes back insights properly."
  }
];

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "settings" | "insights">("chat");
  const [layoutMode, setLayoutMode] = useState<"compact" | "dashboard">("dashboard");
  const [isListening, setIsListening] = useState(false);
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);

  // Settings State
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    theme: "dark",
    primaryColor: "indigo",
    fontFamily: "sans",
    fontSize: 14
  });

  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: ""
  });

  const [conversationHistory, setConversationHistory] = useState<MeetingLog[]>(defaultHistory);

  // Tauri Store Loading
  useEffect(() => {
    const initStore = async () => {
      try {
        // Fallback gracefully if not running in Tauri (e.g. browser context)
        // @tauri-apps/plugin-store throws if window.__TAURI_INTERNALS__ is missing
        if (!(window as any).__TAURI_INTERNALS__) {
          setIsStoreLoaded(true);
          return;
        }

        const store = await load('store.json', { autoSave: false } as any);
        
        const savedDisplay = await store.get<DisplaySettings>('displaySettings');
        if (savedDisplay) {
          setDisplaySettings(savedDisplay);
        }
        
        const savedAgent = await store.get<AgentConfig>('agentConfig');
        if (savedAgent) {
          setAgentConfig(savedAgent);
        }
      } catch (error) {
        console.error("Failed to load Tauri store:", error);
      } finally {
        setIsStoreLoaded(true);
      }
    };
    initStore();
  }, []);

  // Sync to Store on Changes
  useEffect(() => {
    const saveSettings = async () => {
      if (!isStoreLoaded || !(window as any).__TAURI_INTERNALS__) return;
      try {
        const store = await load('store.json', { autoSave: false } as any);
        await store.set('displaySettings', displaySettings);
        await store.save();
      } catch (e) {
        console.error(e);
      }
    };
    saveSettings();
  }, [displaySettings, isStoreLoaded]);

  useEffect(() => {
    const saveAgent = async () => {
      if (!isStoreLoaded || !(window as any).__TAURI_INTERNALS__) return;
      try {
        const store = await load('store.json', { autoSave: false } as any);
        await store.set('agentConfig', agentConfig);
        await store.save();
      } catch (e) {
        console.error(e);
      }
    };
    saveAgent();
  }, [agentConfig, isStoreLoaded]);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "system",
      text: "AI Meeting Copilot v1.1.0 initialized. Ready to sync...",
      timestamp: new Date()
    },
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I am your AI Copilot. Connect your microphone or speak to start generating transcripts and live meeting insights.",
      timestamp: new Date()
    }
  ]);

  // Connect to NestJS backend
  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: "system",
          text: "System: Established WebSockets connection to backend.",
          timestamp: new Date()
        }
      ]);
    });

    newSocket.on("ai_insight", (data: any) => {
      console.log("Received insight:", data);
      setMessages((prev) => [
        ...prev,
        {
          id: `insight-${Date.now()}`,
          role: "assistant",
          text: data.content || "Mock AI: Insight generated.",
          timestamp: new Date()
        }
      ]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Theme auto sync
  useEffect(() => {
    const root = window.document.documentElement;
    const updateTheme = () => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const activeTheme = displaySettings.theme === "system" ? systemTheme : displaySettings.theme;
      
      if (activeTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    updateTheme();

    if (displaySettings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [displaySettings.theme]);

  // Color theme auto sync
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-theme", displaySettings.primaryColor);
  }, [displaySettings.primaryColor]);

  // Handle window resizing via Tauri
  const updateTauriWindow = async (mode: "compact" | "dashboard") => {
    try {
      const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      if (appWindow) {
        if (mode === "compact") {
          await appWindow.setSize(new LogicalSize(360, 600));
          await appWindow.setAlwaysOnTop(true);
        } else {
          await appWindow.setSize(new LogicalSize(1000, 720));
          await appWindow.setAlwaysOnTop(false);
        }
      }
    } catch (err) {
      console.warn("Tauri Window API is not available. Using CSS browser resizing fallback.", err);
    }
  };

  const toggleLayoutMode = () => {
    const nextMode = layoutMode === "compact" ? "dashboard" : "compact";
    setLayoutMode(nextMode);
    updateTauriWindow(nextMode);
  };

  const handleSendMessage = (text: string, activePill: ChatMode) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
      pillType: activePill !== "general" ? activePill : undefined
    };
    
    setMessages((prev) => [...prev, userMsg]);

    // Send to backend via Socket
    if (socket && socket.connected) {
      socket.emit("audio_chunk", {
        payload: text,
        mode: activePill,
        provider: agentConfig.provider,
        model: agentConfig.model,
        apiKey: agentConfig.apiKey
      });
    } else {
      // Mock delayed response if backend isn't reachable
      setTimeout(() => {
        const mockReply: ChatMessage = {
          id: `reply-${Date.now()}`,
          role: "assistant",
          text: `Mock response for mode [${activePill}]: Let me investigate that. This is a local mock response.`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, mockReply]);
      }, 1000);
    }
  };

  // Font typography custom styles
  const fontStyle = {
    fontFamily:
      displaySettings.fontFamily === "mono"
        ? "JetBrains Mono, Fira Code, monospace"
        : displaySettings.fontFamily === "serif"
        ? "Outfit, Georgia, Times New Roman, serif"
        : "Inter, system-ui, sans-serif",
    fontSize: `${displaySettings.fontSize}px`
  };

  const isCompact = layoutMode === "compact";

  if (!isStoreLoaded) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">Loading Configuration...</div>;
  }

  return (
    <div
      style={fontStyle}
      className={`app-container flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 select-none ${
        isCompact ? "max-w-[360px] max-h-[600px] border-2 border-primary-500/50" : "border border-slate-300 dark:border-slate-800"
      }`}
    >
      {/* Custom Titlebar */}
      <div 
        data-tauri-drag-region 
        className="h-8 flex shrink-0 items-center justify-between px-3 bg-slate-200/50 dark:bg-slate-900/50 border-b border-slate-300/50 dark:border-slate-800/50 select-none"
      >
        <div data-tauri-drag-region className="flex items-center gap-2 flex-1 h-full">
           <div className="h-3 w-3 rounded-full bg-primary-500 opacity-80" />
           <span data-tauri-drag-region className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">AI COPILOT</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => getCurrentWindow().minimize()} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => getCurrentWindow().toggleMaximize()} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors">
            <Square className="h-3 w-3" />
          </button>
          <button onClick={() => getCurrentWindow().close()} className="p-1 hover:bg-red-500 hover:text-white rounded text-slate-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`flex flex-col border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 transition-all duration-300 shrink-0 ${
          isCompact ? "w-14 items-center py-4" : "w-56 p-4"
        }`}
      >
        {/* App Title / Logo */}
        <div className={`flex items-center gap-2 mb-6 ${isCompact ? "justify-center" : "px-2"}`}>
          <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center text-white text-base shadow-lg shadow-primary-600/35">
            <Mic className="h-5 w-5 text-white" />
          </div>
          {!isCompact && (
            <div className="min-w-0">
              <h1 className="text-xs font-black tracking-wider uppercase text-primary-600 dark:text-primary-400">AI-Copilot</h1>
              <p className="text-[10px] font-bold text-slate-400">Desktop Shell</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 w-full space-y-1.5">
          {[
            { id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
            { id: "insights", label: "Meeting Insights", icon: <Tv className="h-4 w-4" /> },
            { id: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> }
          ].map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center rounded-xl transition-all w-full font-semibold text-xs ${
                  isCompact ? "justify-center h-10 w-10 p-0" : "px-3 py-2.5 gap-3"
                } ${
                  isActive
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-slate-100"
                }`}
                title={item.label}
              >
                {item.icon}
                {!isCompact && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Sizing Switch & Recording Indicator */}
        <div className="w-full flex flex-col items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {/* Sizing Switcher */}
          <button
            onClick={toggleLayoutMode}
            className={`flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-full transition-all text-xs font-semibold ${
              isCompact ? "h-10 w-10 p-0" : "px-3 py-2 gap-2.5"
            }`}
            title={isCompact ? "Switch to Dashboard Mode" : "Switch to Compact Overlay"}
          >
            {isCompact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            {!isCompact && <span>Compact Overlay</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200/60 dark:border-slate-900 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              {activeView === "chat" ? "Conversation Hub" : activeView === "insights" ? "Real-time Metrics" : "Control Panel"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {isListening ? "Listening Active" : "Systems Standby"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isListening && (
              <span className="text-[10px] font-semibold text-red-500 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 animate-pulse">
                REC
              </span>
            )}
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              {isCompact ? "OVERLAY" : "DASHBOARD"}
            </span>
          </div>
        </header>

        {/* View Layout Router */}
        <div className="flex-1 overflow-hidden p-3 md:p-5">
          {activeView === "chat" && (
            <ChatSection
              messages={messages}
              onSendMessage={handleSendMessage}
              socket={socket}
              isListening={isListening}
              setIsListening={setIsListening}
              isCompactMode={isCompact}
            />
          )}

          {activeView === "settings" && (
            <SettingsSection
              displaySettings={displaySettings}
              setDisplaySettings={setDisplaySettings}
              agentConfig={agentConfig}
              setAgentConfig={setAgentConfig}
              conversationHistory={conversationHistory}
              setConversationHistory={setConversationHistory}
              isCompactMode={isCompact}
            />
          )}

          {activeView === "insights" && (
            <div className="h-full overflow-y-auto space-y-4">
              {/* Insights Dashboard view */}
              <div className={`grid gap-4 ${isCompact ? "grid-cols-1" : "grid-cols-2"}`}>
                {/* Speaker time card */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Speaker Share</h3>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "You", share: 38, color: "bg-primary-500" },
                      { name: "Sarah Conner", share: 45, color: "bg-purple-500" },
                      { name: "Others", share: 17, color: "bg-slate-300 dark:bg-slate-700" }
                    ].map((speaker) => (
                      <div key={speaker.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-slate-600 dark:text-slate-400">{speaker.name}</span>
                          <span className="font-mono text-primary-500">{speaker.share}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${speaker.color} rounded-full`}
                            style={{ width: `${speaker.share}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment card */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Meeting Sentiment</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full border-[6px] border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-bold text-emerald-500 text-sm font-mono animate-spin-slow">
                      82%
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-500">Very Positive Tone</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        High engagement detected. Topics are constructive and focused on final deliverables.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Action Items */}
                <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm ${isCompact ? "" : "col-span-2"}`}>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Live Action Items</h3>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                      3 Pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { task: "Migrate styling to Tailwind CSS v4 and clear out default template CSS files.", owner: "You" },
                      { task: "Prepare API endpoint mappings for Custom Ollama local model.", owner: "Sarah" },
                      { task: "Schedule client review for prototype feedback next Wednesday.", owner: "Sarah" }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-50 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-800/10"
                      >
                        <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-tight">{item.task}</p>
                          <span className="text-[9px] text-primary-500 font-bold uppercase mt-1 inline-block">
                            Owner: {item.owner}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Prompts Suggester */}
                <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm ${isCompact ? "" : "col-span-2"}`}>
                  <div className="flex items-center gap-2 mb-3.5">
                    <Zap className="h-4 w-4 text-primary-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Prompt Suggestions</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Tell them we can easily fit the client demo inside next week's sprint scope.",
                      "Confirm that custom Web Audio streams raw base64 data to NestJS successfully."
                    ].map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(prompt, "general")}
                        className="w-full text-left p-2.5 rounded-xl border border-dashed border-primary-100 hover:border-primary-400 dark:border-primary-950 dark:hover:border-primary-800 bg-primary-50/20 hover:bg-primary-50/50 dark:bg-primary-950/5 dark:hover:bg-primary-950/20 transition-all text-xs font-semibold text-primary-600 dark:text-primary-400"
                      >
                        ðŸ’¡ {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

export default App;
