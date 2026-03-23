"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [allBatchYears, setAllBatchYears] = useState([]);
  const [staffUser, setStaffUser] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportType, setReportType] = useState('certificates');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (staffUser) fetchFilteredStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBatch, selectedSemester, staffUser]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'staff') {
          setStaffUser(parsedUser);
          fetchAllBatchYears();
          fetchFilteredStudents();
        } else {
          router.push('/feed');
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  const fetchAllBatchYears = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      const response = await fetch(`/api/staff/students?${params}`, {
        credentials: 'include',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await response.json();
      if (data.success && data.batchYears) {
        setAllBatchYears(data.batchYears);
      }
    } catch (err) {
      console.error('Error fetching batch years:', err);
    }
  };

  const fetchFilteredStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedBatch !== 'all') params.append('batch', selectedBatch);
      if (selectedSemester !== 'all') params.append('semester', selectedSemester);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/staff/students?${params}`, {
        credentials: 'include',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      if (data.success) {
        setStudents(data.students || []);
        setFilteredStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBatch('all');
    setSelectedSemester('all');
  };

  const handleViewProfile = (registerNumber) => {
    router.push(`/profile/${registerNumber}`);
  };

  // ─── PDF Generation ───────────────────────────────────────────────────────────
  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;

      // ── Logo ──
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

      // declare all variables first
      const dept = staffUser?.department || 'Computer Science and Engineering';
      const reportLabel = reportType === 'certificates' ? 'CERTIFICATE REPORT' : 'PROJECT REPORT';
      const batchVal = selectedBatch !== 'all' ? selectedBatch : 'All';
      const semVal = selectedSemester !== 'all' ? selectedSemester : 'All';
      const semOddEven = selectedSemester !== 'all'
        ? (parseInt(selectedSemester) % 2 === 0 ? 'Even Sem' : 'Odd Sem')
        : '';

      // ── HEADER ──
      const topY = 14;
      const logoSize = 11; // small logo

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, topY, logoSize, logoSize);
      }

      // College name — centered on full page width
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text(
        'JAYARAJ ANNAPACKIAM CSI COLLEGE OF ENGINEERING',
        pageW / 2,
        topY + 5,
        { align: 'center' }
      );

      // Approved by
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(
        '(Approved by AICTE, New Delhi and Affiliated to Anna University)',
        pageW / 2,
        topY + 11,
        { align: 'center' }
      );

      // Address
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text(
        'MARGOSCHIS NAGAR, NAZARETH \u2013 628 617',
        pageW / 2,
        topY + 17,
        { align: 'center' }
      );

      // NO line/rule between address and department
      let y = topY + logoSize + 10;

      // Department — bold, centered, NO underline
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`DEPARTMENT OF ${dept.toUpperCase()}`, pageW / 2, y, { align: 'center' });
      y += 6;

      // Report title — bold, centered, NO underline
      doc.setFontSize(11);
      doc.text(reportLabel, pageW / 2, y, { align: 'center' });
      y += 9;

      // ── Info lines: plain text, one per line, left-aligned, NO box/table ──
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
      y += 10;

      // ── Table ──
      const isCert = reportType === 'certificates';
      const rows = [];
      let sno = 1;

      filteredStudents.forEach((student) => {
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

      const fileName = `${dept.replace(/\s+/g, '_')}_${reportType}_${selectedBatch !== 'all' ? selectedBatch : 'AllBatches'}${selectedSemester !== 'all' ? '_Sem' + selectedSemester : ''}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
      setShowDownloadModal(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  if (!staffUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Staff Dashboard {staffUser.department && `– ${staffUser.department}`}
            </h1>
            <p className="text-gray-600">View students and achievements in your department</p>
          </div>
          <button
            onClick={() => setShowDownloadModal(true)}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Download Report
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Batch Years</p>
            <p className="text-2xl font-bold text-gray-900">{allBatchYears.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Semester Filter</p>
            <p className="text-2xl font-bold text-gray-900">
              {selectedSemester === 'all' ? 'All' : `Sem ${selectedSemester}`}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-2xl font-bold text-gray-900">
              {students.reduce((acc, s) => acc + (s.posts?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search (name, regNo, interests, posts, tags...)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button onClick={handleResetFilters} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Year</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="all">All Batches</option>
                {allBatchYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="all">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <button
                onClick={fetchFilteredStudents}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all') && (
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedBatch !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Batch: {selectedBatch}
                <button onClick={() => setSelectedBatch('all')} className="ml-2 text-blue-600 hover:text-blue-700">×</button>
              </span>
            )}
            {selectedSemester !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Semester: {selectedSemester}
                <button onClick={() => setSelectedSemester('all')} className="ml-2 text-emerald-600 hover:text-emerald-700">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-2 text-gray-600 hover:text-gray-700">×</button>
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Student Cards */}
        {!loading && filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all'
                ? 'Try adjusting your filters'
                : 'No students registered in your department yet.'}
            </p>
            <button onClick={handleResetFilters} className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div key={student._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/5 p-4 bg-gray-50 border-r border-gray-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-emerald-700">
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500">{student.registerNumber}</p>
                      </div>
                    </div>
                    {student.profile?.interests?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {student.profile.interests.slice(0, 3).map((int, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">{int}</span>
                          ))}
                          {student.profile.interests.length > 3 && (
                            <span className="text-xs text-gray-500">+{student.profile.interests.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:w-2/5 p-4 border-r border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Certificates</h4>
                    <div className="space-y-3">
                      {student.posts?.filter(p => p.type === 'certificate').map((cert) => (
                        <div key={cert._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-900 text-sm">{cert.title}</span>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Sem {cert.semester || 'N/A'}</span>
                          </div>
                          {cert.issuedBy && <p className="text-xs text-gray-600 mt-1">Issued by: {cert.issuedBy}</p>}
                          {cert.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {cert.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">#{tag}</span>
                              ))}
                              {cert.tags.length > 3 && <span className="text-xs text-gray-400">+{cert.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!student.posts || student.posts.filter(p => p.type === 'certificate').length === 0) && (
                        <p className="text-xs text-gray-400 italic">No certificates</p>
                      )}
                    </div>
                  </div>

                  <div className="md:w-2/5 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Projects</h4>
                    <div className="space-y-3">
                      {student.posts?.filter(p => p.type === 'project').map((proj) => (
                        <div key={proj._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-900 text-sm">{proj.title}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Sem {proj.semester || 'N/A'}</span>
                          </div>
                          {proj.techStack?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.techStack.slice(0, 3).map((tech, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{tech}</span>
                              ))}
                              {proj.techStack.length > 3 && <span className="text-xs text-gray-400">+{proj.techStack.length - 3}</span>}
                            </div>
                          )}
                          {proj.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {proj.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">#{tag}</span>
                              ))}
                              {proj.tags.length > 3 && <span className="text-xs text-gray-400">+{proj.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!student.posts || student.posts.filter(p => p.type === 'project').length === 0) && (
                        <p className="text-xs text-gray-400 italic">No projects</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-2 flex justify-end border-t border-gray-200">
                  <button
                    onClick={() => handleViewProfile(student.registerNumber)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View Full Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-between text-sm text-gray-600">
          <p>Showing {filteredStudents.length} of {students.length} students</p>
          {students.length > 0 && (
            <button onClick={fetchFilteredStudents} disabled={loading} className="hover:text-black disabled:opacity-50">
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          )}
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-medium text-gray-900 mb-2">Staff Instructions</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>You see only students from your department: <span className="font-medium">{staffUser.department || 'your department'}</span></li>
            <li>Search works across names, register numbers, bio, interests, post titles, descriptions, and tags</li>
            <li>Filter by batch year and semester to narrow down achievements</li>
            <li>Click "View Full Profile" to see the complete student portfolio</li>
          </ul>
        </div>
      </div>

      {/* ── Download Modal ── */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Download Report</h2>
            <p className="text-sm text-gray-500 mb-5">
              Generates a PDF with the current filters applied ({filteredStudents.length} students).
            </p>

            <p className="text-sm font-medium text-gray-700 mb-3">Include in report:</p>
            <div className="space-y-3 mb-6">
              {[
                { value: 'certificates', label: 'Certificates', desc: 'All course completions & certifications' },
                { value: 'projects', label: 'Projects', desc: 'All student projects' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reportType === opt.value ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={opt.value}
                    checked={reportType === opt.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                disabled={generatingPDF}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
              >
                {generatingPDF ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}