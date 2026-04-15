"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), { ssr: false });

// Storage keys
// Storage key
const FILTER_STORAGE_KEY = 'staffDashboardFilters';

// Helper to get initial filters from localStorage
const getInitialFilters = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const initialFilters = getInitialFilters();

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize state directly from localStorage
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [selectedBatch, setSelectedBatch] = useState(initialFilters.selectedBatch || 'all');
  const [selectedSemester, setSelectedSemester] = useState(initialFilters.selectedSemester || 'all');
  const [allBatchYears, setAllBatchYears] = useState([]);
  const [staffUser, setStaffUser] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportType, setReportType] = useState('certificates');
  
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
  const [regFrom, setRegFrom] = useState(initialFilters.regFrom || '');
  const [regTo, setRegTo] = useState(initialFilters.regTo || '');
  const [showProjectsColumn, setShowProjectsColumn] = useState(initialFilters.showProjectsColumn || false);
  
  // ... rest of component
  
  const router = useRouter();

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSearchQuery(filters.searchQuery || '');
        setSelectedBatch(filters.selectedBatch || 'all');
        setSelectedSemester(filters.selectedSemester || 'all');
        setDateFrom(filters.dateFrom || '');
        setDateTo(filters.dateTo || '');
        setRegFrom(filters.regFrom || '');
        setRegTo(filters.regTo || '');
        setShowProjectsColumn(filters.showProjectsColumn || false);
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      searchQuery,
      selectedBatch,
      selectedSemester,
      dateFrom,
      dateTo,
      regFrom,
      regTo,
      showProjectsColumn,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [searchQuery, selectedBatch, selectedSemester, dateFrom, dateTo, regFrom, regTo, showProjectsColumn]);

  // Local filter function – filters posts by date, and students by register number range
  const filterStudentsLocally = useCallback((studentsArray) => {
    // First apply register number range filter (removes students outside range)
    let result = studentsArray.filter(student => {
      if (!regFrom && !regTo) return true;
      const reg = student.registerNumber;
      if (!reg) return false;
      if (regFrom && reg < regFrom) return false;
      if (regTo && reg > regTo) return false;
      return true;
    });

    // Then filter posts by date range (but keep all students, just modify their posts)
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      result = result.map(student => {
        const filteredPosts = (student.posts || []).filter(post => {
          let postDate = null;
          if (post.type === 'certificate' && post.participationDate?.from) {
            postDate = new Date(post.participationDate.from);
          } else if (post.type === 'project' && post.createdAt) {
            postDate = new Date(post.createdAt);
          }
          if (!postDate) return false;
          if (from && postDate < from) return false;
          if (to && postDate > to) return false;
          return true;
        });
        return { ...student, posts: filteredPosts };
      });
    }

    return result;
  }, [dateFrom, dateTo, regFrom, regTo]);

  const fetchAllBatchYears = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const response = await fetch('/api/staff/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.batchYears) {
        setAllBatchYears(data.batchYears);
      }
    } catch (err) {
      console.error('Error fetching batch years:', err);
    }
  }, [router]);

  const fetchFilteredStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedBatch !== 'all') params.append('batch', selectedBatch);
      if (selectedSemester !== 'all') params.append('semester', selectedSemester);
      // We still send date/reg params; backend may ignore them
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (regFrom) params.append('regFrom', regFrom);
      if (regTo) params.append('regTo', regTo);

      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const response = await fetch(`/api/staff/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch');
      if (data.success) {
        const baseStudents = data.students || [];
        const filtered = filterStudentsLocally(baseStudents);
        setStudents(baseStudents);
        setFilteredStudents(filtered);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedBatch, selectedSemester, dateFrom, dateTo, regFrom, regTo, filterStudentsLocally, router]);

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (staffUser) fetchFilteredStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBatch, selectedSemester, dateFrom, dateTo, regFrom, regTo, staffUser, fetchFilteredStudents]);

  // Initial load
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
      } catch {
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
    setDateFrom('');
    setDateTo('');
    setRegFrom('');
    setRegTo('');
    // localStorage will auto-update via useEffect
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
    padding: '10px 14px 10px 32px',
    color: '#E5E7EB',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    ...inputStyle,
    padding: '10px 14px',
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  // Count total posts after filtering
  const totalPosts = filteredStudents.reduce((acc, s) => acc + (s.posts?.length || 0), 0);
  // Base student count (before date filter, but after reg/batch/sem/search)
  const displayedStudentCount = filteredStudents.length;

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .staff-card-row { display: flex; flex-direction: row; }
          .staff-card-col { flex: 1; }
        }
        @media (max-width: 767px) {
          .staff-card-row { display: flex; flex-direction: column; }
          .staff-card-col { border-right: none !important; border-bottom: 1px solid #222634; }
          .staff-card-col:last-child { border-bottom: none; }
        }
        .student-card { transition: all 0.2s ease; }
        .student-card:hover { box-shadow: 0 0 0 1px rgba(124,92,255,0.25); background: #161a22 !important; }
        .cert-item, .proj-item {
          background: #0B0D12; border: 1px solid #222634; border-radius: 8px; padding: 12px; transition: all 0.15s;
        }
        .cert-item:hover, .proj-item:hover { border-color: #2a3040; background: #10131a; }
        .batch-highlight {
          background: rgba(124,92,255,0.12); border: 1px solid rgba(124,92,255,0.25); border-radius: 20px;
          padding: 4px 12px; font-weight: 600; color: #a78bfa; display: inline-block; font-size: 13px; margin-top: 8px;
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
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{displayedStudentCount}</p>
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
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{totalPosts}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="filter-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                <button onClick={handleResetFilters} style={buttonSecondaryStyle}>
                  Reset Filters
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Batch Year</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} style={selectStyle}>
                  <option value="all">All Batches</option>
                  {allBatchYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Semester</label>
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={selectStyle}>
                  <option value="all">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={selectStyle} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={selectStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Reg No. From</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#0B0D12', border: '1px solid #222634', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 0 10px 14px', color: '#6B7280', fontSize: 14, background: 'transparent', whiteSpace: 'nowrap' }}>9513</span>
                  <input
                    type="text"
                    value={regFrom.replace(/^9513/, '')}
                    onChange={(e) => {
                      const suffix = e.target.value.replace(/\D/g, ''); // only digits
                      setRegFrom(suffix ? '9513' + suffix : '');
                    }}
                    style={{
                      ...selectStyle,
                      border: 'none',
                      background: 'transparent',
                      padding: '10px 14px 10px 4px',
                      outline: 'none',
                    }}
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Reg No. To</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#0B0D12', border: '1px solid #222634', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 0 10px 14px', color: '#6B7280', fontSize: 14, background: 'transparent', whiteSpace: 'nowrap' }}>9513</span>
                  <input
                    type="text"
                    value={regTo.replace(/^9513/, '')}
                    onChange={(e) => {
                      const suffix = e.target.value.replace(/\D/g, '');
                      setRegTo(suffix ? '9513' + suffix : '');
                    }}
                    style={{
                      ...selectStyle,
                      border: 'none',
                      background: 'transparent',
                      padding: '10px 14px 10px 4px',
                      outline: 'none',
                    }}
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Actions</label>
                <button
                  onClick={fetchFilteredStudents}
                  disabled={loading}
                  style={{ ...buttonSecondaryStyle, width: '100%', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  onMouseOver={(e) => { if (!loading) e.target.style.background = '#171B24'; }}
                  onMouseOut={(e) => { if (!loading) e.target.style.background = 'transparent'; }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Projects Column */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={() => setShowProjectsColumn(!showProjectsColumn)} style={{ ...buttonSecondaryStyle, gap: 6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showProjectsColumn ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
            </svg>
            {showProjectsColumn ? 'Hide Projects' : 'Show Projects'}
          </button>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all' || dateFrom || dateTo || regFrom || regTo) && (
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
            {dateFrom && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                From: {dateFrom}
                <button onClick={() => setDateFrom('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
            {dateTo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                To: {dateTo}
                <button onClick={() => setDateTo('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
            {regFrom && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                Reg From: {regFrom}
                <button onClick={() => setRegFrom('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
            {regTo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
                Reg To: {regTo}
                <button onClick={() => setRegTo('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Loading / No Results / Student Cards */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: 18 }}>
                <div style={{ width: '25%', height: 24, background: '#0B0D12', borderRadius: 4, marginBottom: 16 }}></div>
                <div style={{ width: '75%', height: 16, background: '#0B0D12', borderRadius: 4, marginBottom: 8 }}></div>
                <div style={{ width: '50%', height: 16, background: '#0B0D12', borderRadius: 4 }}></div>
              </div>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#171B24', border: '1px solid #222634', borderRadius: 12 }}>
            <svg width="48" height="48" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No students found</h3>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
              Try adjusting your filters
            </p>
            <button onClick={handleResetFilters} style={buttonPrimaryStyle}>Reset Filters</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredStudents.map((student) => {
              const certs = student.posts?.filter(p => p.type === 'certificate') || [];
              const projs = student.posts?.filter(p => p.type === 'project') || [];
              return (
                <div key={student._id} className="student-card" onClick={() => handleViewProfile(student.registerNumber)} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                  <div className="staff-card-row">
                    <div className="staff-card-col" style={{ padding: '1.25rem', borderRight: '1px solid #222634', background: 'rgba(124,92,255,0.03)' }}>
                      <h3 style={{ color: '#E5E7EB', fontWeight: 700, fontSize: 16, margin: '0 0 4px 0' }}>{student.name}</h3>
                      <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'monospace', margin: '0 0 12px 0' }}>{student.registerNumber}</p>
                      <span className="batch-highlight">
                        Batch: {student.batchYear ? `${student.batchYear} – ${Number(student.batchYear) + 4}` : '—'}
                      </span>
                    </div>
                    <div className="staff-card-col" style={{ padding: '1.25rem', borderRight: showProjectsColumn ? '1px solid #222634' : 'none' }}>
                      <h4 style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>Certificates ({certs.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {certs.length === 0 ? (
                          <p style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic', margin: 0 }}>No certificates</p>
                        ) : (
                          certs.slice(0, 3).map(cert => (
                            <div key={cert._id} className="cert-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <span style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 13 }}>{cert.title}</span>
                                <span style={{ background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500 }}>Sem {cert.semester || '—'}</span>
                              </div>
                              {cert.issuedBy && <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0 0' }}>Issued by: {cert.issuedBy}</p>}
                            </div>
                          ))
                        )}
                        {certs.length > 3 && <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>+{certs.length - 3} more</p>}
                      </div>
                    </div>
                    {showProjectsColumn && (
                      <div className="staff-card-col" style={{ padding: '1.25rem' }}>
                        <h4 style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px 0' }}>Projects ({projs.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {projs.length === 0 ? (
                            <p style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic', margin: 0 }}>No projects</p>
                          ) : (
                            projs.slice(0, 3).map(proj => (
                              <div key={proj._id} className="proj-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 13 }}>{proj.title}</span>
                                  <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 500 }}>Sem {proj.semester || '—'}</span>
                                </div>
                              </div>
                            ))
                          )}
                          {projs.length > 3 && <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>+{projs.length - 3} more</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid #222634', background: '#0B0D12', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ color: '#7C5CFF', fontSize: 12, fontWeight: 500 }}>Click to view full profile →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: 13 }}>
          <p>Showing {filteredStudents.length} students (base: {students.length})</p>
          <button onClick={fetchFilteredStudents} disabled={loading} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13 }} onMouseOver={(e) => e.target.style.color = '#E5E7EB'} onMouseOut={(e) => e.target.style.color = '#9CA3AF'}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div style={{ marginTop: 32, background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Staff Instructions</h3>
          <ul style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, listStyle: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
            <li>You see only students from your department: <strong style={{ color: '#E5E7EB' }}>{staffUser.department || 'your department'}</strong></li>
            <li>Search works across names, register numbers, bio, interests, post titles, descriptions, and tags</li>
            <li>Date filters apply to <strong>posts only</strong> – all students remain visible, but only posts within the date range are shown</li>
            <li>Register number range filters <strong>students</strong> out of the list</li>
            <li>All filters are saved and restored when you return to this page</li>
            <li>Toggle "Show Projects" to view project summaries</li>
          </ul>
        </div>
      </div>

      {showDownloadModal && (
        <PDFGenerator
          students={filteredStudents}
          filters={{ batch: selectedBatch, semester: selectedSemester, search: searchQuery, dateFrom, dateTo, regFrom, regTo }}
          staffUser={staffUser}
          reportType={reportType}
          onClose={() => setShowDownloadModal(false)}
          onReportTypeChange={setReportType}
        />
      )}
    </div>
  );
}