"use client";

import { useState } from "react";

export default function ResumeButton({ regNo }) {
  const [open, setOpen]       = useState(false);
  const [format, setFormat]   = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState(null);

  async function fetchProfileData() {
    const res = await fetch(`/api/users/${regNo}`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    const json = await res.json();
    if (!json.success) throw new Error("Profile not found");
    return json.user;
  }

  // ── PDF: build HTML resume → open print window → user saves as PDF ──
  async function downloadPDF() {
    const user = await fetchProfileData();
    const p    = user.profile || {};
    const safe = (v) => (v ? String(v) : "—");
    const arr  = (a) => (Array.isArray(a) && a.length > 0 ? a : null);

    const skillsList = arr(p.skills)
      ? p.skills.map(s => `<span class="tag">${s}</span>`).join("")
      : "<span>—</span>";

    const interestsList = arr(p.interests)
      ? p.interests.map(s => `<span class="tag">${s}</span>`).join("")
      : "<span>—</span>";

    const educationHTML = arr(p.education)
      ? p.education.map(e => `
          <div class="entry">
            <div class="entry-title">${safe(e.degree)}</div>
            <div class="entry-sub">${safe(e.institution)}${e.year ? " · " + e.year : ""}</div>
          </div>`).join("")
      : "<p>—</p>";

    const experienceHTML = arr(p.experience)
      ? p.experience.map(e => `
          <div class="entry">
            <div class="entry-title">${safe(e.role)} — ${safe(e.company)}</div>
            <div class="entry-sub">${safe(e.duration)}</div>
            ${e.description ? `<div class="entry-desc">${safe(e.description)}</div>` : ""}
          </div>`).join("")
      : "<p>—</p>";

    const projectsHTML = arr(p.projects)
      ? p.projects.map(proj => `
          <div class="entry">
            <div class="entry-title">${safe(proj.title)}</div>
            ${proj.techStack?.length ? `<div class="entry-sub">${proj.techStack.join(", ")}</div>` : ""}
            ${proj.description ? `<div class="entry-desc">${safe(proj.description)}</div>` : ""}
          </div>`).join("")
      : "<p>—</p>";

    const contactRows = [
      user.email    && `<tr><td class="label">Email</td><td>${user.email}</td></tr>`,
      user.phone    && `<tr><td class="label">Phone</td><td>${user.phone}</td></tr>`,
      p.linkedin    && `<tr><td class="label">LinkedIn</td><td>${p.linkedin}</td></tr>`,
      p.github      && `<tr><td class="label">GitHub</td><td>${p.github}</td></tr>`,
      p.portfolio   && `<tr><td class="label">Portfolio</td><td>${p.portfolio}</td></tr>`,
    ].filter(Boolean).join("") || "<tr><td>—</td></tr>";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Resume – ${user.name || regNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 11px;
      color: #222;
      background: #fff;
    }

    /* ── TOP BAR ── */
    .header {
      background: #595959;
      padding: 0;
      margin-bottom: 0;
    }
    .name-box {
      background: #fff;
      margin: 0 80px;
      padding: 12px 20px;
      border: 1px solid #bbb;
      text-align: center;
      position: relative;
      top: -30px;
      margin-bottom: -18px;
    }
    .header-spacer { height: 50px; }
    .name-box h1  { font-size: 22px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .name-box h2  { font-size: 11px; color: #777; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }

    /* ── LAYOUT ── */
    .body { padding: 10px 30px 30px; }

    .section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 14px 0 3px;
      padding-bottom: 2px;
      border-bottom: 0.5px solid #999;
    }

    .two-col { display: flex; gap: 24px; margin-top: 10px; }
    .col-left  { flex: 0 0 44%; }
    .col-right { flex: 1; }

    .summary { font-size: 10px; line-height: 1.6; color: #444; text-align: justify; margin-bottom: 4px; }

    /* contact table */
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 4px; font-size: 10px; vertical-align: top; }
    td.label { font-weight: 700; white-space: nowrap; width: 70px; color: #444; }

    /* skills/interests tags */
    .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .tag  { background: #f0f0f0; padding: 2px 7px; border-radius: 3px; font-size: 9px; }

    /* entries */
    .entry        { margin-bottom: 8px; }
    .entry-title  { font-weight: 700; font-size: 10px; }
    .entry-sub    { color: #777; font-size: 9px; margin-top: 1px; }
    .entry-desc   { font-size: 9px; color: #444; margin-top: 2px; line-height: 1.4; }

    /* ── PRINT RULES ── */
    @media print {
      @page { size: A4; margin: 0; }
      body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    /* ── PRINT BUTTON (hidden when printing) ── */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1d4ed8;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      z-index: 999;
    }
    .print-bar button {
      background: #fff;
      color: #1d4ed8;
      border: none;
      padding: 6px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    body { padding-top: 48px; }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <span>📄 Your resume is ready — click <strong>Save as PDF</strong> to download</span>
    <button onclick="window.print()">🖨️ Save as PDF</button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-spacer"></div>
  </div>
  <div class="name-box">
    <h1>${user.name || "YOUR NAME"}</h1>
    <h2>${p.designation || "YOUR ROLE"}</h2>
  </div>

  <div class="body">

    <!-- Summary -->
    <div class="section-title">Summary</div>
    <p class="summary">${safe(p.summary || p.bio)}</p>

    <div class="two-col">

      <!-- LEFT -->
      <div class="col-left">

        <div class="section-title">Contact</div>
        <table>${contactRows}</table>

        <div class="section-title">Skills</div>
        <div class="tags">${skillsList}</div>

        <div class="section-title">Education</div>
        ${educationHTML}

        <div class="section-title">Interests</div>
        <div class="tags">${interestsList}</div>

      </div>

      <!-- RIGHT -->
      <div class="col-right">

        <div class="section-title">Experience</div>
        ${experienceHTML}

        <div class="section-title">Projects</div>
        ${projectsHTML}

      </div>
    </div>

  </div>
</body>
</html>`;

    // Open in a new window — browser handles print → Save as PDF
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) throw new Error("Popup blocked — please allow popups for this site");
    win.document.write(html);
    win.document.close();
    // Auto-trigger print after page renders
    win.onload = () => win.print();
  }

  // ── DOCX: API route — unchanged, works perfectly ───────────────────
  async function downloadDOCX() {
    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regNo, format: "docx" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "DOCX generation failed");
    }
    return await res.blob();
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
        const blob = await downloadDOCX();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `resume_${regNo}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus({ type: "success", msg: "Resume downloaded!" });
      }
    } catch (err) {
      console.error("Resume error:", err);
      setStatus({ type: "error", msg: err.message || "Generation failed" });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setStatus(null);
    setLoading(false);
  }

  const formatOptions = [
    { id: "pdf",  icon: "📕", label: "PDF",          hint: "Best for sharing" },
    { id: "docx", icon: "📘", label: "Word (.docx)", hint: "Best for editing" },
  ];

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
    </>
  );
}

const styles = {
  triggerBtn:          { display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  overlay:             { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal:               { background: "#fff", borderRadius: 14, padding: 32, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" },
  header:              { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title:               { margin: 0, fontSize: 20, fontWeight: 700, color: "#111" },
  closeBtn:            { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888", padding: "4px 8px", borderRadius: 6 },
  subtitle:            { color: "#6b7280", fontSize: 14, margin: "0 0 20px" },
  formatRow:           { display: "flex", gap: 12, marginBottom: 20 },
  formatCard:          { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderWidth: 2, borderStyle: "solid", borderColor: "#e5e7eb", borderRadius: 10, padding: "14px 8px", cursor: "pointer", textAlign: "center", userSelect: "none" },
  formatCardActive:    { borderColor: "#2563eb", background: "#eff6ff" },
  formatLabel:         { fontWeight: 700, fontSize: 14, color: "#111", marginTop: 6 },
  formatHint:          { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  status:              { padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  statusSuccess:       { background: "#dcfce7", color: "#166534" },
  statusError:         { background: "#fee2e2", color: "#991b1b" },
  actions:             { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn:           { padding: "9px 18px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, cursor: "pointer" },
  generateBtn:         { padding: "9px 20px", borderRadius: 7, background: "#2563eb", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  generateBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
};