import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  TableLayoutType, HeightRule, VerticalAlign,
} from "docx";

export default async function generateDOCX(data) {

  // ── Colour constants (hex without #) ─────────────────────
  const HEADER_BG = "5A5A5A";
  const BOX_BG    = "EFEFEF";
  const BLACK     = "1A1A1A";
  const DARK      = "2D2D2D";
  const LIGHT     = "777777";
  const WHITE     = "FFFFFF";
  const BORDER_C  = "888888";
  const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const ALL_NONE  = {
    top: NO_BORDER, bottom: NO_BORDER,
    left: NO_BORDER, right: NO_BORDER,
    insideH: NO_BORDER, insideV: NO_BORDER,
  };

  // ── Text run helpers ─────────────────────────────────────
  const run = (text, opts = {}) => new TextRun({
    text,
    font: "Calibri",
    size: opts.size || 18,
    bold: opts.bold || false,
    italics: opts.italic || false,
    color: opts.color || DARK,
    characterSpacing: opts.spacing || 0,
  });

  // Spaced caps for section titles e.g. "S U M M A R Y"
  const spacedRun = (text) => run(
    text.toUpperCase().split("").join(" "),
    { bold: true, size: 17, color: BLACK, spacing: 20 }
  );

  // ── Paragraph helpers ────────────────────────────────────
  const para = (children, opts = {}) => new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.before || 0,
      after: opts.after || 40,
      line: opts.line || 276,
    },
    indent: opts.indent ? { left: 180 } : undefined,
  });

  // Section heading with bottom border — full width version
  const sHead = (title) => new Paragraph({
    children: [spacedRun(title)],
    spacing: { before: 160, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_C },
    },
  });

  // Plain body paragraph
  const bodyPara = (text, opts = {}) => para(
    [run(text, {
      size: 17,
      color: opts.color || DARK,
      bold: opts.bold || false,
      italic: opts.italic || false,
    })],
    { after: opts.after ?? 40, indent: opts.indent || false, align: opts.align }
  );

  // Bullet item
  const bulletPara = (text) => new Paragraph({
    children: [run("\u2022  " + text, { size: 17, color: DARK })],
    spacing: { before: 0, after: 40, line: 276 },
    indent: { left: 100 },
  });

  // Label + value inline (for CONTACT)
  const labelVal = (label, value) => para([
    run(label + "  ", { size: 17, bold: true, color: BLACK }),
    run(value,        { size: 17, color: DARK }),
  ], { after: 50 });

  // Empty spacer
  const spacer = (pts = 80) =>
    new Paragraph({ children: [], spacing: { before: 0, after: pts } });

  // ── HEADER: gray bar with centered light box ─────────────
  const nameText  = (data.fullName || "NAME").toUpperCase();
  const desigText = data.designation
    ? data.designation.toUpperCase().split("").join("  ")
    : "";

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: ALL_NONE,
    rows: [
      new TableRow({
        height: { value: 1200, rule: HeightRule.EXACT },
        children: [
          // Left gray pad
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: HEADER_BG },
            borders: ALL_NONE,
            children: [spacer(0)],
          }),
          // Center white/light box
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: BOX_BG },
            borders: ALL_NONE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 40 },
                children: [new TextRun({
                  text: nameText,
                  font: "Calibri",
                  size: 44,
                  bold: true,
                  color: BLACK,
                })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
                children: [new TextRun({
                  text: desigText,
                  font: "Calibri",
                  size: 16,
                  color: LIGHT,
                  characterSpacing: 40,
                })],
              }),
            ],
          }),
          // Right gray pad
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: HEADER_BG },
            borders: ALL_NONE,
            children: [spacer(0)],
          }),
        ],
      }),
    ],
  });

  // ── SUMMARY — full-width section ─────────────────────────
  const summarySection = [];
  if (data.summary) {
    summarySection.push(sHead("Summary"));
    summarySection.push(
      new Paragraph({
        children: [run(data.summary, { size: 17, color: DARK })],
        alignment: AlignmentType.BOTH,          // justified like the image
        spacing: { before: 0, after: 100, line: 300 },
      })
    );
  }

  // ── LEFT COLUMN: Contact › Skills › Education ────────────
  const left = [];

  // CONTACT
  left.push(sHead("Contact"));
  if (data.phone)    left.push(labelVal("Phone:", data.phone));
  if (data.email)    left.push(labelVal("Email:", data.email));
  if (data.linkedin) left.push(labelVal("LinkedIn:", data.linkedin));
  if (data.github)   left.push(labelVal("GitHub:", data.github));
  if (data.website)  left.push(labelVal("Portfolio:", data.website));
  left.push(spacer(60));

  // SKILLS
  if (data.skills?.length) {
    left.push(sHead("Skills"));
    data.skills.forEach((skill) => left.push(bodyPara(skill, { after: 36 })));
    left.push(spacer(60));
  }

  // EDUCATION
  if (data.education?.length) {
    left.push(sHead("Education"));
    data.education.forEach((edu) => {
      left.push(bodyPara(edu.degree || "", { bold: true, after: 30 }));
      const meta = [edu.institution, edu.startDate, edu.endDate]
        .filter(Boolean).join(" | ");
      left.push(bodyPara(meta, { color: LIGHT, after: 60 }));
    });
  }

  // ── RIGHT COLUMN: Experience › Projects › Tools › Languages
  const right = [];

  // EXPERIENCE
  if (data.experience?.length) {
    right.push(sHead("Experience"));
    data.experience.forEach((exp) => {
      const role = [exp.jobTitle, exp.company ? "\u2013 " + exp.company : ""]
        .filter(Boolean).join(" ");
      right.push(bodyPara(role, { bold: true, after: 30 }));

      const period = [
        exp.company,
        [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" \u2013 "),
      ].filter(Boolean).join(" | ");
      right.push(bodyPara(period, { color: LIGHT, after: 50 }));

      if (exp.description) {
        const lines = exp.description
          .split(/[\n.]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 4);
        if (lines.length > 1) {
          lines.forEach((line) => right.push(bulletPara(line)));
        } else {
          right.push(bulletPara(exp.description));
        }
      }
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b) => right.push(bulletPara(b)));
      }
      right.push(spacer(60));
    });
  }

  // PROJECTS
  if (data.projects?.length) {
    right.push(sHead("Projects"));
    data.projects.forEach((proj) => {
      right.push(bodyPara(proj.title || "", { bold: true, after: 30 }));
      if (proj.techStack?.length) {
        right.push(bodyPara(
          "(" + proj.techStack.join(", ") + ")",
          { color: LIGHT, after: 30 }
        ));
      }
      if (proj.description) right.push(bulletPara(proj.description));
      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((b) => right.push(bulletPara(b)));
      }
      right.push(spacer(40));
    });
  }

  // TOOLS
  if (data.tools?.length) {
    right.push(sHead("Tools"));
    data.tools.forEach((tool) => right.push(bulletPara(tool)));
    right.push(spacer(60));
  }

  // LANGUAGES
  if (data.languages?.length) {
    right.push(sHead("Languages"));
    data.languages.forEach((lang) => right.push(bulletPara(lang)));
    right.push(spacer(60));
  }

  // CERTIFICATIONS (optional)
  if (data.certifications?.length) {
    right.push(sHead("Certifications"));
    data.certifications.forEach((cert) => {
      right.push(bodyPara(cert.name || "", { bold: true, after: 30 }));
      if (cert.issuer) right.push(bodyPara(cert.issuer, { color: LIGHT }));
      right.push(spacer(40));
    });
  }

  // Pad shorter column so the table row doesn't collapse
  const maxRows = Math.max(left.length, right.length);
  while (left.length  < maxRows) left.push(spacer(20));
  while (right.length < maxRows) right.push(spacer(20));

  // ── TWO-COLUMN TABLE ─────────────────────────────────────
  const bodyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: ALL_NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: ALL_NONE,
            children: left,
          }),
          // Gutter
          new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE },
            borders: ALL_NONE,
            children: [spacer(0)],
          }),
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            borders: ALL_NONE,
            children: right,
          }),
        ],
      }),
    ],
  });

  // ── FOOTER gray bar ───────────────────────────────────────
  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: ALL_NONE,
    rows: [
      new TableRow({
        height: { value: 240, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: HEADER_BG },
            borders: ALL_NONE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({
                  text: "Generated by SkillMatrix",
                  font: "Calibri",
                  size: 14,
                  color: "CCCCCC",
                })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── ASSEMBLE DOCUMENT ────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 360, bottom: 360, left: 580, right: 580 } },
      },
      children: [
        headerTable,           // dark bar + name box
        spacer(60),
        ...summarySection,     // full-width SUMMARY
        spacer(40),
        bodyTable,             // left (Contact/Skills/Education) | right (Experience/Projects/Tools/Languages)
        spacer(120),
        footerTable,           // gray footer bar
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}