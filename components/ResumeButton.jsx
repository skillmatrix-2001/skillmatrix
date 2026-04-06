"use client";

import { useState } from "react";
import { asBlob } from "html-docx-js/dist/html-docx";

export default function ResumeButton({ regNo }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  async function fetchFullData() {
    const userRes = await fetch(`/api/users/${regNo}`);
    if (!userRes.ok) throw new Error("Failed to fetch profile");
    const userJson = await userRes.json();
    if (!userJson.success) throw new Error("Profile not found");
    const user = userJson.user;

    const postsRes = await fetch(`/api/posts?userId=${user._id}`);
    if (!postsRes.ok) throw new Error("Failed to fetch posts");
    const postsJson = await postsRes.json();
    const posts = postsJson.success ? postsJson.posts : [];

    const certificates = posts.filter(p => p.type === "certificate");
    const projects = posts.filter(p => p.type === "project");

    return { user, certificates, projects };
  }

  const escapeHtml = (str) => {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
      return c;
    });
  };

  async function generateResumeHTML() {
    const { user, certificates, projects } = await fetchFullData();
    const p = user.profile || {};

    const formatArray = (arr) => arr && arr.length ? arr.join(", ") : "—";

    const summaryText = p.summary || p.bio || "—";

    // Contact: email and phone as plain text, links as clickable <a>
    let contactItems = [];
    if (user.email) contactItems.push(`Email: ${escapeHtml(user.email)}`);
    if (user.phone) contactItems.push(`Phone: ${escapeHtml(user.phone)}`);
    if (p.linkedin) contactItems.push(`LinkedIn: <a href="${escapeHtml(p.linkedin)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.linkedin)}</a>`);
    if (p.github) contactItems.push(`GitHub: <a href="${escapeHtml(p.github)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.github)}</a>`);
    if (p.portfolio) contactItems.push(`Portfolio: <a href="${escapeHtml(p.portfolio)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.portfolio)}</a>`);
    const contactText = contactItems.length ? contactItems.join("  |  ") : "—";

    const skillsText = formatArray(p.skills);

    const educationItems = p.education && p.education.length
      ? p.education.map(e => `${escapeHtml(e.degree)} – ${escapeHtml(e.institution)}${e.year ? " (" + e.year + ")" : ""}`).join("\n")
      : "—";

    const experienceItems = p.experience && p.experience.length
      ? p.experience.map(e => {
          let line = `${escapeHtml(e.role)} at ${escapeHtml(e.company)}`;
          if (e.duration) line += ` (${escapeHtml(e.duration)})`;
          if (e.description) line += `\n   ${escapeHtml(e.description)}`;
          return line;
        }).join("\n\n")
      : "—";

    const certItems = certificates.length
      ? certificates.map(cert => {
          let line = `• ${escapeHtml(cert.title)}`;
          if (cert.description) line += `\n  ${escapeHtml(cert.description)}`;
          return line;
        }).join("\n\n")
      : "—";

    const projectItems = projects.length
      ? projects.map(proj => {
          let line = `• ${escapeHtml(proj.title)}`;
          if (proj.techStack && proj.techStack.length)
            line += `\n  Technologies: ${proj.techStack.map(t => escapeHtml(t)).join(", ")}`;
          if (proj.description) line += `\n  ${escapeHtml(proj.description)}`;
          return line;
        }).join("\n\n")
      : "—";

    const interestsText = formatArray(p.interests);

    // Footer with current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const footerText = `Generated with SkillMatrix on ${formattedDate}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Resume – ${escapeHtml(user.name) || regNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 0.75in;
      position: relative;
      min-height: 100%;
    }

    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 12pt;
      letter-spacing: 1px;
    }

    .section {
      margin-top: 16pt;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 8pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 2pt;
    }

    .contact-line {
      font-size: 10pt;
      margin-bottom: 12pt;
      color: #000;
    }

    .contact-line a {
      color: #000;
      text-decoration: underline;
    }

    .entry {
      margin-bottom: 12pt;
    }

    .entry-title {
      font-weight: bold;
      font-size: 12pt;
    }

    .entry-sub {
      font-style: italic;
      font-size: 11pt;
      margin-bottom: 2pt;
    }

    .entry-desc {
      font-size: 11pt;
      margin-left: 12pt;
      white-space: pre-line;
    }

    .footer {
      margin-top: 30pt;
      text-align: center;
      font-size: 9pt;
      color: #555;
      border-top: 0.5px solid #ccc;
      padding-top: 8pt;
    }

    @media print {
      body { padding: 0.5in; }
      .contact-line a { text-decoration: underline; }
      .footer { position: fixed; bottom: 0; left: 0; right: 0; }
    }
  </style>
</head>
<body>

  <h1>${escapeHtml(user.name) || "YOUR NAME"}</h1>

  <div class="contact-line">${contactText}</div>

  <div class="section">
    <div class="section-title">SUMMARY</div>
    <p>${escapeHtml(summaryText)}</p>
  </div>

  <div class="section">
    <div class="section-title">SKILLS</div>
    <p>${escapeHtml(skillsText)}</p>
  </div>

  <div class="section">
    <div class="section-title">EDUCATION</div>
    <div style="white-space: pre-line;">${educationItems}</div>
  </div>

  <div class="section">
    <div class="section-title">EXPERIENCE</div>
    <div style="white-space: pre-line;">${experienceItems}</div>
  </div>

  <div class="section">
    <div class="section-title">CERTIFICATIONS</div>
    <div style="white-space: pre-line;">${certItems}</div>
  </div>

  <div class="section">
    <div class="section-title">PROJECTS</div>
    <div style="white-space: pre-line;">${projectItems}</div>
  </div>

  <div class="section">
    <div class="section-title">INTERESTS</div>
    <p>${escapeHtml(interestsText)}</p>
  </div>

  <div class="footer">${footerText}</div>

</body>
</html>`;
  }

  async function downloadPDF() {
    const html = await generateResumeHTML();
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) throw new Error("Popup blocked — please allow popups for this site");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  async function downloadDOCX() {
    const html = await generateResumeHTML();
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const fullHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 0.75in; line-height: 1.4; }
        .section-title { font-size: 14pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; border-bottom: 1px solid #ccc; }
        .contact-line { margin-bottom: 12pt; }
        .contact-line a { color: #000; text-decoration: underline; }
        .entry { margin-bottom: 12pt; }
        .entry-title { font-weight: bold; }
        .entry-sub { font-style: italic; margin-bottom: 2pt; }
        .entry-desc { margin-left: 12pt; white-space: pre-line; }
        .footer { margin-top: 30pt; text-align: center; font-size: 9pt; color: #555; border-top: 0.5px solid #ccc; padding-top: 8pt; }
      </style>
    </head>
    <body>${bodyContent}</body>
    </html>`;
    const blob = asBlob(fullHtml);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume_${regNo}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (!regNo) { setStatus({ type: "error", msg: "Registration number not found." }); return; }
    setLoading(true);
    setStatus(null);

    try {
      if (format === "pdf") {
        await downloadPDF();
        setStatus({ type: "success", msg: "Resume opened! Click 'Save as PDF' in the new tab." });
      } else {
        await downloadDOCX();
        setStatus({ type: "success", msg: "Resume downloaded!" });
      }
    } catch (err) {
      console.error("Resume error:", err);
      setStatus({ type: "error", msg: err.message || "Generation failed" });
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setStatus(null);
      setLoading(false);
      setIsClosing(false);
    }, 200);
  };

  const formatOptions = [
    { id: "pdf",  icon: "📕", label: "PDF",          hint: "Best for sharing" },
    { id: "docx", icon: "📘", label: "Word (.docx)", hint: "Best for editing" },
  ];

  const theme = {
    bg: "#0B0D12",
    cardBg: "#12151C",
    border: "#222634",
    text: "#E5E7EB",
    textMuted: "#6B7280",
    accent: "#7C5CFF",
    accentHover: "#6d4fe0",
    errorBg: "rgba(239,68,68,0.1)",
    errorBorder: "rgba(239,68,68,0.3)",
    errorText: "#F87171",
    successBg: "rgba(16,185,129,0.1)",
    successBorder: "rgba(16,185,129,0.3)",
    successText: "#10B981",
  };

  const styles = {
    triggerBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: theme.accent,
      color: "#fff",
      border: "none",
      padding: "9px 18px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "background 0.2s",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: isClosing ? "fadeOut 0.2s ease-out forwards" : "fadeIn 0.2s ease-out",
    },
    modal: {
      background: theme.cardBg,
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      padding: "1.75rem",
      width: 420,
      maxWidth: "90vw",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      animation: isClosing ? "slideOut 0.2s ease-out forwards" : "slideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    title: {
      margin: 0,
      fontSize: 20,
      fontWeight: 700,
      color: theme.text,
    },
    closeBtn: {
      background: "none",
      border: "none",
      fontSize: 20,
      cursor: "pointer",
      color: theme.textMuted,
      padding: "4px 8px",
      borderRadius: 6,
      transition: "color 0.2s",
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 13,
      margin: "0 0 24px",
    },
    formatRow: {
      display: "flex",
      gap: 12,
      marginBottom: 20,
    },
    formatCard: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: theme.border,
      borderRadius: 12,
      padding: "14px 8px",
      cursor: "pointer",
      textAlign: "center",
      userSelect: "none",
      background: "transparent",
      transition: "all 0.2s",
    },
    formatCardActive: {
      borderColor: theme.accent,
      background: "rgba(124,92,255,0.1)",
    },
    formatLabel: {
      fontWeight: 600,
      fontSize: 14,
      color: theme.text,
      marginTop: 8,
    },
    formatHint: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    status: {
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 20,
    },
    statusSuccess: {
      background: theme.successBg,
      border: `1px solid ${theme.successBorder}`,
      color: theme.successText,
    },
    statusError: {
      background: theme.errorBg,
      border: `1px solid ${theme.errorBorder}`,
      color: theme.errorText,
    },
    actions: {
      display: "flex",
      gap: 12,
      justifyContent: "flex-end",
    },
    cancelBtn: {
      background: "transparent",
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      padding: "9px 18px",
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    generateBtn: {
      background: theme.accent,
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px 20px",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "background 0.2s",
    },
    generateBtnDisabled: {
      background: "rgba(124,92,255,0.5)",
      cursor: "not-allowed",
    },
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={styles.triggerBtn}>
        <span style={{ fontSize: 16 }}>📄</span> Generate Resume
      </button>

      {open && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div style={styles.modal}>
            <div style={styles.header}>
              <h2 style={styles.title}>Generate Resume</h2>
              <button style={styles.closeBtn} onClick={handleClose}>✕</button>
            </div>
            <p style={styles.subtitle}>Your profile data will be used to build a professional resume.</p>
            <div style={styles.formatRow}>
              {formatOptions.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  style={format === f.id ? { ...styles.formatCard, ...styles.formatCardActive } : styles.formatCard}
                >
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <span style={styles.formatLabel}>{f.label}</span>
                  <span style={styles.formatHint}>{f.hint}</span>
                </div>
              ))}
            </div>
            {status && (
              <div style={{ ...styles.status, ...(status.type === "success" ? styles.statusSuccess : styles.statusError) }}>
                {status.type === "success" ? "✅ " : "❌ "}{status.msg}
              </div>
            )}
            <div style={styles.actions}>
              <button style={styles.cancelBtn} onClick={handleClose}>Cancel</button>
              <button
                style={{ ...styles.generateBtn, ...(loading ? styles.generateBtnDisabled : {}) }}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "⏳ Generating..." : "Generate & Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
      `}</style>
    </>
  );
}