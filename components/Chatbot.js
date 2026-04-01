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

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...styles.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
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
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your assistant. Ask me anything about interviews, resumes, or campus recruitment!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          userContext: userContext || null,
        }),
      });

      const data = await res.json();
      const botMsg = { role: "assistant", content: data.reply || "Sorry, I couldn't process that." };
      setMessages((prev) => [...prev, botMsg]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please try again." },
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

  return (
    <>
      <style>{keyframes}</style>
      <style>{`
        @media (max-width: 600px) {
          .chatbot-window {
            bottom: 80px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            max-width: none !important;
          }
          .chatbot-fab {
            bottom: 20px !important;
            right: 20px !important;
          }
        }
      `}</style>

      {/* Floating Trigger Button */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen((v) => !v)}
        style={styles.fab}
        aria-label="Open chatbot"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span style={styles.badge}>{unread}</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window" style={styles.window}>
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
            <button onClick={clearChat} style={styles.clearBtn} title="Clear chat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div style={styles.quickPrompts}>
              {["Resume tips", "Mock interview prep", "Top companies hiring", "Aptitude resources"].map((q) => (
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
              placeholder="Ask about placements, resumes, interviews…"
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

const keyframes = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
@keyframes blink {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1;   }
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,92,255,0.5); }
  50%       { box-shadow: 0 0 0 10px rgba(124,92,255,0); }
}
`;

const styles = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#7C5CFF",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 25px rgba(124,92,255,0.45)",
    zIndex: 9999,
    animation: "pulse 2.5s infinite",
    transition: "transform 0.2s",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "#EF4444",
    color: "white",
    borderRadius: "50%",
    width: 18,
    height: 18,
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  window: {
    position: "fixed",
    bottom: 96,
    right: 28,
    width: 370,
    maxWidth: "calc(100% - 32px)",
    maxHeight: 560,
    borderRadius: 20,
    background: "#12151C",
    boxShadow: "0 0 0 2px rgba(124,92,255,0.2), 0 24px 60px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9998,
    animation: "fadeSlideUp 0.25s ease",
    border: "1px solid #222634",
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
    background: "rgba(124,92,255,0.2)",
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
    background: "rgba(124,92,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    padding: "10px 13px",
    borderRadius: 16,
    fontSize: 13.5,
    lineHeight: 1.55,
    wordBreak: "break-word",
  },
  userBubble: {
    background: "#7C5CFF",
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
  },
  typingBubble: {
    background: "#171B24",
    padding: "12px 16px",
    borderRadius: 16,
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
    background: "#7C5CFF",
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