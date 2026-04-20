// /lib/resumePdfGenerator.js

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

if (!pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
}

pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

export default function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const safe = (v) => (v ? String(v) : "");
      const arr = (a) => (Array.isArray(a) ? a : []);

      // Spaced letters for section titles and designation
      const spaced = (txt) => txt.split("").join(" ");

      // Full-width section header (515 = A4 width minus margins)
      const section = (title) => ({
        stack: [
          { text: spaced(title), fontSize: 10, bold: true, margin: [0, 10, 0, 2] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#999" }], margin: [0, 0, 0, 8] },
        ],
      });

      // Half-width section header for inside columns (~240px)
      const sectionHalf = (title) => ({
        stack: [
          { text: spaced(title), fontSize: 10, bold: true, margin: [0, 10, 0, 2] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 0.5, lineColor: "#999" }], margin: [0, 0, 0, 8] },
        ],
      });

      // Helper to build academic text
      const academicLines = [];
      if (data.tenthPercentage) academicLines.push(`10th: ${data.tenthPercentage}%`);
      if (data.twelfthPercentage) academicLines.push(`12th: ${data.twelfthPercentage}%`);
      if (data.cgpa) {
        let cgpaStr = `CGPA: ${data.cgpa}`;
        if (data.cgpaSemester && data.cgpaSemester < 8) {
          const ord = data.cgpaSemester === 1 ? 'st' : data.cgpaSemester === 2 ? 'nd' : data.cgpaSemester === 3 ? 'rd' : 'th';
          cgpaStr += ` (upto ${data.cgpaSemester}${ord} semester)`;
        }
        academicLines.push(cgpaStr);
      }

      const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],

        content: [
          // Dark top bar
          { canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 110, color: "#595959" }], margin: [-40, -40, -40, 0] },

          // White name box
          {
            margin: [60, -75, 60, 20],
            table: {
              widths: ["*"],
              body: [[{ stack: [
                { text: safe(data.fullName).toUpperCase() || "YOUR NAME", alignment: "center", fontSize: 22, bold: true, margin: [0, 8, 0, 4] },
                { text: spaced((safe(data.designation) || "YOUR ROLE").toUpperCase()), alignment: "center", fontSize: 10, color: "#777", margin: [0, 0, 0, 8] },
              ]}]],
            },
            layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => "#999", vLineColor: () => "#999" },
          },

          // SUMMARY
          section("SUMMARY"),
          { text: safe(data.summary) || "—", fontSize: 9, lineHeight: 1.5, margin: [0, 0, 0, 10], alignment: "justify" },

          // TWO-COLUMN BODY
          {
            columns: [
              // LEFT COLUMN
              {
                width: "48%",
                stack: [
                  // CONTACT
                  sectionHalf("CONTACT"),
                  {
                    stack: [
                      { columns: [{ text: "Phone:", bold: true, width: "auto", fontSize: 9 }, { text: "  " + (safe(data.phone) || "-"), fontSize: 9 }], margin: [0, 0, 0, 4] },
                      { columns: [{ text: "Email:", bold: true, width: "auto", fontSize: 9 }, { text: "  " + (safe(data.email) || "-"), fontSize: 9 }], margin: [0, 0, 0, 4] },
                      { columns: [{ text: "LinkedIn:", bold: true, width: "auto", fontSize: 9 }, { text: "  " + (safe(data.linkedin) || "-"), fontSize: 9 }], margin: [0, 0, 0, 4] },
                    ],
                  },

                  // SKILLS
                  sectionHalf("SKILLS"),
                  { text: arr(data.skills).length ? arr(data.skills).join("\n") : "—", fontSize: 9, lineHeight: 1.4, margin: [0, 0, 0, 4] },

                  // EDUCATION
                  sectionHalf("EDUCATION"),
                  ...(arr(data.education).length
                    ? arr(data.education).map((edu) => ({
                        stack: [
                          { text: safe(edu.degree) || "-", bold: true, fontSize: 9 },
                          { text: `${safe(edu.institution) || "-"} | ${safe(edu.startDate) || "-"}${edu.endDate ? " – " + safe(edu.endDate) : ""}`, fontSize: 8, color: "#777" },
                        ],
                        margin: [0, 4, 0, 0],
                      }))
                    : [{ text: "—", fontSize: 9 }]),

                  // ─── NEW: ACADEMIC PERFORMANCE ─────────────────────
                  ...(academicLines.length > 0 ? [
                    sectionHalf("ACADEMIC"),
                    { text: academicLines.join("\n"), fontSize: 9, lineHeight: 1.4, margin: [0, 0, 0, 4] }
                  ] : []),
                ],
              },

              // RIGHT COLUMN
              {
                width: "48%",
                stack: [
                  // EXPERIENCE
                  sectionHalf("EXPERIENCE"),
                  ...(arr(data.experience).length
                    ? arr(data.experience).map((exp) => ({
                        stack: [
                          { text: `${safe(exp.jobTitle) || "-"} – ${safe(exp.company) || "-"}`, bold: true, fontSize: 9 },
                          { text: `${safe(exp.startDate) || "-"}${exp.endDate ? " – " + safe(exp.endDate) : " – Present"}`, fontSize: 8, color: "#777", margin: [0, 1, 0, 2] },
                          ...(Array.isArray(exp.bullets) && exp.bullets.length
                            ? [{ ul: exp.bullets.map(safe), fontSize: 9 }]
                            : exp.description ? [{ ul: [safe(exp.description)], fontSize: 9 }] : []),
                        ],
                        margin: [0, 4, 0, 0],
                      }))
                    : [{ text: "—", fontSize: 9 }]),

                  // PROJECTS
                  sectionHalf("PROJECTS"),
                  ...(arr(data.projects).length
                    ? arr(data.projects).map((proj) => ({
                        stack: [
                          { text: safe(proj.title) || "-", bold: true, fontSize: 9 },
                          ...(proj.techStack?.length ? [{ text: proj.techStack.join(", "), fontSize: 8, color: "#777", margin: [0, 1, 0, 2] }] : []),
                          ...(Array.isArray(proj.bullets) && proj.bullets.length
                            ? [{ ul: proj.bullets.map(safe), fontSize: 9 }]
                            : proj.description ? [{ ul: [safe(proj.description)], fontSize: 9 }] : []),
                        ],
                        margin: [0, 4, 0, 0],
                      }))
                    : [{ text: "—", fontSize: 9 }]),

                  // TOOLS
                  sectionHalf("TOOLS"),
                  { ul: arr(data.tools).length ? arr(data.tools) : ["—"], fontSize: 9, margin: [0, 0, 0, 4] },

                  // LANGUAGES
                  sectionHalf("LANGUAGES"),
                  { ul: arr(data.languages).length ? arr(data.languages) : ["—"], fontSize: 9 },
                ],
              },
            ],
            columnGap: 20,
          },
        ],
      };

      pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
        resolve(Buffer.from(buffer));
      });
    } catch (err) {
      reject(err);
    }
  });
}