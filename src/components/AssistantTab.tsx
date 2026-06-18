import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Brain, Lock, AlertCircle, Bot, User } from "lucide-react";
import { ChatMessage, RowResult, ValidationSummary } from "../types";

interface AssistantTabProps {
  summary: ValidationSummary;
  results: RowResult[];
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function AssistantTab({
  summary,
  results,
  chatHistory,
  setChatHistory,
}: AssistantTabProps) {
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [overrideApiKey, setOverrideApiKey] = useState(() => {
    return localStorage.getItem("TRANSACTIQ_OVERRIDE_KEY") || "";
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setOverrideApiKey(val);
    if (val) {
      localStorage.setItem("TRANSACTIQ_OVERRIDE_KEY", val);
    } else {
      localStorage.removeItem("TRANSACTIQ_OVERRIDE_KEY");
    }
  };

  const executeSend = async (messageText: string, isAutoFix = false) => {
    if (!messageText.trim()) return;

    // Add user message to history
    const userMsg: ChatMessage = {
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory(prev => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    // Prepare context sample for LLM
    const failedSamples = results
      .filter(r => r.status === "FAIL")
      .map(r => ({
        rowNum: r.rowNum,
        data: r.data,
        errors: r.errors.map(e => `[${e.column}] ${e.message}`)
      }));

    const validationContext = {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      errorTypes: summary.errorTypes,
      failedSamples: failedSamples,
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: messageText,
          validationContext,
          promptType: isAutoFix ? "autofix" : "chat",
          customApiKey: overrideApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response from Gemini AI server.");
      }

      const assistantMsg: ChatMessage = {
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        sender: "assistant",
        text: `⚠️ **Error Processing Request**: ${err.message || "Something went wrong on our backend servers. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSend(userInput);
  };

  // Clickable suggested chips
  const suggestedQueries = [
    "How many rows failed phone validation?",
    "Which country has the most errors?",
    "What is the most common error type?",
    "Show me a summary of the data quality."
  ];

  // Helper parser for simple inline bold, code styling in UI
  const formatMarkdownText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Bold formatter
      let rendered = line;
      
      // Inline Code Blocks / Monospace formats
      rendered = rendered.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-rose-600 px-1 py-0.5 rounded-sm font-mono text-xs">$1</code>');
      
      // Strong Bold formatting
      rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-800">$1</strong>');
      
      // If starts with list bullet
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleanContent = rendered.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-600 leading-relaxed text-xs my-1" dangerouslySetInnerHTML={{ __html: cleanContent }} />
        );
      }

      // Check for headings
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-xs font-bold text-slate-700 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: rendered.substring(4) }} />
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2 border-b border-slate-100 pb-1" dangerouslySetInnerHTML={{ __html: rendered.substring(3) }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed min-h-[16px] my-1.5" dangerouslySetInnerHTML={{ __html: rendered }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-[600px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs animate-fade-in">
      
      {/* Top Controller Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-[#3b82f6] rounded-xl">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">CleanIQ AI Co-Pilot</h3>
            <p className="text-[10px] text-slate-400 font-medium">Equipped with full context of active validation logs & metrics</p>
          </div>
        </div>

        {/* API Key overrides */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="password"
              placeholder="Workspace Key Active (Optional override)"
              value={overrideApiKey}
              onChange={handleApiKeyChange}
              className="pl-8 pr-3 py-1.5 w-[220px] bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#3b82f6] placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Conversation Log Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto py-10">
            <div className="p-4 bg-blue-50/50 rounded-full text-[#3b82f6] mb-4 animate-pulse">
              <Bot className="h-8 w-8" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Interactive Diagnostic Assistant</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Ask deep questions about your transactions, discover cross-border patterns, summarize issues, or get fixes instantly.
            </p>
            
            {/* Autofixes button if failures present */}
            {summary.failed > 0 && (
              <button
                onClick={() => executeSend("Please analyze and suggest fixes for my records with failures.", true)}
                className="w-full mb-4 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Brain className="h-3.5 w-3.5 text-blue-300" />
                Suggest fixes for these errors (Top 5 Rows)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3.5 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                    msg.sender === "user"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-blue-50 text-[#3b82f6] border border-blue-100"
                  }`}
                >
                  {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs shadow-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-slate-900 text-slate-105 rounded-tr-none text-white"
                        : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100/80"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <p className="text-xs text-slate-100 whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-0.5">{formatMarkdownText(msg.text)}</div>
                    )}
                  </div>
                  <div className={`text-[9px] text-slate-400 font-medium ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Simulated loader thinking state */}
            {isLoading && (
              <div className="flex gap-3.5 max-w-[85%] mr-auto">
                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-[#3b82f6] animate-spin" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Suggested prompting chips */}
      {summary.total > 0 && (
        <div className="px-6 py-2 bg-slate-100/50 flex gap-2 overflow-x-auto shrink-0 border-t border-slate-100 scrollbar-none py-2 bg-slate-50">
          {suggestedQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => executeSend(query)}
              disabled={isLoading}
              className="text-[10px] bg-white border border-slate-205 text-slate-600 hover:text-[#3b82f6] hover:bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap font-medium cursor-pointer transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      )}

      {/* Form Input Footer */}
      <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0">
        <input
          type="text"
          placeholder={summary.total === 0 ? "Ingest a spreadsheet first to wake up co-pilot..." : "Ask Gemini about phone lengths, date formatting, error correlations..."}
          disabled={summary.total === 0 || isLoading}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-[#3b82f6] disabled:opacity-50 transition-colors font-medium text-slate-705"
        />
        <button
          type="submit"
          disabled={summary.total === 0 || !userInput.trim() || isLoading}
          className="p-3 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}
