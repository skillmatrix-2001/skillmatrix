"use client";
import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = "🤖";

function TypingIndicator() {
  return (
    <div style={styles.typingWrapper}>
      <div style={styles.botAvatar}>{BOT_AVATAR}</div>
      <div style={styles.typingBubble}>
        <span style={{ ...styles.dot, animationDelay: "0s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.18s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.36s" }} />
      </div>
    </div>
  );
}

function Message({ msg, index }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        ...styles.msgRow,
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: `messageIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
        opacity: 0,
        transform: "scale(0.95) translateY(10px)",
        animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
      }}
    >
      {!isUser && <div style={styles.botAvatar}>{BOT_AVATAR}</div>}
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.botBubble),
        }}
      >
        {msg.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Chatbot({ userContext }) {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm your assistant. Ask me anything about interviews, resumes, or campus recruitment!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [fabActive, setFabActive] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Scroll listener to hide/show FAB
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setFabVisible(false);
      } else {
        setFabVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Inject global styles for hover effects (client-side only)
  useEffect(() => {
    if (typeof document !== "undefined") {
      // Style for close button hover
      const closeStyle = document.createElement("style");
      closeStyle.textContent = `
        button[title="Close chat"]:hover {
          background: #DC2626 !important;
          color: white !important;
        }
      `;
      document.head.appendChild(closeStyle);

      // Style for FAB hover
      const fabHoverStyle = document.createElement("style");
      fabHoverStyle.textContent = `
        .chatbot-fab:hover {
          transform: scale(1.05) !important;
        }
      `;
      document.head.appendChild(fabHoverStyle);

      return () => {
        document.head.removeChild(closeStyle);
        document.head.removeChild(fabHoverStyle);
      };
    }
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          user_context: userContext || null,
        }),
      });

      const data = await res.json();
      const botMsg = { role: "assistant", content: data.reply || "Sorry, I couldn't process that." };
      setMessages((prev) => [...prev, botMsg]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you today?",
      },
    ]);
  };

  const toggleChat = () => {
    if (open) {
      setIsClosing(true);
      setTimeout(() => {
        setOpen(false);
        setIsClosing(false);
      }, 200);
    } else {
      setOpen(true);
    }
  };

  const handleFabClick = () => {
    setFabActive(true);
    setTimeout(() => setFabActive(false), 150);
    toggleChat();
  };

  const quickReplies = ["Resume tips", "Mock interview prep", "Top companies hiring", "Aptitude resources"];

  return (
    <>
      <style>{`
        @keyframes messageIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(20px) scale(0.96); }
        }
        @keyframes blink {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
        @keyframes fabClick {
          0% { transform: scale(1); }
          50% { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        /* Desktop full-height sidebar */
        @media (min-width: 769px) {
          .chatbot-window {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 400px !important;
            height: 100vh !important;
            max-height: none !important;
            border-radius: 0 !important;
            box-shadow: -4px 0 20px rgba(0,0,0,0.3);
          }
        }
        /* Mobile full-screen */
        @media (max-width: 768px) {
          .chatbot-window {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            max-width: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            height: 100% !important;
            max-height: none !important;
          }
        }
        .fab-click {
          animation: fabClick 0.15s ease-out;
        }
      `}</style>

      {/* Floating Trigger Button - only show when chat is closed and visible */}
      {!open && (
        <button
          className={`chatbot-fab ${fabActive ? "fab-click" : ""}`}
          onClick={handleFabClick}
          style={{
            ...styles.fab,
            transform: fabVisible ? "translateY(0)" : "translateY(120px)",
            opacity: fabVisible ? 1 : 0,
            transition: "transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.25s ease",
          }}
          aria-label="Open chatbot"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {!open && unread > 0 && <span style={styles.badge}>{unread}</span>}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="chatbot-window"
          style={{
            ...styles.window,
            animation: isClosing ? "fadeSlideDown 0.2s ease-out forwards" : "fadeSlideUp 0.25s ease-out",
          }}
        >
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerAvatar}>{BOT_AVATAR}</div>
              <div>
                <div style={styles.headerTitle}>Assistant</div>
                <div style={styles.headerStatus}>
                  <span style={styles.onlineDot} /> Online
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clearChat} style={styles.clearBtn} title="Clear chat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
              {/* Red close button */}
              <button onClick={toggleChat} style={styles.closeBtn} title="Close chat">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} index={i} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div style={styles.quickPrompts}>
              {quickReplies.map((q) => (
                <button
                  key={q}
                  style={styles.quickBtn}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => sendMessage(), 0);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about placements, resumes, interviews..."
              style={styles.input}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || loading ? 0.45 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div style={styles.poweredBy}>Powered by skillmatrix</div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 60,
    height: 60,
    borderRadius: "30px",
    background: "linear-gradient(135deg, #7C5CFF, #5a3dcf)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    transition: "transform 0.2s",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "#EF4444",
    color: "white",
    borderRadius: "50%",
    width: 20,
    height: 20,
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  window: {
    background: "#12151C",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9998,
    borderLeft: "1px solid #222634",
    boxShadow: "0 0 0 2px rgba(124,92,255,0.2), 0 24px 60px rgba(0,0,0,0.4)",
  },
  header: {
    background: "#0B0D12",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #222634",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(124,92,255,0.2), rgba(124,92,255,0.05))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  headerTitle: {
    color: "#E5E7EB",
    fontWeight: 700,
    fontSize: 14,
  },
  headerStatus: {
    color: "#6B7280",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22C55E",
  },
  clearBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s",
  },
  closeBtn: {
    background: "rgba(220,38,38,0.2)",
    border: "1px solid rgba(220,38,38,0.5)",
    borderRadius: 8,
    padding: "6px 8px",
    cursor: "pointer",
    color: "#EF4444",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#0B0D12",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(124,92,255,0.15), rgba(124,92,255,0.05))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    padding: "10px 13px",
    borderRadius: 18,
    fontSize: 13.5,
    lineHeight: 1.55,
    wordBreak: "break-word",
  },
  userBubble: {
    background: "linear-gradient(135deg, #7C5CFF, #6d4fe0)",
    color: "#FFFFFF",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    background: "#171B24",
    color: "#E5E7EB",
    borderBottomLeftRadius: 4,
    border: "1px solid #222634",
  },
  typingWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    animation: "messageIn 0.3s ease-out forwards",
    opacity: 0,
    transform: "scale(0.95) translateY(10px)",
  },
  typingBubble: {
    background: "#171B24",
    padding: "12px 16px",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    display: "flex",
    gap: 5,
    alignItems: "center",
    border: "1px solid #222634",
  },
  dot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#7C5CFF",
    animation: "blink 1.2s infinite",
  },
  quickPrompts: {
    padding: "8px 14px",
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    background: "#0B0D12",
    borderTop: "1px solid #222634",
  },
  quickBtn: {
    padding: "5px 11px",
    borderRadius: 20,
    border: "1px solid #222634",
    background: "#171B24",
    color: "#9CA3AF",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 14px",
    borderTop: "1px solid #222634",
    background: "#12151C",
    alignItems: "center",
  },
  input: {
    flex: 1,
    border: "1px solid #222634",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
    color: "#E5E7EB",
    background: "#0B0D12",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "linear-gradient(135deg, #7C5CFF, #6d4fe0)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },
  poweredBy: {
    textAlign: "center",
    fontSize: 10.5,
    color: "#6B7280",
    padding: "4px 0 8px",
    background: "#12151C",
    borderTop: "1px solid #222634",
  },
};