import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  RefreshCw,
  Bot,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { sendChatMessage } from '../../lib/api';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    path?: string;
  };
  detailsList?: string[];
  helplines?: { name: string; number: string; desc: string }[];
}

const QUICK_SUGGESTIONS = [
  '🛠️ How do I report a pothole?',
  '🔍 Track complaint #REP-8941',
  '🏆 How do levels & badges work?',
  '🚨 Emergency civic helplines',
  '👥 Weekend volunteer drives',
  '☀️ Explain 7 AM City Briefing',
];

interface CivicChatbotProps {
  isReelsPage?: boolean;
}

export const CivicChatbot: React.FC<CivicChatbotProps> = ({ isReelsPage = false }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialMessages: ChatMessage[] = [
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Namaste! 👋 I am your Civic Assistant (Nagarik Mitra). How can I assist you in Ward 112 today?',
      timestamp: 'Just now',
      action: {
        label: '📸 File a New Civic Report',
        path: '/create-report',
      },
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTooltip(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build history from messages for context
      const history = messages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const reply = await sendChatMessage(query.trim(), history);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: botTime,
        },
      ]);
    } catch (error) {
      setIsTyping(false);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'I\'m having trouble connecting to the AI service right now. Please try again in a moment. If the issue persists, check that the AI service is running on port 8001.',
          timestamp: botTime,
        },
      ]);
    }
  };

  const handleActionClick = (path?: string) => {
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleResetChat = () => {
    setMessages(initialMessages);
    setIsTyping(false);
  };

  return (
    <>
      {/* Anchor Container on bottom right corner of app screen */}
      <div
        className={`fixed z-50 transition-all duration-300 right-4 sm:right-[max(1rem,calc(50vw-256px+1rem))] ${
          isReelsPage ? 'bottom-20' : 'bottom-20'
        }`}
      >
        {/* Floating Tooltip Bubble (Disappears when chat opens or closed) */}
        {!isOpen && showTooltip && (
          <div className="absolute bottom-16 right-0 mb-2 flex items-center gap-2 bg-[#0f172a] text-white px-3.5 py-2 rounded-2xl shadow-xl text-xs font-medium border border-white/10 animate-bounce duration-1000 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Civic Assistant • Ask me anything!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="ml-1 p-0.5 text-white/60 hover:text-white rounded-full cursor-pointer"
              aria-label="Dismiss tooltip"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Floating Action Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#07172c] via-[#0f2d59] to-[#1E744D] text-white shadow-[0_8px_24px_rgba(21,86,56,0.4)] hover:shadow-[0_12px_28px_rgba(21,86,56,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Open Civic AI Chatbot"
          >
            {/* Pulsing ring indicator */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />

            {/* Online Green Indicator */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />

            {/* Icon */}
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-white stroke-[2.2]" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
          </button>
        )}

        {/* Chat Window Modal / Popup */}
        {isOpen && (
          <div
            className="w-[350px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[80vh] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#cbd5e1] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-label="Civic AI Assistant"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#07172c] via-[#0f2d59] to-[#1E744D] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm leading-tight">Civic Mitra</h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400/25 text-emerald-200 font-medium">
                      Online
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-tight">Ward 112 AI Assistant • Instant Support</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Clear conversation"
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F9FAF9] text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0f2d59] text-white rounded-tr-xs'
                        : 'bg-white text-[#0f172a] border border-[#cbd5e1] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line text-[12.5px]">{msg.text}</p>

                    {/* Details bullet points if any */}
                    {msg.detailsList && (
                      <div className="mt-2 pt-2 border-t border-[#cbd5e1] space-y-1">
                        {msg.detailsList.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11.5px] text-[#334155]">
                            <span className="text-[#0f2d59] font-bold">•</span>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Helplines box if any */}
                    {msg.helplines && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.helplines.map((hl, idx) => (
                          <div
                            key={idx}
                            className="bg-[#f1f5f9] border border-[#DCE6E0] rounded-xl p-2 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-[#0f2d59] text-[11.5px]">{hl.name}</p>
                              <p className="text-[10px] text-[#64748b]">{hl.desc}</p>
                            </div>
                            <a
                              href={`tel:${hl.number}`}
                              className="px-2.5 py-1 bg-[#0f2d59] text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-[#07172c]"
                            >
                              <PhoneCall size={11} />
                              {hl.number}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action button if provided */}
                    {msg.action && (
                      <div className="mt-3 pt-2 border-t border-[#cbd5e1]">
                        <button
                          onClick={() => handleActionClick(msg.action?.path)}
                          className="w-full py-2 px-3 bg-gradient-to-r from-[#0f2d59] to-[#1E744D] text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 hover:opacity-95 shadow-xs transition-transform active:scale-98 cursor-pointer"
                        >
                          <span>{msg.action.label}</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[9.5px] text-[#8C9890] mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-[#cbd5e1] rounded-2xl px-3 py-2 w-16 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f2d59] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f2d59] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f2d59] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-white border-t border-[#EAEFEA] shrink-0">
              <div className="text-[10px] font-semibold text-[#64748b] mb-1.5 uppercase tracking-wider">
                Quick Questions
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f1f5f9] hover:bg-[#E2EBE5] text-[#0f172a] font-medium border border-[#DCE6E0] transition-colors shrink-0 cursor-pointer active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-[#cbd5e1] flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about potholes, tracking, helplines..."
                className="flex-1 bg-[#F4F7F5] border border-[#E0E7E2] rounded-xl px-3 py-2 text-xs text-[#0f172a] placeholder-[#64748b] focus:outline-hidden focus:ring-1 focus:ring-[#0f2d59] focus:border-[#0f2d59]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2 rounded-xl transition-all ${
                  inputText.trim()
                    ? 'bg-[#0f2d59] text-white hover:bg-[#07172c] shadow-xs cursor-pointer'
                    : 'bg-[#cbd5e1] text-[#8C9890] cursor-not-allowed'
                }`}
                aria-label="Send query"
              >
                <Send size={15} />
              </button>
            </form>

            {/* Micro Demo Disclaimer */}
            <div className="bg-[#f1f5f9] py-1 text-center text-[9.5px] text-[#64748b] border-t border-[#cbd5e1]">
              Powered by PrajaPulse AI
            </div>
          </div>
        )}
      </div>
    </>
  );
};
