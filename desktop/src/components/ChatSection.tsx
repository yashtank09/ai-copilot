import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, HelpCircle, Code, Copy, Check } from "lucide-react";
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
  activeColor: string;
  pillColor: string;
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

  const pills: PillOption[] = [
    {
      id: "general",
      label: "General Q&A",
      placeholder: "Ask any question about the meeting context...",
      icon: <HelpCircle className="h-3 w-3" />,
      activeColor: "bg-primary-500 text-white shadow-primary-500/20",
      pillColor: "border-primary-100 dark:border-primary-900/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 text-primary-600 dark:text-primary-400"
    },
    {
      id: "summary",
      label: "Summarize Mode",
      placeholder: "Ask me to summarize the current conversation or meeting...",
      icon: <Sparkles className="h-3 w-3" />,
      activeColor: "bg-purple-500 text-white shadow-purple-500/20",
      pillColor: "border-purple-100 dark:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 text-purple-600 dark:text-purple-400"
    },
    {
      id: "action_items",
      label: "Action Items",
      placeholder: "Ask me to extract action items, owners, and deadlines...",
      icon: <AlertCircle className="h-3 w-3" />,
      activeColor: "bg-rose-500 text-white shadow-rose-500/20",
      pillColor: "border-rose-100 dark:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 text-rose-600 dark:text-rose-400"
    },
    {
      id: "code",
      label: "Code Help",
      placeholder: "Ask for code generation, review, or explanation...",
      icon: <Code className="h-3 w-3" />,
      activeColor: "bg-emerald-500 text-white shadow-emerald-500/20",
      pillColor: "border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400"
    }
  ];

  const currentPill = pills.find((p) => p.id === activePill) || pills[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
      {/* Scrollable message timeline */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary-500/5 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/10 shadow-sm animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Start the Conversation</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-relaxed">
                Connect your microphone, start the copilot overlay, or ask questions directly about the ongoing meeting insights.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
            {messages.map((msg) => {
              const isAI = msg.role === "assistant";
              const isSystem = msg.role === "system";

              return (
                <div key={msg.id} className="relative group animate-fade-in">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm transition-all ${
                      isSystem
                        ? "bg-slate-400 dark:bg-slate-600"
                        : isAI
                        ? "bg-primary-500 ring-4 ring-primary-500/10"
                        : "bg-slate-800 dark:bg-slate-200"
                    }`}
                  />

                  {/* Message bubble card */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
                        {isSystem ? "System" : isAI ? "Copilot" : "You"}
                      </span>
                      {msg.pillType && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-900/30 uppercase tracking-wider">
                          {msg.pillType}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono ml-auto">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-full md:max-w-[85%] select-text group/bubble ${
                        isSystem
                          ? "bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 font-mono"
                          : isAI
                          ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-100"
                          : "bg-primary-600 text-white shadow-sm border border-primary-700/30 self-start"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 overflow-x-hidden">
                          {isAI ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-md font-bold mb-2 mt-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-3" {...props} />,
                                a: ({node, ...props}) => <a className="text-primary-500 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                code: ({node, inline, className, children, ...props}: any) => {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline ? (
                                    <div className="rounded-md bg-slate-800 dark:bg-slate-950 text-slate-100 overflow-hidden my-3 border border-slate-700 w-full max-w-full">
                                      {match && (
                                        <div className="text-[10px] px-3 py-1 bg-slate-900 border-b border-slate-700 text-slate-400 font-mono flex items-center justify-between">
                                          <span>{match[1]}</span>
                                        </div>
                                      )}
                                      <pre className="p-3 overflow-x-auto text-xs font-mono w-full max-w-full scrollbar-thin scrollbar-thumb-slate-700">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    </div>
                                  ) : (
                                    <code className="bg-slate-200 dark:bg-slate-800 rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold text-rose-500 dark:text-rose-400" {...props}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          ) : (
                            <p className="whitespace-pre-line">{msg.text}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className={`shrink-0 p-1 rounded-md opacity-0 group-hover/bubble:opacity-100 transition-opacity ${
                            isSystem || isAI 
                              ? "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400" 
                              : "hover:bg-primary-500 text-primary-100"
                          }`}
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
        {/* Quick-toggle action pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-50 dark:border-slate-800/40 scrollbar-none">
          {pills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActivePill(pill.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${
                activePill === pill.id
                  ? `${pill.activeColor} border-transparent shadow-sm`
                  : `${pill.pillColor}`
              }`}
            >
              {pill.icon}
              <span>{!isCompactMode || activePill === pill.id ? pill.label : ""}</span>
            </button>
          ))}
        </div>

        {/* Textarea + controls */}
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 focus-within:border-primary-500 dark:focus-within:border-primary-500/80 transition-colors p-1.5">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={currentPill.placeholder}
            className="flex-1 max-h-24 bg-transparent outline-none border-none py-1.5 px-2 text-xs text-slate-800 dark:text-slate-100 resize-none font-medium placeholder-slate-400 focus:ring-0"
          />

          <div className="flex items-center gap-1.5 shrink-0 self-end ml-1">
            {/* Microphone Input integration */}
            <MicInputButton
              socket={socket}
              onTranscript={handleSpeechTranscript}
              isListening={isListening}
              setIsListening={setIsListening}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2 rounded-full flex items-center justify-center transition-all ${
                inputText.trim()
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/20 hover:bg-primary-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
