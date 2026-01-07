import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { findAnswer, quickSuggestions, getRelatedQuestions, type KnowledgeItem } from '@/lib/chatbot-knowledge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  relatedQuestions?: KnowledgeItem[];
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    setShowWelcome(false);
    setInputValue('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Find answer from knowledge base
    setTimeout(() => {
      const match = findAnswer(messageText);
      
      let responseContent: string;
      let relatedQuestions: KnowledgeItem[] = [];
      
      if (match) {
        responseContent = match.answer;
        relatedQuestions = getRelatedQuestions(match.category, match.id);
      } else {
        responseContent = "I'm not sure about that specific question. I can help with:\n\n• **Platform navigation** - How to use CCMS features\n• **CQC compliance** - Regulations and best practices\n• **Care documentation** - Care plans and notes guidance\n\nTry asking about audits, care plans, incidents, or CQC requirements.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        relatedQuestions: relatedQuestions.length > 0 ? relatedQuestions : undefined,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 300); // Small delay for natural feel
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mt-3">')
      .replace(/\n•/g, '</p><p class="mt-1 flex gap-2"><span class="text-primary">•</span><span>')
      .replace(/•\s/g, '')
      .replace(/<\/span><\/p>(\s*<p class="mt-1 flex gap-2">)/g, '</span></p>$1');
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 hover:shadow-2xl group"
        aria-label="Open Help Assistant"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 transition-all duration-300 border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden",
        isMinimized ? "w-80 h-16" : "w-[400px] h-[550px]"
      )}
      style={{ 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-white flex-shrink-0 cursor-pointer"
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Help Assistant</h3>
            <p className="text-xs text-white/70">Platform & CQC guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <div className={cn("w-4 h-0.5 bg-white rounded transition-transform", isMinimized && "rotate-180")} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
            {/* Welcome Screen */}
            {showWelcome && messages.length === 0 && (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    How can I help you?
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ask about platform features or CQC compliance
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1">
                    Popular questions
                  </p>
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                          {suggestion}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                        message.role === 'user' 
                          ? "bg-gradient-to-br from-primary to-primary/80 text-white" 
                          : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                      )}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      {/* Message bubble */}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-md"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-md text-slate-700 dark:text-slate-200"
                        )}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ __html: `<p>${formatMessageContent(message.content)}</p>` }}
                          className="leading-relaxed [&_p]:mb-0"
                        />
                      </div>
                    </div>
                    
                    {/* Related Questions */}
                    {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                      <div className="ml-11 space-y-1.5">
                        <p className="text-xs text-slate-400 font-medium">Related questions:</p>
                        {message.relatedQuestions.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => handleSendMessage(q.question)}
                            className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 text-slate-600 dark:text-slate-300 hover:text-primary transition-all"
                          >
                            {q.question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  inputValue.trim()
                    ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Instant answers for platform & CQC questions
            </p>
          </div>
        </>
      )}
    </div>
  );
}
