import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, HelpCircle, Code, Copy, Check, Bot, User } from "lucide-react";
import { Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MicInputButton } from "./MicInputButton";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  pillType?: string;
}

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, activePill: ChatMode) => void;
  socket: Socket | null;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  isCompactMode: boolean;
}

export type ChatMode = 'general' | 'action_items' | 'summary' | 'code';

interface PillOption {
  id: ChatMode;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  activeGradient: string;
  activeShadow: string;
  inactiveStyle: string;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  onSendMessage,
  socket,
  isListening,
  setIsListening,
  isCompactMode
}) => {
  const [inputText, setInputText] = useState("");
  const [activePill, setActivePill] = useState<ChatMode>("general");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const pills: PillOption[] = [
    {
      id: "general",
      label: "General Q&A",
      placeholder: "Ask any question about the meeting context...",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      activeGradient: "bg-gradient-to-r from-primary-500 to-primary-600 text-white",
      activeShadow: "shadow-lg shadow-primary-500/30",
      inactiveStyle: "border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-primary-50/60 dark:hover:bg-primary-950/20 hover:border-primary-300 dark:hover:border-primary-800 hover:text-primary-600 dark:hover:text-primary-400"
    },
    {
      id: "summary",
      label: "Summarize",
      placeholder: "Ask me to summarize the current conversation or meeting...",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      activeGradient: "bg-gradient-to-r from-purple-500 to-violet-600 text-white",
      activeShadow: "shadow-lg shadow-purple-500/30",
      inactiveStyle: "border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-800 hover:text-purple-600 dark:hover:text-purple-400"
    },
    {
      id: "action_items",
      label: "Actions",
      placeholder: "Ask me to extract action items, owners, and deadlines...",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      activeGradient: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
      activeShadow: "shadow-lg shadow-rose-500/30",
      inactiveStyle: "border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400"
    },
    {
      id: "code",
      label: "Code",
      placeholder: "Ask for code generation, review, or explanation...",
      icon: <Code className="h-3.5 w-3.5" />,
      activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
      activeShadow: "shadow-lg shadow-emerald-500/30",
      inactiveStyle: "border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400"
    }
  ];

  const currentPill = pills.find((p) => p.id === activePill) || pills[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), activePill);
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeechTranscript = (transcriptText: string) => {
    setInputText((prev) => {
      const space = prev.length && !prev.endsWith(" ") ? " " : "";
      return prev + space + transcriptText;
    });
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60">

      {/* ── Scrollable message area ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950/50">
        {messages.length === 0 ? (
          /* ── Empty state ────────────────────────────────────────── */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5 animate-fade-in">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 dark:from-primary-500/15 dark:to-primary-600/10 flex items-center justify-center border border-primary-500/10">
                <Sparkles className="h-10 w-10 text-primary-500/80" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-primary-500/5 blur-xl -z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Start the Conversation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Connect your microphone or type a question. The AI Copilot will analyze, summarize, and extract insights from your meeting in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-primary-500/80">
              <span className="px-2.5 py-1 rounded-full bg-primary-500/5 border border-primary-500/10">
                {currentPill.label} Mode
              </span>
            </div>
          </div>
        ) : (
          /* ── Message list ───────────────────────────────────────── */
          <div className="px-4 md:px-6 py-5 space-y-1">
            {messages.map((msg) => {
              const isAI = msg.role === "assistant";
              const isSystem = msg.role === "system";
              const isUser = msg.role === "user";


              return (
                <div key={msg.id} className="animate-fade-in">
                  {/* ── System messages ── */}
                  {isSystem && (
                    <div className="flex justify-center py-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                        {msg.text}
                      </span>
                    </div>
                  )}

                  {/* ── User messages ── */}
                  {isUser && (
                    <div className="flex justify-end gap-2.5 py-1.5 group">
                      <div className={`flex flex-col items-end ${isCompactMode ? "max-w-[90%]" : "max-w-[75%]"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.pillType && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-primary-200 uppercase tracking-wider">
                              {msg.pillType}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                        <div className="relative group/bubble">
                          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/15 select-text">
                            <p className="text-[13px] leading-[1.7] font-medium whitespace-pre-line">{msg.text}</p>
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="absolute -left-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover/bubble:opacity-100 transition-all bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 shadow-sm"
                            title="Copy"
                          >
                            {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20 mt-6">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* ── AI messages ── */}
                  {isAI && (
                    <div className="flex justify-start gap-2.5 py-1.5 group">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-600/30 mt-6">
                        <Bot className="h-3.5 w-3.5 text-primary-500" />
                      </div>
                      <div className={`flex flex-col ${isCompactMode ? "max-w-[90%]" : "max-w-[75%]"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wide">Copilot</span>
                          <span className="text-[9px] text-slate-400 font-mono">{formatMessageTime(msg.timestamp)}</span>
                        </div>
                        <div className="relative group/bubble">
                          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-100 dark:border-slate-700/40 shadow-sm select-text">
                            <div className="text-[13px] leading-[1.7] text-slate-800 dark:text-slate-100 prose-headings:text-slate-900 dark:prose-headings:text-white">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2.5 last:mb-0 leading-[1.7]" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2.5 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2.5 space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-3 mt-4 text-slate-900 dark:text-white" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-4 text-slate-900 dark:text-white" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-3 text-slate-900 dark:text-white" {...props} />,
                                  a: ({node, ...props}) => <a className="text-primary-500 hover:text-primary-600 hover:underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-3 border-primary-400 pl-3 my-2 text-slate-600 dark:text-slate-300 italic" {...props} />,
                                  code: ({node, inline, className, children, ...props}: any) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline ? (
                                      <div className="rounded-xl bg-slate-900 dark:bg-black/50 text-slate-100 overflow-hidden my-3 border border-slate-700/50 shadow-sm">
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 dark:bg-slate-900/60 border-b border-slate-700/50">
                                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                                            {match ? match[1] : "code"}
                                          </span>
                                          <button
                                            onClick={() => handleCopy(`code-${Math.random()}`, String(children))}
                                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors font-medium"
                                          >
                                            <Copy className="h-3 w-3" />
                                            Copy
                                          </button>
                                        </div>
                                        <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed">
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code className="bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-semibold text-rose-500 dark:text-rose-400 border border-slate-200/50 dark:border-slate-700/30" {...props}>
                                        {children}
                                      </code>
                                    )
                                  }
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="absolute -right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover/bubble:opacity-100 transition-all bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 shadow-sm"
                            title="Copy"
                          >
                            {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input area ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 md:p-4">
        
        {/* Mode pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-100/80 dark:border-slate-800/40 scrollbar-none">
          {pills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActivePill(pill.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap hover:scale-[1.03] active:scale-[0.97] ${
                activePill === pill.id
                  ? `${pill.activeGradient} ${pill.activeShadow} border-transparent`
                  : `${pill.inactiveStyle}`
              }`}
            >
              {pill.icon}
              <span>{!isCompactMode || activePill === pill.id ? pill.label : ""}</span>
            </button>
          ))}
        </div>

        {/* Textarea + controls */}
        <div className="relative flex items-end gap-2 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/40 focus-within:border-primary-400 dark:focus-within:border-primary-500/60 focus-within:shadow-sm focus-within:shadow-primary-500/5 transition-all p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={currentPill.placeholder}
            className="flex-1 bg-transparent outline-none border-none py-1.5 px-2 text-[13px] text-slate-800 dark:text-slate-100 resize-none font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 leading-relaxed"
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />

          <div className="flex items-center gap-1.5 shrink-0 self-end">
            {/* Microphone */}
            <MicInputButton
              socket={socket}
              onTranscript={handleSpeechTranscript}
              isListening={isListening}
              setIsListening={setIsListening}
            />

            {/* Send */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                inputText.trim()
                  ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
