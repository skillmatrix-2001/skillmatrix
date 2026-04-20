// app/(dashboard)/staff/page.js
"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), { ssr: false });

const FILTER_STORAGE_KEY = 'staffDashboardFilters';

// Helper to parse query params into filters object
const parseQueryParams = (searchParams) => {
  return {
    searchQuery: searchParams.get('search') || '',
    selectedBatch: searchParams.get('batch') || 'all',
    selectedSemester: searchParams.get('semester') || 'all',
    selectedCategory: searchParams.get('category') || 'all',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    regFrom: searchParams.get('regFrom') || '',
    regTo: searchParams.get('regTo') || '',
    showProjectsColumn: searchParams.get('showProjects') === 'true',
    showAdvancedFilters: searchParams.get('advanced') === 'true',
    showStaffAccounts: searchParams.get('staff') === 'true',
  };
};

// Helper to build query string from filters
const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  if (filters.searchQuery) params.set('search', filters.searchQuery);
  if (filters.selectedBatch !== 'all') params.set('batch', filters.selectedBatch);
  if (filters.selectedSemester !== 'all') params.set('semester', filters.selectedSemester);
  if (filters.selectedCategory !== 'all') params.set('category', filters.selectedCategory);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.regFrom) params.set('regFrom', filters.regFrom);
  if (filters.regTo) params.set('regTo', filters.regTo);
  if (filters.showProjectsColumn) params.set('showProjects', 'true');
  if (filters.showAdvancedFilters) params.set('advanced', 'true');
  if (filters.showStaffAccounts) params.set('staff', 'true');
  return params.toString();
};

export default function StaffDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL first, then localStorage fallback
  const getInitialFilters = () => {
    const urlFilters = parseQueryParams(searchParams);
    const storageFilters = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}')
      : {};
    return { ...storageFilters, ...urlFilters }; // URL overrides storage
  };

  const initialFilters = getInitialFilters();

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStaffAccounts, setShowStaffAccounts] = useState(initialFilters.showStaffAccounts || false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(initialFilters.showAdvancedFilters || false);

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [selectedBatch, setSelectedBatch] = useState(initialFilters.selectedBatch || 'all');
  const [selectedSemester, setSelectedSemester] = useState(initialFilters.selectedSemester || 'all');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.selectedCategory || 'all');
  const [allBatchYears, setAllBatchYears] = useState([]);
  const [staffUser, setStaffUser] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportType, setReportType] = useState('certificates');

  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');
  const [regFrom, setRegFrom] = useState(initialFilters.regFrom || '');
  const [regTo, setRegTo] = useState(initialFilters.regTo || '');
  const [showProjectsColumn, setShowProjectsColumn] = useState(initialFilters.showProjectsColumn || false);

  // Sync state to URL and localStorage whenever filters change
  useEffect(() => {
    const filters = {
      searchQuery, selectedBatch, selectedSemester, selectedCategory,
      dateFrom, dateTo, regFrom, regTo, showProjectsColumn, showAdvancedFilters, showStaffAccounts
    };

    // Save to localStorage
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));

    // Update URL query params (replace state to avoid polluting history)
    const queryString = buildQueryString(filters);
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedBatch, selectedSemester, selectedCategory, dateFrom, dateTo, regFrom, regTo, showProjectsColumn, showAdvancedFilters, showStaffAccounts, router]);

  // Filter students locally
  const filterStudentsLocally = useCallback((studentsArray) => {
    let result = studentsArray.filter(student => {
      if (!regFrom && !regTo) return true;
      const reg = student.registerNumber;
      if (!reg) return false;
      if (regFrom && reg < regFrom) return false;
      if (regTo && reg > regTo) return false;
      return true;
    });

    // Category filter (applies to posts)
    if (selectedCategory !== 'all') {
      result = result.map(student => {
        const filteredPosts = (student.posts || []).filter(post => {
          if (post.type === 'certificate') {
            return post.category === selectedCategory;
          }
          return false; // exclude projects when filtering by certificate category
        });
        return { ...student, posts: filteredPosts };
      }).filter(student => student.posts.length > 0); // Remove students with no matching posts
    }

    // Date filter
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
  }, [dateFrom, dateTo, regFrom, regTo, selectedCategory]);

  // Filter staff locally (similar but simpler)
  const filterStaffLocally = useCallback((staffArray) => {
    let result = [...staffArray];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.staffId?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [searchQuery]);

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

  const fetchStaffAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const response = await fetch(`/api/users/staff?department=${encodeURIComponent(staffUser?.department || '')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Staff API error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStaffAccounts(data.staff || []);
        setFilteredStaff(filterStaffLocally(data.staff || []));
      } else {
        console.error('Staff API returned error:', data.error);
        setStaffAccounts([]);
        setFilteredStaff([]);
      }
    } catch (err) {
      console.error('Error fetching staff accounts:', err);
      setStaffAccounts([]);
      setFilteredStaff([]);
    } finally {
      setLoading(false);
    }
  }, [staffUser, filterStaffLocally, router]);

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (staffUser) {
        if (showStaffAccounts) {
          fetchStaffAccounts();
        } else {
          fetchFilteredStudents();
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBatch, selectedSemester, selectedCategory, dateFrom, dateTo, regFrom, regTo, staffUser, showStaffAccounts, fetchFilteredStudents, fetchStaffAccounts]);

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
    setSelectedCategory('all');
    setDateFrom('');
    setDateTo('');
    setRegFrom('');
    setRegTo('');
  };

  const handleViewProfile = (id) => {
    if (showStaffAccounts) {
      router.push(`/profile/${id}`); // staffId
    } else {
      router.push(`/profile/${id}`); // registerNumber
    }
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

  const totalPosts = filteredStudents.reduce((acc, s) => acc + (s.posts?.length || 0), 0);
  const displayedCount = showStaffAccounts ? filteredStaff.length : filteredStudents.length;

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
            disabled={displayedCount === 0}
            style={{
              ...buttonPrimaryStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: displayedCount === 0 ? 0.4 : 1,
              cursor: displayedCount === 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => { if (displayedCount > 0) e.target.style.background = '#6d4fe0'; }}
            onMouseOut={(e) => { if (displayedCount > 0) e.target.style.background = '#7C5CFF'; }}
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
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {showStaffAccounts ? 'Staff' : 'Students'}
            </p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{displayedCount}</p>
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
            <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {showStaffAccounts ? 'Department' : 'Total Posts'}
            </p>
            <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>
              {showStaffAccounts ? staffUser.department : totalPosts}
            </p>
          </div>
        </div>

        {/* Main Filter Bar */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={`Search ${showStaffAccounts ? 'staff' : 'students'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={inputStyle}
                />
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowStaffAccounts(!showStaffAccounts)}
                style={{
                  ...buttonSecondaryStyle,
                  background: showStaffAccounts ? 'rgba(124,92,255,0.15)' : 'transparent',
                  borderColor: showStaffAccounts ? '#7C5CFF' : '#222634',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {showStaffAccounts ? 'Show Students' : 'Show Staff Accounts'}
              </button>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={buttonSecondaryStyle}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
              </button>
              <button onClick={handleResetFilters} style={buttonSecondaryStyle}>
                Reset
              </button>
              <button
                onClick={showStaffAccounts ? fetchStaffAccounts : fetchFilteredStudents}
                disabled={loading}
                style={{ ...buttonPrimaryStyle, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Quick Filters (always visible) */}
          {!showStaffAccounts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
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
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Certificate Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={selectStyle}>
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="extra curricular">Extra Curricular</option>
                </select>
              </div>
            </div>
          )}

          {/* Advanced Filters (collapsible) */}
          {showAdvancedFilters && !showStaffAccounts && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #222634' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={selectStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={selectStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Reg No. From</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0B0D12', border: '1px solid #222634', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '10px 0 10px 14px', color: '#6B7280', fontSize: 14, background: 'transparent', whiteSpace: 'nowrap' }}>9513</span>
                    <input
                      type="text"
                      value={regFrom.replace(/^9513/, '')}
                      onChange={(e) => {
                        const suffix = e.target.value.replace(/\D/g, '');
                        setRegFrom(suffix ? '9513' + suffix : '');
                      }}
                      style={{ ...selectStyle, border: 'none', background: 'transparent', padding: '10px 14px 10px 4px', outline: 'none' }}
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
                      style={{ ...selectStyle, border: 'none', background: 'transparent', padding: '10px 14px 10px 4px', outline: 'none' }}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Projects Column (only for students) */}
        {!showStaffAccounts && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowProjectsColumn(!showProjectsColumn)} style={{ ...buttonSecondaryStyle, gap: 6 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showProjectsColumn ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
              {showProjectsColumn ? 'Hide Projects' : 'Show Projects'}
            </button>
          </div>
        )}

        {/* Active Filters */}
        {(searchQuery || selectedBatch !== 'all' || selectedSemester !== 'all' || selectedCategory !== 'all' || dateFrom || dateTo || regFrom || regTo) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Active filters:</span>
            {selectedBatch !== 'all' && <FilterTag label={`Batch: ${selectedBatch}`} onClear={() => setSelectedBatch('all')} />}
            {selectedSemester !== 'all' && <FilterTag label={`Semester: ${selectedSemester}`} onClear={() => setSelectedSemester('all')} />}
            {selectedCategory !== 'all' && <FilterTag label={`Category: ${selectedCategory === 'academic' ? 'Academic' : 'Extra Curricular'}`} onClear={() => setSelectedCategory('all')} />}
            {searchQuery && <FilterTag label={`Search: ${searchQuery}`} onClear={() => setSearchQuery('')} />}
            {dateFrom && <FilterTag label={`From: ${dateFrom}`} onClear={() => setDateFrom('')} />}
            {dateTo && <FilterTag label={`To: ${dateTo}`} onClear={() => setDateTo('')} />}
            {regFrom && <FilterTag label={`Reg From: ${regFrom}`} onClear={() => setRegFrom('')} />}
            {regTo && <FilterTag label={`Reg To: ${regTo}`} onClear={() => setRegTo('')} />}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <LoadingSkeleton />
        ) : displayedCount === 0 ? (
          <EmptyState onReset={handleResetFilters} />
        ) : showStaffAccounts ? (
          <StaffList staff={filteredStaff} onViewProfile={handleViewProfile} />
        ) : (
          <StudentList
            students={filteredStudents}
            showProjectsColumn={showProjectsColumn}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: 13 }}>
          <p>Showing {displayedCount} {showStaffAccounts ? 'staff' : 'students'}</p>
          <button onClick={showStaffAccounts ? fetchStaffAccounts : fetchFilteredStudents} disabled={loading} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13 }} onMouseOver={(e) => e.target.style.color = '#E5E7EB'} onMouseOut={(e) => e.target.style.color = '#9CA3AF'}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 32, background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Staff Instructions</h3>
          <ul style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, listStyle: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
            <li>You see only {showStaffAccounts ? 'staff accounts' : 'students'} from your department: <strong style={{ color: '#E5E7EB' }}>{staffUser.department || 'your department'}</strong></li>
            <li>Search works across names, IDs, and other fields</li>
            <li>Use "Show Staff Accounts" to view and download other staff certificates</li>
            <li>All filters are saved and restored when you return</li>
          </ul>
        </div>
      </div>

      {showDownloadModal && (
        <PDFGenerator
          students={showStaffAccounts ? [] : filteredStudents}
          staff={showStaffAccounts ? filteredStaff : []}
          filters={{ batch: selectedBatch, semester: selectedSemester, search: searchQuery, dateFrom, dateTo, regFrom, regTo }}
          staffUser={staffUser}
          reportType={reportType}
          onClose={() => setShowDownloadModal(false)}
          onReportTypeChange={setReportType}
          isStaffView={showStaffAccounts}
        />
      )}
    </div>
  );
}

// Helper Components (unchanged)
const FilterTag = ({ label, onClear }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#171B24', border: '1px solid #222634', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#9CA3AF' }}>
    {label}
    <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px' }}>×</button>
  </span>
);

const LoadingSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[1,2,3].map(i => (
      <div key={i} style={{ background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: 18 }}>
        <div style={{ width: '25%', height: 24, background: '#0B0D12', borderRadius: 4, marginBottom: 16 }}></div>
        <div style={{ width: '75%', height: 16, background: '#0B0D12', borderRadius: 4, marginBottom: 8 }}></div>
        <div style={{ width: '50%', height: 16, background: '#0B0D12', borderRadius: 4 }}></div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ onReset }) => (
  <div style={{ textAlign: 'center', padding: '3rem', background: '#171B24', border: '1px solid #222634', borderRadius: 12 }}>
    <svg width="48" height="48" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results found</h3>
    <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>Try adjusting your filters</p>
    <button onClick={onReset} style={{ background: '#7C5CFF', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Reset Filters</button>
  </div>
);

const StudentList = ({ students, showProjectsColumn, onViewProfile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {students.map((student) => {
      const certs = student.posts?.filter(p => p.type === 'certificate') || [];
      const projs = student.posts?.filter(p => p.type === 'project') || [];
      return (
        <div key={student._id} className="student-card" onClick={() => onViewProfile(student.registerNumber)} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
          <div className="staff-card-row">
            <div className="staff-card-col" style={{ padding: '1.25rem', borderRight: '1px solid #222634', background: 'rgba(124,92,255,0.03)' }}>
              <h3 style={{ color: '#E5E7EB', fontWeight: 700, fontSize: 16, margin: '0 0 4px 0' }}>{student.name}</h3>
              <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'monospace', margin: '0 0 12px 0' }}>{student.registerNumber}</p>
              <span className="batch-highlight">Batch: {student.batchYear ? `${student.batchYear} – ${Number(student.batchYear) + 4}` : '—'}</span>
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
);

const StaffList = ({ staff, onViewProfile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {staff.map((s) => (
      <div key={s._id} className="student-card" onClick={() => onViewProfile(s.staffId)} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ padding: '1.25rem' }}>
          <h3 style={{ color: '#E5E7EB', fontWeight: 700, fontSize: 16, margin: '0 0 4px 0' }}>{s.name}</h3>
          <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'monospace', margin: '0 0 8px 0' }}>Staff ID: {s.staffId}</p>
          <p style={{ color: '#6B7280', fontSize: 12 }}>Department: {s.department}</p>
        </div>
        <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid #222634', background: '#0B0D12', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ color: '#7C5CFF', fontSize: 12, fontWeight: 500 }}>Click to view profile and certificates →</span>
        </div>
      </div>
    ))}
  </div>
);