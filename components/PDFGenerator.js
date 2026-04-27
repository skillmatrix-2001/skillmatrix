'use client';

import { useState } from 'react';

export default function PDFGenerator({ students, filters, staffUser, reportType, onClose, onReportTypeChange }) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;

      let logoBase64 = null;
      try {
        const res = await fetch('/logo.png');
        if (res.ok) {
          const blob = await res.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (_) {}

      const dept = staffUser?.department || 'Computer Science and Engineering';
      const reportLabel = reportType === 'certificates' ? 'CERTIFICATE REPORT' : 'PROJECT REPORT';
      const batchVal = filters.batch !== 'all' ? filters.batch : 'All';
      const semVal = filters.semester !== 'all' ? filters.semester : 'All';
      const semOddEven = filters.semester !== 'all'
        ? (parseInt(filters.semester) % 2 === 0 ? 'Even Sem' : 'Odd Sem')
        : '';

      const topY = 14;
      const logoSize = 11;

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, topY, logoSize, logoSize);
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text(
        'JAYARAJ ANNAPACKIAM CSI COLLEGE OF ENGINEERING',
        pageW / 2,
        topY + 5,
        { align: 'center' }
      );

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(
        '(Approved by AICTE, New Delhi and Affiliated to Anna University)',
        pageW / 2,
        topY + 11,
        { align: 'center' }
      );

      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text(
        'MARGOSCHIS NAGAR, NAZARETH – 628 617',
        pageW / 2,
        topY + 17,
        { align: 'center' }
      );

      let y = topY + logoSize + 10;

      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`DEPARTMENT OF ${dept.toUpperCase()}`, pageW / 2, y, { align: 'center' });
      y += 6;

      doc.setFontSize(11);
      doc.text(reportLabel, pageW / 2, y, { align: 'center' });
      y += 9;

      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text(`Dept.: ${dept}`, margin, y);
      y += 6;
      doc.text(`Batch: ${batchVal}`, margin, y);
      y += 6;
      doc.text(
        `Semester: ${semVal}${semOddEven ? ` (${semOddEven})` : ''}`,
        margin,
        y
      );
      y += 6;

      if (filters.dateFrom || filters.dateTo) {
        const fromStr = filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString('en-GB') : 'Start';
        const toStr = filters.dateTo ? new Date(filters.dateTo).toLocaleDateString('en-GB') : 'End';
        doc.text(`Date Range: ${fromStr} – ${toStr}`, margin, y);
        y += 6;
      }

      y += 4;

      const isCert = reportType === 'certificates';
      const rows = [];
      let sno = 1;

      students.forEach((student) => {
        const posts = student.posts?.filter(p => p.type === (isCert ? 'certificate' : 'project')) || [];
        if (posts.length === 0) {
          rows.push([sno++, student.registerNumber || '', student.name || '', '-', '-']);
        } else {
          posts.forEach((post, idx) => {
            rows.push([
              idx === 0 ? sno++ : '',
              idx === 0 ? (student.registerNumber || '') : '',
              idx === 0 ? (student.name || '') : '',
              post.title || '-',
              isCert ? (post.issuedBy || '-') : (post.techStack?.join(', ') || '-'),
            ]);
          });
        }
      });

      const head = isCert
        ? [['S.No', 'Register Number', 'Student Name', 'Certificate Title', 'Issued By']]
        : [['S.No', 'Register Number', 'Student Name', 'Project Title', 'Tech Stack']];

      autoTable(doc, {
        startY: y,
        head,
        body: rows,
        theme: 'grid',
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 3,
          valign: 'middle',
          textColor: 0,
          fillColor: false,
          lineColor: 0,
          lineWidth: 0.2,
        },
        headStyles: {
          font: 'times',
          fillColor: false,
          textColor: 0,
          fontStyle: 'bold',
          fontSize: 10,
          lineColor: 0,
          lineWidth: 0.3,
        },
        alternateRowStyles: {
          fillColor: false,
        },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 42 },
          2: { cellWidth: 45 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 38 },
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          doc.setFont('times', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${data.pageNumber}  |  ${dept}  |  ${reportLabel}`,
            pageW / 2,
            pageH - 8,
            { align: 'center' }
          );
          doc.setTextColor(0);
        },
      });

      const fileName = `${dept.replace(/\s+/g, '_')}_${reportType}_${filters.batch !== 'all' ? filters.batch : 'AllBatches'}${filters.semester !== 'all' ? '_Sem' + filters.semester : ''}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          padding: '1.5rem',
        }}
      >
        <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
          Download Report
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
          Generates a PDF with the current filters applied ({students.length} students).
        </p>

        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
          Include in report:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            { value: 'certificates', label: 'Certificates', desc: 'All course completions & certifications' },
            { value: 'projects', label: 'Projects', desc: 'All student projects' },
          ].map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px',
                background: reportType === opt.value ? 'var(--surface-2)' : 'transparent',
                border: `1px solid ${reportType === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (reportType !== opt.value) e.currentTarget.style.background = 'var(--surface-2)';
              }}
              onMouseOut={(e) => {
                if (reportType !== opt.value) e.currentTarget.style.background = 'transparent';
              }}
            >
              <input
                type="radio"
                name="reportType"
                value={opt.value}
                checked={reportType === opt.value}
                onChange={(e) => onReportTypeChange(e.target.value)}
                style={{ marginTop: 2, accentColor: 'var(--primary)' }}
              />
              <div>
                <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                  {opt.label}
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  {opt.desc}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            className="action-btn-ghost"
            style={{
              flex: 1,
              background: 'var(--btn-ghost-bg)',
              border: '1px solid var(--btn-ghost-border)',
              borderRadius: 10,
              padding: '10px',
              color: 'var(--btn-ghost-text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = 'var(--btn-ghost-hover-border)';
              e.target.style.color = 'var(--btn-ghost-hover-text)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = 'var(--btn-ghost-border)';
              e.target.style.color = 'var(--btn-ghost-text)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={generating}
            style={{
              flex: 1,
              background: 'var(--btn-primary-bg)',
              border: 'none',
              borderRadius: 10,
              padding: '10px',
              color: 'var(--btn-primary-text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: generating ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => { if (!generating) e.target.style.background = 'var(--btn-primary-hover-bg)'; }}
            onMouseOut={(e) => { if (!generating) e.target.style.background = 'var(--btn-primary-bg)'; }}
          >
            {generating ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}