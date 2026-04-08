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
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // PDF-optimized HTML (flexbox, clean)
  async function generateResumeHTML() {
    const { user, certificates, projects } = await fetchFullData();
    const p = user.profile || {};

    const summaryText = p.summary || p.bio || "—";

    let leftContact = [];
    let rightContact = [];
    if (user.email) leftContact.push(`<span class="contact-label">Email:</span><span class="contact-value">${escapeHtml(user.email)}</span>`);
    if (p.github) leftContact.push(`<span class="contact-label">GitHub:</span><span class="contact-value"><a href="${escapeHtml(p.github)}">${escapeHtml(p.github)}</a></span>`);
    if (user.phone) rightContact.push(`<span class="contact-label">Phone:</span><span class="contact-value">${escapeHtml(user.phone)}</span>`);
    if (p.linkedin) rightContact.push(`<span class="contact-label">LinkedIn:</span><span class="contact-value"><a href="${escapeHtml(p.linkedin)}">${escapeHtml(p.linkedin)}</a></span>`);
    if (p.portfolio) {
      rightContact.push(`<span class="contact-label">Portfolio:</span><span class="contact-value"><a href="${escapeHtml(p.portfolio)}">${escapeHtml(p.portfolio)}</a></span>`);
    }

    const contactGrid = `
      <div class="contact-grid">
        <div class="contact-left">${leftContact.join("")}</div>
        <div class="contact-right">${rightContact.join("")}</div>
      </div>
    `;

    const skillsText = (p.skills && p.skills.length) ? escapeHtml(p.skills.join(", ")) : "—";

    let educationHtml = "—";
    if (p.education && p.education.length) {
      educationHtml = p.education.map(e => `
        <div class="edu-entry">
          <div class="edu-header">
            <span class="edu-degree">${escapeHtml(e.degree)}</span>
            <span class="edu-year">${e.year ? escapeHtml(e.year) : ""}</span>
          </div>
          <div class="edu-institution">${escapeHtml(e.institution)}</div>
        </div>
      `).join("");
    }

    let experienceHtml = "—";
    if (p.experience && p.experience.length) {
      experienceHtml = p.experience.map(exp => `
        <div class="exp-entry">
          <div class="exp-header">
            <span class="exp-role">${escapeHtml(exp.role)}</span>
            <span class="exp-duration">${exp.duration ? escapeHtml(exp.duration) : ""}</span>
          </div>
          <div class="exp-company">${escapeHtml(exp.company)}</div>
          ${exp.description ? `<div class="exp-desc">• ${escapeHtml(exp.description)}</div>` : ""}
        </div>
      `).join("");
    }

    let certsHtml = "—";
    if (certificates.length) {
      certsHtml = certificates.map(cert => {
        const dateStr = formatDate(cert.date || cert.createdAt);
        return `
          <div class="cert-entry">
            <div class="cert-header">
              <span class="cert-title">${escapeHtml(cert.title)}</span>
              <span class="cert-date">${dateStr}</span>
            </div>
            ${cert.issuedBy ? `<div class="cert-issued">Issued by: ${escapeHtml(cert.issuedBy)}</div>` : ""}
            ${cert.description ? `<div class="cert-desc">• ${escapeHtml(cert.description)}</div>` : ""}
          </div>
        `;
      }).join("");
    }

    let projectsHtml = "—";
    if (projects.length) {
      projectsHtml = projects.map(proj => {
        const dateStr = formatDate(proj.date || proj.createdAt);
        return `
          <div class="proj-entry">
            <div class="proj-header">
              <span class="proj-title">${escapeHtml(proj.title)}</span>
              <span class="proj-date">${dateStr}</span>
            </div>
            ${proj.description ? `<div class="proj-desc">• ${escapeHtml(proj.description)}</div>` : ""}
            ${proj.techStack && proj.techStack.length ? `<div class="proj-tech"><span class="tech-label">Technologies used:</span> ${proj.techStack.map(t => escapeHtml(t)).join(", ")}</div>` : ""}
          </div>
        `;
      }).join("");
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 0.7in;
    }
    h1 { font-size: 20pt; font-weight: bold; margin-bottom: 10pt; border-bottom: 1.5px solid #aaa; padding-bottom: 8pt; }
    .section { margin-top: 18pt; }
    .section-title { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; border-bottom: 0.75px solid #ccc; padding-bottom: 3pt; text-transform: uppercase; }
    .contact-grid { display: flex; gap: 20px; margin-bottom: 6pt; font-size: 10.5pt; }
    .contact-left, .contact-right { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .contact-label { font-weight: 600; display: inline-block; width: 70px; color: #333; }
    .contact-value a { color: #000; text-decoration: underline; }
    .edu-entry { margin-bottom: 10pt; }
    .edu-header { display: flex; justify-content: space-between; font-weight: bold; }
    .edu-year { font-style: italic; font-weight: normal; color: #444; }
    .edu-institution { font-style: italic; color: #333; }
    .exp-entry { margin-bottom: 12pt; }
    .exp-header { display: flex; justify-content: space-between; font-weight: bold; }
    .exp-duration { font-style: italic; font-weight: normal; color: #444; }
    .exp-company { font-style: italic; color: #333; margin-bottom: 4pt; }
    .exp-desc { margin-left: 10pt; font-size: 10.5pt; white-space: pre-line; }
    .cert-entry { margin-bottom: 12pt; }
    .cert-header { display: flex; justify-content: space-between; font-weight: bold; }
    .cert-date { font-style: italic; font-weight: normal; color: #444; }
    .cert-issued { font-style: italic; color: #333; margin-bottom: 2pt; }
    .cert-desc { margin-left: 10pt; font-size: 10.5pt; white-space: pre-line; }
    .proj-entry { margin-bottom: 12pt; }
    .proj-header { display: flex; justify-content: space-between; font-weight: bold; }
    .proj-date { font-style: italic; font-weight: normal; color: #444; }
    .proj-desc { margin-left: 10pt; font-size: 10.5pt; white-space: pre-line; }
    .proj-tech { margin-top: 4pt; margin-left: 10pt; font-size: 10.5pt; }
    .tech-label { font-weight: bold; }
    @page { margin: 0.5in; size: letter; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(user.name) || "YOUR NAME"}</h1>
  ${contactGrid}
  <div class="section"><div class="section-title">Summary</div><p>${escapeHtml(summaryText)}</p></div>
  <div class="section"><div class="section-title">Skills</div><p>${skillsText}</p></div>
  <div class="section"><div class="section-title">Education</div>${educationHtml}</div>
  <div class="section"><div class="section-title">Experience</div>${experienceHtml}</div>
  <div class="section"><div class="section-title">Certifications</div>${certsHtml}</div>
  <div class="section"><div class="section-title">Projects</div>${projectsHtml}</div>
</body>
</html>`;
  }

  // Word‑friendly HTML using tables (no flexbox)
  async function generateDocxHTML() {
    const { user, certificates, projects } = await fetchFullData();
    const p = user.profile || {};

    const summaryText = p.summary || p.bio || "—";

    let leftCells = [];
    let rightCells = [];
    if (user.email) leftCells.push(`<span style="font-weight:600; display:inline-block; width:70px;">Email:</span><span>${escapeHtml(user.email)}</span>`);
    if (p.github) leftCells.push(`<span style="font-weight:600; display:inline-block; width:70px;">GitHub:</span><span><a href="${escapeHtml(p.github)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.github)}</a></span>`);
    if (user.phone) rightCells.push(`<span style="font-weight:600; display:inline-block; width:70px;">Phone:</span><span>${escapeHtml(user.phone)}</span>`);
    if (p.linkedin) rightCells.push(`<span style="font-weight:600; display:inline-block; width:70px;">LinkedIn:</span><span><a href="${escapeHtml(p.linkedin)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.linkedin)}</a></span>`);
    if (p.portfolio) {
      rightCells.push(`<span style="font-weight:600; display:inline-block; width:70px;">Portfolio:</span><span><a href="${escapeHtml(p.portfolio)}" style="color:#000; text-decoration:underline;">${escapeHtml(p.portfolio)}</a></span>`);
    }

    const contactTable = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:6pt; font-size:10.5pt;">
        <tr>
          <td style="width:50%; vertical-align:top; padding-right:20px;">${leftCells.map(c => `<div style="margin-bottom:4px;">${c}</div>`).join("")}</td>
          <td style="width:50%; vertical-align:top;">${rightCells.map(c => `<div style="margin-bottom:4px;">${c}</div>`).join("")}</td>
        </tr>
      </table>
    `;

    const skillsText = (p.skills && p.skills.length) ? escapeHtml(p.skills.join(", ")) : "—";

    let educationHtml = "—";
    if (p.education && p.education.length) {
      educationHtml = p.education.map(e => `
        <div style="margin-bottom:10pt;">
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>${escapeHtml(e.degree)}</span>
            <span style="font-style:italic; font-weight:normal; color:#444;">${e.year ? escapeHtml(e.year) : ""}</span>
          </div>
          <div style="font-style:italic; color:#333;">${escapeHtml(e.institution)}</div>
        </div>
      `).join("");
    }

    let experienceHtml = "—";
    if (p.experience && p.experience.length) {
      experienceHtml = p.experience.map(exp => `
        <div style="margin-bottom:12pt;">
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>${escapeHtml(exp.role)}</span>
            <span style="font-style:italic; font-weight:normal; color:#444;">${exp.duration ? escapeHtml(exp.duration) : ""}</span>
          </div>
          <div style="font-style:italic; color:#333; margin-bottom:4pt;">${escapeHtml(exp.company)}</div>
          ${exp.description ? `<div style="margin-left:10pt; font-size:10.5pt; white-space:pre-line;">• ${escapeHtml(exp.description)}</div>` : ""}
        </div>
      `).join("");
    }

    let certsHtml = "—";
    if (certificates.length) {
      certsHtml = certificates.map(cert => {
        const dateStr = formatDate(cert.date || cert.createdAt);
        return `
          <div style="margin-bottom:12pt;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
              <span>${escapeHtml(cert.title)}</span>
              <span style="font-style:italic; font-weight:normal; color:#444;">${dateStr}</span>
            </div>
            ${cert.issuedBy ? `<div style="font-style:italic; color:#333; margin-bottom:2pt;">Issued by: ${escapeHtml(cert.issuedBy)}</div>` : ""}
            ${cert.description ? `<div style="margin-left:10pt; font-size:10.5pt; white-space:pre-line;">• ${escapeHtml(cert.description)}</div>` : ""}
          </div>
        `;
      }).join("");
    }

    let projectsHtml = "—";
    if (projects.length) {
      projectsHtml = projects.map(proj => {
        const dateStr = formatDate(proj.date || proj.createdAt);
        return `
          <div style="margin-bottom:12pt;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
              <span>${escapeHtml(proj.title)}</span>
              <span style="font-style:italic; font-weight:normal; color:#444;">${dateStr}</span>
            </div>
            ${proj.description ? `<div style="margin-left:10pt; font-size:10.5pt; white-space:pre-line;">• ${escapeHtml(proj.description)}</div>` : ""}
            ${proj.techStack && proj.techStack.length ? `<div style="margin-top:4pt; margin-left:10pt; font-size:10.5pt;"><span style="font-weight:bold;">Technologies used:</span> ${proj.techStack.map(t => escapeHtml(t)).join(", ")}</div>` : ""}
          </div>
        `;
      }).join("");
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
</head>
<body style="font-family:'Times New Roman', Times, serif; font-size:11pt; line-height:1.5; color:#000; background:#fff; padding:0.7in; margin:0;">

  <h1 style="font-size:20pt; font-weight:bold; margin:0 0 10pt; border-bottom:1.5px solid #aaa; padding-bottom:8pt;">${escapeHtml(user.name) || "YOUR NAME"}</h1>

  ${contactTable}

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Summary</div>
    <p style="margin:0 0 12pt;">${escapeHtml(summaryText)}</p>
  </div>

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Skills</div>
    <p style="margin:0 0 12pt;">${skillsText}</p>
  </div>

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Education</div>
    ${educationHtml}
  </div>

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Experience</div>
    ${experienceHtml}
  </div>

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Certifications</div>
    ${certsHtml}
  </div>

  <div style="margin-top:18pt;">
    <div style="font-size:13pt; font-weight:bold; margin-bottom:8pt; border-bottom:0.75px solid #ccc; padding-bottom:3pt; text-transform:uppercase;">Projects</div>
    ${projectsHtml}
  </div>

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
    const docxHtml = await generateDocxHTML();
    const blob = asBlob(docxHtml);
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