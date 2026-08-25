"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  RefreshCw,
  Bot,
  User as UserIcon,
  ShieldCheck,
  HelpCircle,
  LogIn,
  Minimize2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';
import { sendCampusAssistantMessage, AssistantChatMessage } from '../lib/gemini';

interface CampusAssistantChatProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

const INITIAL_GREETING =
  "Hi! I'm Campus Bot 👋 I can help with Share, student verification, marketplace rules, safety, privacy, and campus exchanges. What would you like to know?";

const QUICK_PROMPTS = [
  'Where should I meet sellers safely?',
  'How does student verification work?',
  'What items are prohibited?',
];

export const CampusAssistantChat: React.FC<CampusAssistantChatProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    { role: 'assistant', content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedUserMessage, setLastFailedUserMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom whenever messages or loading changes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus textarea on open
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages, isLoading, scrollToBottom]);

  // Keyboard shortcut: Escape to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : input).trim();
    if (!content || isLoading) return;

    // Visual auth check
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const newUserMessage: AssistantChatMessage = {
      role: 'user',
      content,
    };

    // Update conversation state with user's question
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setLastFailedUserMessage(null);
    setIsLoading(true);

    try {
      // Call backend API with conversation history and user auth token
      const responseText = await sendCampusAssistantMessage(
        updatedMessages,
        currentUser.uid
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
        },
      ]);
    } catch (err: any) {
      console.error('Campus Bot error:', err);
      setLastFailedUserMessage(content);
      const errorMessage =
        err?.message && !err.message.includes('fetch')
          ? err.message
          : "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    handleSendMessage(prompt);
  };

  const handleRetry = () => {
    if (!lastFailedUserMessage || isLoading) return;
    handleSendMessage(lastFailedUserMessage);
  };

  const handleResetChat = () => {
    setMessages([{ role: 'assistant', content: INITIAL_GREETING }]);
    setInput('');
    setLastFailedUserMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside aria-label="Campus AI Assistant">
      {/* Floating Bottom-Right Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-emerald-400 dark:focus:ring-emerald-300 cursor-pointer border border-stone-700/60 dark:border-emerald-400/40 select-none group"
          aria-label="Open 24/7 Campus AI Assistant"
          aria-expanded={isOpen}
          id="campus-bot-launcher"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 dark:text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="tracking-tight">24/7 Campus AI ✨</span>
        </button>
      )}

      {/* Floating Chat Panel / Popover */}
      {isOpen && (
        <div
          ref={chatPanelRef}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[calc(100vh-3rem)] rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campus-bot-title"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-stone-900 dark:bg-stone-950 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 id="campus-bot-title" className="font-extrabold text-sm tracking-tight text-stone-100 truncate">
                    Campus Bot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    24/7 AI
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">Grounded for SRM Community</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Close chat (Esc)"
                aria-label="Close chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auth Banner if unauthenticated */}
          {!currentUser && (
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Sign in to ask questions to Campus Bot</span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/80 dark:bg-stone-950/80">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} group`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed transition-all shadow-sm ${
                      isUser
                        ? 'bg-stone-900 text-white dark:bg-emerald-600 dark:text-white rounded-tr-xs font-medium'
                        : 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 border-2 border-stone-200 dark:border-stone-700 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-content space-y-1.5 text-stone-950 dark:text-stone-100">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed text-stone-950 dark:text-stone-100 font-medium">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5 text-stone-950 dark:text-stone-100">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 text-stone-950 dark:text-stone-100">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed text-stone-950 dark:text-stone-100">{children}</li>,
                            strong: ({ children }) => <strong className="font-extrabold text-stone-950 dark:text-white">{children}</strong>,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 dark:text-emerald-300 font-bold underline underline-offset-2 hover:text-emerald-800 dark:hover:text-emerald-200"
                              >
                                {children}
                              </a>
                            ),
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-stone-200 dark:border-stone-700">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="text-xs text-stone-700 dark:text-stone-300 font-semibold ml-1.5">
                    Campus Bot is thinking...
                  </span>
                </div>
              </div>
            )}

            {/* Retry Button if last message failed */}
            {lastFailedUserMessage && !isLoading && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry previous question</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Preset Quick Prompt Chips */}
          {messages.length <= 3 && (
            <div className="px-3.5 py-2.5 bg-stone-100/90 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5 px-1">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={isLoading}
                    className="text-left text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 border-2 border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-stone-900 dark:text-stone-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-stone-900 border-t-2 border-stone-200 dark:border-stone-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentUser
                      ? 'Ask Campus Bot about safety, verification, rules...'
                      : 'Sign in to ask questions to Campus Bot...'
                  }
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs sm:text-sm font-medium text-stone-950 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-stone-750 transition-all resize-none max-h-24"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 px-1 font-medium">
              <span>Press Enter to send, Shift+Enter for newline</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Grounded AI
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
