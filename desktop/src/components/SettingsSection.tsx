import React, { useState } from "react";
import {
  Laptop,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Trash2,
  Info,
  History,
  Sliders,
  Cpu,
  Check,
  FileJson,
  FileText
} from "lucide-react";

export interface DisplaySettings {
  theme: "light" | "dark" | "system";
  primaryColor: "indigo" | "rose" | "emerald" | "amber" | "violet";
  fontFamily: "sans" | "mono" | "serif";
  fontSize: number;
}

export interface AgentConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface MeetingLog {
  id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string;
}

interface SettingsSectionProps {
  displaySettings: DisplaySettings;
  setDisplaySettings: (settings: DisplaySettings) => void;
  agentConfig: AgentConfig;
  setAgentConfig: (config: AgentConfig) => void;
  conversationHistory: MeetingLog[];
  setConversationHistory: (history: MeetingLog[]) => void;
  isCompactMode: boolean;
}

type TabType = "display" | "agent" | "history" | "about";

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  displaySettings,
  setDisplaySettings,
  agentConfig,
  setAgentConfig,
  conversationHistory,
  setConversationHistory,
  isCompactMode
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TabType>("display");
  const [showApiKey, setShowApiKey] = useState(false);
  const [successExportId, setSuccessExportId] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "display", label: "Display", icon: <Sliders className="h-4 w-4" /> },
    { id: "agent", label: "Agent Config", icon: <Cpu className="h-4 w-4" /> },
    { id: "history", label: "History", icon: <History className="h-4 w-4" /> },
    { id: "about", label: "About", icon: <Info className="h-4 w-4" /> }
  ];

  const handleExport = (meeting: MeetingLog, type: "json" | "markdown") => {
    let content = "";
    let filename = "";

    if (type === "json") {
      content = JSON.stringify(meeting, null, 2);
      filename = `${meeting.title.replace(/\s+/g, "_")}_transcript.json`;
    } else {
      content = `# Meeting Transcript: ${meeting.title}\nDate: ${meeting.date}\nDuration: ${meeting.duration}\n\n## Discussion Logs\n\n${meeting.transcript}`;
      filename = `${meeting.title.replace(/\s+/g, "_")}_transcript.md`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessExportId(`${meeting.id}-${type}`);
    setTimeout(() => setSuccessExportId(null), 2000);
  };

  const handleDeleteHistory = (id: string) => {
    setConversationHistory(conversationHistory.filter((log) => log.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
      {/* Sub-tabs header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className={`flex w-full overflow-x-auto ${isCompactMode ? "px-2 gap-1 py-2 justify-between" : "px-4 gap-2 py-3"}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100"
              }`}
            >
              {tab.icon}
              {!isCompactMode && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 text-slate-800 dark:text-slate-100">
        {activeSubTab === "display" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Theme Selection</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
                  { mode: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
                  { mode: "system", label: "System Sync", icon: <Laptop className="h-4 w-4" /> }
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setDisplaySettings({ ...displaySettings, theme: item.mode as any })}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      displaySettings.theme === item.mode
                        ? "border-primary-500 bg-primary-500/5 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Primary Color</h3>
              <div className="flex gap-3">
                {[
                  { id: "indigo", colorClass: "bg-indigo-500" },
                  { id: "rose", colorClass: "bg-rose-500" },
                  { id: "emerald", colorClass: "bg-emerald-500" },
                  { id: "amber", colorClass: "bg-amber-500" },
                  { id: "violet", colorClass: "bg-violet-500" }
                ].map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setDisplaySettings({ ...displaySettings, primaryColor: color.id as any })}
                    className={`w-8 h-8 rounded-full ${color.colorClass} shadow-sm transition-all flex items-center justify-center ${
                      displaySettings.primaryColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-" + color.id + "-500 scale-110"
                        : "hover:scale-110 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {displaySettings.primaryColor === color.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Typography</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Font Family</label>
                <select
                  value={displaySettings.fontFamily}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, fontFamily: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="sans">Inter (Modern Sans)</option>
                  <option value="mono">JetBrains Mono (Readable Code)</option>
                  <option value="serif">Outfit (Premium Serif)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Font Size</span>
                  <span className="font-mono text-primary-500">{displaySettings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={displaySettings.fontSize}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, fontSize: parseInt(e.target.value) })}
                  className="w-full accent-primary-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 px-1">
                  <span>12px (Compact)</span>
                  <span>16px (Normal)</span>
                  <span>20px (Larger)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "agent" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">LLM Provider</label>
              <select
                value={agentConfig.provider}
                onChange={(e) => setAgentConfig({ ...agentConfig, provider: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="ollama">Custom Ollama (Local)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Model Selection</label>
              <select
                value={agentConfig.model}
                onChange={(e) => setAgentConfig({ ...agentConfig, model: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {agentConfig.provider === "gemini" && (
                  <>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Fast)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Smart)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </>
                )}
                {agentConfig.provider === "openai" && (
                  <>
                    <option value="gpt-4o">gpt-4o (Omni)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </>
                )}
                {agentConfig.provider === "anthropic" && (
                  <>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                    <option value="claude-3-opus">claude-3-opus</option>
                    <option value="claude-3-haiku">claude-3-haiku</option>
                  </>
                )}
                {agentConfig.provider === "ollama" && (
                  <>
                    <option value="llama3">llama3</option>
                    <option value="mistral">mistral</option>
                    <option value="phi3">phi3</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Secure API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig({ ...agentConfig, apiKey: e.target.value })}
                  placeholder={agentConfig.provider === "ollama" ? "Not required for Local Ollama" : "sk-................................"}
                  disabled={agentConfig.provider === "ollama"}
                  className="w-full pl-3 pr-10 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                />
                {agentConfig.provider !== "ollama" && (
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Your API key is securely saved locally inside Tauri's app config.</p>
            </div>
          </div>
        )}

        {activeSubTab === "history" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Past Meetings</h3>
            {conversationHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-100 dark:border-slate-800">
                No conversation history found.
              </div>
            ) : (
              <div className="space-y-2.5">
                {conversationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/10"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.date} â€¢ {item.duration}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                      <span className="text-[10px] text-slate-500 mr-auto font-medium">Export transcript:</span>
                      <button
                        type="button"
                        onClick={() => handleExport(item, "markdown")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-900/20 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {successExportId === `${item.id}-markdown` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        MD
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport(item, "json")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-900/20 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {successExportId === `${item.id}-json` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <FileJson className="h-3 w-3" />
                        )}
                        JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "about" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary-500/25">
                ðŸŽ™ï¸
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Meeting Copilot</h4>
                <p className="text-xs font-semibold text-primary-500">v1.1.0 (Production Build)</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              AI Meeting Copilot is a lightweight, responsive desktop overlay designed to assist in real-time meetings.
              It listens, transcribes, and extracts key action items, summaries, and answering assistance using state-of-the-art LLMs.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Environment:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">Tauri v2 + React 19</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Commit Ref:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">3f9b2d8 (main)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Developer:</span>
                <span className="font-mono text-primary-500 dark:text-primary-400">yashtank09</span>
              </div>
            </div>

            <a
              href="https://github.com/yashtank09/ai-copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>yashtank09/ai-copilot</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
