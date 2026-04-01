"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the PDF generator (client‑side only)
const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), {
  ssr: false,
});

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

  // Wrap fetchAllBatchYears in useCallback
  const fetchAllBatchYears = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        router.push('/login');
        return;
      }
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
  }, [router]);

  // Wrap fetchFilteredStudents in useCallback
  const fetchFilteredStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedBatch !== 'all') params.append('batch', selectedBatch);
      if (selectedSemester !== 'all') params.append('semester', selectedSemester);

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/staff/students?${params}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
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
  }, [searchQuery, selectedBatch, selectedSemester, router]);

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (staffUser) fetchFilteredStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBatch, selectedSemester, staffUser, fetchFilteredStudents]);

  // Initial load: get user and fetch data
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
  }, [fetchAllBatchYears, fetchFilteredStudents, router]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBatch('all');
    setSelectedSemester('all');
  };

  const handleViewProfile = (registerNumber) => {
    router.push(`/profile/${registerNumber}`);
  };

  if (!staffUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #222634', borderTopColor: '#7C5CFF', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Loading user session...</p>
        </div>
      </div>
    );
  }

  // Common styles
  const cardStyle = {
    background: '#12151C',
    border: '1px solid #222634',
    borderRadius: 16,
    padding: '1.5rem',
  };

  const inputStyle = {
    width: '100%',
    background: '#0B0D12',
    border: '1px solid #222634',
    borderRadius: 8,
    padding: '10px 14px 10px 32px', // Added left padding for icon
    color: '#E5E7EB',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    ...inputStyle,
    padding: '10px 14px', // No icon, so revert padding
    cursor: 'pointer',
  };

  const buttonPrimaryStyle = {
    background: '#7C5CFF',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  };

  const buttonSecondaryStyle = {
    background: 'transparent',
    color: '#9CA3AF',
    border: '1px solid #222634',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Responsive card layout */
        @media (min-width: 768px) {
          .staff-card-row {
            display: flex;
            flex-direction: row;
          }
          .staff-card-col {
            flex: 1;
          }
        }
        @media (max-width: 767px) {
          .staff-card-row {
            display: flex;
            flex-direction: column;
          }
          .staff-card-col {
            border-right: none !important;
            border-bottom: 1px solid #222634;
          }
          .staff-card-col:last-child {
            border-bottom: none;
          }
        }
        
        /* Filter row adjustments */
        @media (max-width: 640px) {
          .filter-row {
            flex-direction: column;
          }
          .filter-row > div:first-child {
            width: 100%;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              Staff Dashboard {staffUser.department && `– ${staffUser.department}`}
            </h1>
            <p style={{ color: '#6B7280', fontSize: 14 }}>View students and achievements in your department</p>
          </div>
          <button
            onClick={() => setShowDownloadModal(true)}
            disabled={filteredStudents.length === 0}
            style={{
              ...buttonPrimaryStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: filteredStudents.length === 0 ? 0.4 : 1,
              cursor: filteredStudents.length === 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => { if (filteredStudents.length > 0) e.target.style.background = '#6d4fe0'; }}
            onMouseOut={(e) => { if (filteredStudents.length > 0) e.target.style.background = '#7C5CFF'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Download Report
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={cardStyle}>
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Students</p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{students.length}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Batch Years</p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{allBatchYears.length}</p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Semester Filter</p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>
              {selectedSemester === 'all' ? 'All' : `Sem ${selectedSemester}`}
            </p>
          </div>
          <div style={cardStyle}>
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total Posts</p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>
              {students.reduce((acc, s) => acc + (s.posts?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Search (name, regNo, interests, posts, tags...)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={inputStyle}
                  />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button onClick={handleResetFilters} style={buttonSecondaryStyle}>
                Reset Filters
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Batch Year</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Batches</option>
                  {allBatchYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Actions</label>
                <button
                  onClick={fetchFilteredStudents}
                  disabled={loading}
                  style={{
                    ...buttonSecondaryStyle,
                    width: '100%',
                    opacity: loading ? 0.5 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseOver={(e) => { if (!loading) e.target.style.background = '#171B24'; }}
                  onMouseOut={(e) => { if (!loading) e.target.style.background = 'transparent'; }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Active filters:</span>
            {selectedBatch !== 'all' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                Batch: {selectedBatch}
                <button onClick={() => setSelectedBatch('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
            {selectedSemester !== 'all' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                Semester: {selectedSemester}
                <button onClick={() => setSelectedSemester('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
            {searchQuery && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: 18 }}>
                <div style={{ width: '25%', height: 24, background: '#0B0D12', borderRadius: 4, marginBottom: 16 }}></div>
                <div style={{ width: '75%', height: 16, background: '#0B0D12', borderRadius: 4, marginBottom: 8 }}></div>
                <div style={{ width: '50%', height: 16, background: '#0B0D12', borderRadius: 4 }}></div>
              </div>
            ))}
          </div>
        )}

        {/* Student Cards */}
        {!loading && filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#171B24', border: '1px solid #222634', borderRadius: 12 }}>
            <svg width="48" height="48" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No students found</h3>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
              {searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all'
                ? 'Try adjusting your filters'
                : 'No students registered in your department yet.'}
            </p>
            <button onClick={handleResetFilters} style={buttonPrimaryStyle}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredStudents.map((student) => (
              <div key={student._id} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, overflow: 'hidden' }}>
                <div className="staff-card-row">
                  {/* Left sidebar */}
                  <div className="staff-card-col" style={{ padding: '1rem', borderRight: '1px solid #222634', background: '#0B0D12' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#171B24', border: '1px solid #222634', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#7C5CFF' }}>
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14 }}>{student.name}</h3>
                        <p style={{ color: '#6B7280', fontSize: 11 }}>{student.registerNumber}</p>
                      </div>
                    </div>
                    {student.profile?.interests?.length > 0 && (
                      <div>
                        <p style={{ color: '#6B7280', fontSize: 10, marginBottom: 6 }}>Interests</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {student.profile.interests.slice(0, 3).map((int, i) => (
                            <span key={i} style={{ background: '#171B24', border: '1px solid #222634', padding: '2px 8px', borderRadius: 12, fontSize: 10, color: '#9CA3AF' }}>{int}</span>
                          ))}
                          {student.profile.interests.length > 3 && (
                            <span style={{ fontSize: 10, color: '#6B7280' }}>+{student.profile.interests.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Certificates */}
                  <div className="staff-card-col" style={{ padding: '1rem', borderRight: '1px solid #222634' }}>
                    <h4 style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Certificates</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {student.posts?.filter(p => p.type === 'certificate').map((cert) => (
                        <div key={cert._id} style={{ background: '#0B0D12', border: '1px solid #222634', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ color: '#E5E7EB', fontWeight: 500, fontSize: 13 }}>{cert.title}</span>
                            <span style={{ background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: 12, fontSize: 10 }}>
                              Sem {cert.semester || 'N/A'}
                            </span>
                          </div>
                          {cert.issuedBy && <p style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>Issued by: {cert.issuedBy}</p>}
                          {cert.tags?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {cert.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} style={{ background: '#171B24', border: '1px solid #222634', padding: '2px 6px', borderRadius: 12, fontSize: 10, color: '#9CA3AF' }}>#{tag}</span>
                              ))}
                              {cert.tags.length > 3 && <span style={{ fontSize: 10, color: '#6B7280' }}>+{cert.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!student.posts || student.posts.filter(p => p.type === 'certificate').length === 0) && (
                        <p style={{ color: '#6B7280', fontSize: 11, fontStyle: 'italic' }}>No certificates</p>
                      )}
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="staff-card-col" style={{ padding: '1rem' }}>
                    <h4 style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Projects</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {student.posts?.filter(p => p.type === 'project').map((proj) => (
                        <div key={proj._id} style={{ background: '#0B0D12', border: '1px solid #222634', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ color: '#E5E7EB', fontWeight: 500, fontSize: 13 }}>{proj.title}</span>
                            <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '2px 6px', borderRadius: 12, fontSize: 10 }}>
                              Sem {proj.semester || 'N/A'}
                            </span>
                          </div>
                          {proj.techStack?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {proj.techStack.slice(0, 3).map((tech, idx) => (
                                <span key={idx} style={{ background: '#171B24', border: '1px solid #222634', padding: '2px 6px', borderRadius: 12, fontSize: 10, color: '#9CA3AF' }}>{tech}</span>
                              ))}
                              {proj.techStack.length > 3 && <span style={{ fontSize: 10, color: '#6B7280' }}>+{proj.techStack.length - 3}</span>}
                            </div>
                          )}
                          {proj.tags?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {proj.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} style={{ background: '#171B24', border: '1px solid #222634', padding: '2px 6px', borderRadius: 12, fontSize: 10, color: '#9CA3AF' }}>#{tag}</span>
                              ))}
                              {proj.tags.length > 3 && <span style={{ fontSize: 10, color: '#6B7280' }}>+{proj.tags.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!student.posts || student.posts.filter(p => p.type === 'project').length === 0) && (
                        <p style={{ color: '#6B7280', fontSize: 11, fontStyle: 'italic' }}>No projects</p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #222634', background: '#0B0D12', textAlign: 'right' }}>
                  <button
                    onClick={() => handleViewProfile(student.registerNumber)}
                    style={{ color: '#7C5CFF', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    onMouseOver={(e) => (e.target.style.color = '#9b7cff')}
                    onMouseOut={(e) => (e.target.style.color = '#7C5CFF')}
                  >
                    View Full Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: 13 }}>
          <p>Showing {filteredStudents.length} of {students.length} students</p>
          {students.length > 0 && (
            <button onClick={fetchFilteredStudents} disabled={loading} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13, transition: 'color 0.2s' }} onMouseOver={(e) => (e.target.style.color = '#E5E7EB')} onMouseOut={(e) => (e.target.style.color = '#9CA3AF')}>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          )}
        </div>

        <div style={{ marginTop: 32, background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Staff Instructions</h3>
          <ul style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, listStyle: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
            <li>You see only students from your department: <strong style={{ color: '#E5E7EB' }}>{staffUser.department || 'your department'}</strong></li>
            <li>Search works across names, register numbers, bio, interests, post titles, descriptions, and tags</li>
            <li>Filter by batch year and semester to narrow down achievements</li>
            <li>Click "View Full Profile" to see the complete student portfolio</li>
          </ul>
        </div>
      </div>

      {/* PDF Generator Modal – dynamically loaded client‑side */}
      {showDownloadModal && (
        <PDFGenerator
          students={filteredStudents}
          filters={{ batch: selectedBatch, semester: selectedSemester, search: searchQuery }}
          staffUser={staffUser}
          reportType={reportType}
          onClose={() => setShowDownloadModal(false)}
          onReportTypeChange={setReportType}
        />
      )}
    </div>
  );
}