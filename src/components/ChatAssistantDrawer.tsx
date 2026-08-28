import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Brain,
  ShieldAlert,
  SearchCode,
  Compass,
  ArrowDownToLine,
  Trash2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, GeminiModelId } from '../types';

interface ChatAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilePath: string;
  currentFileContent: string;
  onApplyPromptToTransform: (promptText: string) => void;
}

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentFilePath,
  currentFileContent,
  onApplyPromptToTransform,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `👋 **Hello! I'm your Gemini Code Assistant.**\n\nI can analyze your GitHub files, spot security vulnerabilities, brainstorm architectural refactorings, or draft detailed transformation prompts for the automated PR pipeline.\n\nHow can I help you with **\`${currentFilePath || 'this repository'}\`** today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [role, setRole] = useState<'architect' | 'security' | 'reviewer'>('architect');
  const [model, setModel] = useState<GeminiModelId>('gemini-3.5-flash');
  const [thinking, setThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          role,
          model,
          thinking,
          currentFile: currentFilePath
            ? {
                path: currentFilePath,
                content: currentFileContent,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.modelUsed || model,
        isThinking: thinking,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Error communicating with Gemini:** ${err.message || 'Unknown error occurred.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. Ready to analyze \`${currentFilePath || 'repository'}\`.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model,
      },
    ]);
  };

  return (
    <div
      id="chat-assistant-drawer"
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[520px] bg-slate-900 border-l border-slate-700/80 shadow-2xl z-50 flex flex-col backdrop-blur-lg"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">Gemini Multi-Turn Assistant</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Live Chat
              </span>
            </div>
            <p className="text-xs text-slate-400">Contextual reasoning over repository files</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            id="btn-close-assistant"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Role & Model Controls */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Role selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setRole('architect')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                role === 'architect'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Architect</span>
            </button>
            <button
              onClick={() => setRole('security')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                role === 'security'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Security</span>
            </button>
            <button
              onClick={() => setRole('reviewer')}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                role === 'reviewer'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SearchCode className="w-3 h-3" />
              <span>Reviewer</span>
            </button>
          </div>

          {/* Thinking Toggle */}
          <button
            onClick={() => setThinking(!thinking)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
              thinking
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Enable high thinking reasoning level"
          >
            <Brain className="w-3 h-3 text-purple-400" />
            <span>Thinking: {thinking ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Model selection */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Active Chat Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as GeminiModelId)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex tasks)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (General tasks)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast tasks)</option>
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 border-b border-slate-800/40 pb-1">
                <span>{msg.role === 'user' ? 'You' : 'Gemini'}</span>
                <div className="flex items-center gap-1.5 font-mono">
                  {msg.isThinking && <span className="text-purple-400 font-bold">🧠 Thinking</span>}
                  {msg.model && <span>{msg.model}</span>}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              <div className="prose prose-invert prose-xs max-w-none break-words text-slate-200">
                <Markdown>{msg.text}</Markdown>
              </div>

              {/* Action button if model suggested a refactoring instruction */}
              {msg.role === 'model' && msg.text.length > 40 && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => {
                      onApplyPromptToTransform(msg.text);
                      onClose();
                    }}
                    className="text-[10px] text-indigo-300 hover:text-white px-2 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/60 flex items-center gap-1 transition"
                  >
                    <ArrowDownToLine className="w-3 h-3" />
                    <span>Send to Transform Engine</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-3.5 space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {thinking ? 'Gemini 3.1 Pro deep thinking over code...' : 'Generating code analysis...'}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Quick Suggestions */}
      {currentFilePath && (
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0">Quick:</span>
          <button
            onClick={() => handleSendMessage(`Audit ${currentFilePath} for security vulnerabilities, race conditions, or missing sanitization.`)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition"
          >
            🛡️ Security Audit
          </button>
          <button
            onClick={() => handleSendMessage(`Explain the architectural design and flow of ${currentFilePath}.`)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition"
          >
            🔍 Explain Architecture
          </button>
          <button
            onClick={() => handleSendMessage(`Suggest a refactoring plan to improve modularity and testability for ${currentFilePath}.`)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition"
          >
            ✨ Refactoring Plan
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-chat-message"
            type="text"
            placeholder="Ask about this repo, design a refactoring, or audit security..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            id="btn-send-chat"
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
