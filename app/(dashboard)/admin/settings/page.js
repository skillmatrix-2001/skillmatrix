"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ColorPicker from '@/components/ui/ColorPicker';

// ===================== Custom Alert System with Timer =====================
function CustomAlert({ message, type, onConfirm, onCancel, timerSeconds = 0 }) {
  const [isClosing, setIsClosing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [canConfirm, setCanConfirm] = useState(timerSeconds === 0);

  useEffect(() => {
    if (timerSeconds > 0 && type === 'confirm') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanConfirm(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerSeconds, type]);

  const handleClose = (confirmed) => {
    if (confirmed && timerSeconds > 0 && !canConfirm) return;
    setIsClosing(true);
    setTimeout(() => {
      if (confirmed) onConfirm?.();
      else onCancel?.();
    }, 200);
  };

  const isConfirm = type === 'confirm';
  const borderColor = isConfirm ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.3)';
  const textColor = isConfirm ? '#FCA5A5' : '#10B981';
  const buttonBg = isConfirm ? '#DC2626' : '#7C5CFF';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#12151C',
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          animation: isClosing ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        }}
      >
        <p
          style={{
            color: textColor,
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {isConfirm ? (
            <>
              <button
                onClick={() => handleClose(true)}
                disabled={!canConfirm}
                style={{
                  background: buttonBg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: !canConfirm ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                  opacity: !canConfirm ? 0.6 : 1,
                }}
                onMouseOver={(e) => { if (canConfirm) e.target.style.background = '#B91C1C'; }}
                onMouseOut={(e) => { if (canConfirm) e.target.style.background = buttonBg; }}
              >
                Yes, Delete {!canConfirm && `(${timeLeft}s)`}
              </button>
              <button
                onClick={() => handleClose(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #222634',
                  color: '#9CA3AF',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = '#171B24')}
                onMouseOut={(e) => (e.target.style.background = 'transparent')}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => handleClose(true)}
              style={{
                background: buttonBg,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.background = '#6d4fe0')}
              onMouseOut={(e) => (e.target.style.background = buttonBg)}
            >
              OK
            </button>
          )}
        </div>
      </div>
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
    </div>
  );
}

function useCustomAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'info', timerSeconds = 0) => {
    return new Promise((resolve) => {
      setAlert({ message, type, resolve, timerSeconds });
    });
  };

  const AlertComponent = alert ? (
    <CustomAlert
      message={alert.message}
      type={alert.type}
      timerSeconds={alert.timerSeconds}
      onConfirm={() => {
        if (alert.resolve) alert.resolve(true);
        setAlert(null);
      }}
      onCancel={() => {
        if (alert.resolve) alert.resolve(false);
        setAlert(null);
      }}
    />
  ) : null;

  return { showAlert, AlertComponent };
}

// Collapsible Section Component
function CollapsibleSection({ title, iconSvg, children, isOpen, onToggle, theme = 'neutral' }) {
  const isDanger = theme === 'danger';
  const baseBg = isDanger ? 'rgba(220,38,38,0.1)' : 'rgba(124,92,255,0.08)';
  const borderColor = isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(124,92,255,0.2)';
  const textColor = isDanger ? '#EF4444' : '#7C5CFF';
  const hoverBg = isDanger ? 'rgba(220,38,38,0.15)' : 'rgba(124,92,255,0.12)';

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: baseBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = hoverBg;
          if (isDanger) e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
          else e.currentTarget.style.borderColor = 'rgba(124,92,255,0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = baseBg;
          e.currentTarget.style.borderColor = borderColor;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {iconSvg && <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{iconSvg}</span>}
          <span style={{ color: textColor, fontWeight: 600, fontSize: 14 }}>{title}</span>
        </div>
        <svg
          style={{
            width: 20,
            height: 20,
            color: textColor,
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        style={{
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isOpen ? '2000px' : '0',
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? '1rem' : '0',
        }}
      >
        <div
          style={{
            background: isDanger ? 'rgba(220,38,38,0.15)' : 'rgba(124,92,255,0.05)',
            borderRadius: 12,
            padding: '1.5rem',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(124,92,255,0.15)'}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isDeptCreateOpen, setIsDeptCreateOpen] = useState(false);
  const [isDeptDangerOpen, setIsDeptDangerOpen] = useState(false);
  const [isStaffCreateOpen, setIsStaffCreateOpen] = useState(false);
  const [isStaffDangerOpen, setIsStaffDangerOpen] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  const [deptForm, setDeptForm] = useState({ name: '', color: '#7C5CFF' });
  const [staffForm, setStaffForm] = useState({
    name: '',
    department: '',
    staffId: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'admin') {
        setAdminUser(parsedUser);
      } else {
        router.push('/feed');
      }
    } else {
      router.push('/login');
    }
    fetchDepartments();
    fetchStaff();
  }, [router]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/depts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        if (data.length > 0 && !staffForm.department) {
          setStaffForm(prev => ({ ...prev, department: data[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/users/staff', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStaffList(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showAlert('Department name is required', 'error');
      return;
    }
    if (!adminUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/depts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: adminUser._id,
          userRole: adminUser.role,
          name: deptForm.name,
          color: deptForm.color,
        }),
      });
      if (response.ok) {
        await fetchDepartments();
        setDeptForm({ name: '', color: '#7C5CFF' });
        showAlert('Department created successfully!', 'success');
        setIsDeptCreateOpen(false);
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to create department', 'error');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (deptId, deptName) => {
    const confirmed = await showAlert(`Delete department "${deptName}"? This action cannot be undone.`, 'confirm', 10);
    if (!confirmed) return;
    if (!adminUser) return;
    try {
      const response = await fetch(`/api/depts?id=${deptId}&userId=${adminUser._id}&role=${adminUser.role}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchDepartments();
        showAlert('Department deleted successfully', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Failed to delete department', 'error');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'error');
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (staffForm.password !== staffForm.confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }
    if (staffForm.password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }
    if (!staffForm.staffId.trim()) {
      showAlert('Staff ID is required', 'error');
      return;
    }
    if (!adminUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/users/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: staffForm.name,
          department: staffForm.department,
          staffId: staffForm.staffId,
          password: staffForm.password,
          username: staffForm.name, // Use staff name as username
          adminUserId: adminUser._id,
          adminUserRole: adminUser.role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchStaff();
        setStaffForm({
          name: '',
          department: departments[0]?.name || '',
          staffId: '',
          password: '',
          confirmPassword: '',
        });
        showAlert('Staff account created successfully!', 'success');
        setIsStaffCreateOpen(false);
      } else {
        showAlert(data.error || 'Failed to create staff account', 'error');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    const confirmed = await showAlert(`Delete staff member "${staffName}"? This action cannot be undone.`, 'confirm', 10);
    if (!confirmed) return;
    if (!adminUser) return;
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adminUserId: adminUser._id,
          adminUserRole: adminUser.role,
          targetUserId: staffId,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchStaff();
        showAlert('Staff account deleted successfully', 'success');
      } else {
        showAlert(data.error || 'Failed to delete staff account', 'error');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'error');
    }
  };

  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #222634', borderTopColor: '#7C5CFF', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Helper: convert hex to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    let r, g, b;
    if (hex.startsWith('#')) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } else if (hex.startsWith('rgb')) {
      const match = hex.match(/\d+/g);
      if (match) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      } else {
        return 'rgba(124,92,255,0.1)';
      }
    } else {
      return 'rgba(124,92,255,0.1)';
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const inputStyle = {
    width: '100%',
    background: '#0B0D12',
    border: '1px solid #222634',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#E5E7EB',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    ...inputStyle,
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

  const dangerButtonStyle = {
    background: 'rgba(220,38,38,0.2)',
    color: '#EF4444',
    border: '1px solid rgba(220,38,38,0.5)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  };

  // SVG Icons
  const PlusIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );

  const DangerIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const UserIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .settings-header { flex-direction: column; align-items: stretch !important; }
          .dept-grid { grid-template-columns: 1fr !important; }
          .staff-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div className="settings-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Settings</h1>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Manage departments and staff accounts</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            style={buttonSecondaryStyle}
            onMouseOver={(e) => { e.target.style.borderColor = '#9CA3AF'; e.target.style.color = '#E5E7EB'; }}
            onMouseOut={(e) => { e.target.style.borderColor = '#222634'; e.target.style.color = '#9CA3AF'; }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 16, marginBottom: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid #222634', display: 'flex' }}>
            {['departments', 'staff'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  fontSize: 13,
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: activeTab === tab ? '#E5E7EB' : '#6B7280',
                  borderBottom: activeTab === tab ? '2px solid #7C5CFF' : 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => { if (activeTab !== tab) e.target.style.color = '#9CA3AF'; }}
                onMouseOut={(e) => { if (activeTab !== tab) e.target.style.color = '#6B7280'; }}
              >
                {tab === 'departments' ? 'Departments' : 'Staff Accounts'}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'departments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Departments List (safe view) – with color‑based tint */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>All Departments</h2>
                  {departments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#0B0D12', borderRadius: 12, border: '1px solid #222634' }}>
                      <p style={{ color: '#6B7280' }}>No departments yet. Create one below.</p>
                    </div>
                  ) : (
                    <div className="dept-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {departments.map((dept) => {
                        const tintColor = hexToRgba(dept.color, 0.12);
                        const hoverGlow = hexToRgba(dept.color, 0.25);
                        return (
                          <div
                            key={dept._id}
                            style={{
                              background: tintColor,
                              border: `1px solid ${hexToRgba(dept.color, 0.3)}`,
                              borderRadius: 12,
                              padding: '1rem',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.boxShadow = `0 0 0 1px ${hoverGlow}`;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 12, height: 12, borderRadius: 999, background: dept.color }} />
                              <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{dept.name}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', marginTop: 6 }}>ID: {dept._id.substring(0, 8)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Collapsible Create Department Section */}
                <CollapsibleSection
                  title="Create New Department"
                  iconSvg={PlusIcon}
                  isOpen={isDeptCreateOpen}
                  onToggle={() => setIsDeptCreateOpen(!isDeptCreateOpen)}
                  theme="neutral"
                >
                  <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Department Name *</label>
                        <input
                          type="text"
                          value={deptForm.name}
                          onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                          style={inputStyle}
                          placeholder="e.g., Computer Science"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Department Color *</label>
                        <ColorPicker
                          value={deptForm.color}
                          onChange={(color) => setDeptForm({ ...deptForm, color })}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={loading || !deptForm.name.trim()}
                        style={{ ...buttonPrimaryStyle, opacity: (loading || !deptForm.name.trim()) ? 0.6 : 1, cursor: (loading || !deptForm.name.trim()) ? 'not-allowed' : 'pointer' }}
                        onMouseOver={(e) => { if (!loading && deptForm.name.trim()) e.target.style.background = '#6d4fe0'; }}
                        onMouseOut={(e) => { if (!loading && deptForm.name.trim()) e.target.style.background = '#7C5CFF'; }}
                      >
                        {loading ? 'Creating...' : 'Create Department'}
                      </button>
                    </div>
                  </form>
                </CollapsibleSection>

                {/* Danger Zone (unchanged) */}
                <CollapsibleSection
                  title="Danger Zone"
                  iconSvg={DangerIcon}
                  isOpen={isDeptDangerOpen}
                  onToggle={() => setIsDeptDangerOpen(!isDeptDangerOpen)}
                  theme="danger"
                >
                  <p style={{ color: '#FCA5A5', fontSize: 13, marginBottom: '1.5rem', opacity: 0.9 }}>
                    Deleting a department will remove it permanently. This action cannot be undone.
                    You will need to wait 10 seconds before confirming deletion.
                  </p>
                  {departments.filter(d => d.name !== 'Default').length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13 }}>No deletable departments available.</p>
                    </div>
                  ) : (
                    <div className="dept-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {departments.filter(d => d.name !== 'Default').map((dept) => (
                        <div key={dept._id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 12, height: 12, borderRadius: 999, background: dept.color }} />
                              <span style={{ color: '#FCA5A5', fontWeight: 500 }}>{dept.name}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 4 }}>ID: {dept._id.substring(0, 8)}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteDept(dept._id, dept.name)}
                            style={dangerButtonStyle}
                            onMouseOver={(e) => { e.target.style.background = 'rgba(220,38,38,0.4)'; e.target.style.borderColor = '#EF4444'; e.target.style.color = '#FCA5A5'; }}
                            onMouseOut={(e) => { e.target.style.background = 'rgba(220,38,38,0.2)'; e.target.style.borderColor = 'rgba(220,38,38,0.5)'; e.target.style.color = '#EF4444'; }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            )}

            {activeTab === 'staff' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Staff List (safe view – redesigned clean cards) */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>All Staff Accounts</h2>
                  {staffList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#0B0D12', borderRadius: 12, border: '1px solid #222634' }}>
                      <p style={{ color: '#6B7280' }}>No staff accounts yet. Create one below.</p>
                    </div>
                  ) : (
                    <div className="staff-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {staffList.map((staff) => {
                        const dept = departments.find(d => d.name === staff.department);
                        const tintColor = dept ? hexToRgba(dept.color, 0.08) : 'rgba(245,158,11,0.06)';
                        const borderColor = dept ? hexToRgba(dept.color, 0.2) : 'rgba(245,158,11,0.15)';
                        const hoverGlow = dept ? hexToRgba(dept.color, 0.2) : 'rgba(245,158,11,0.15)';
                        return (
                          <div
                            key={staff._id}
                            style={{
                              background: tintColor,
                              border: `1px solid ${borderColor}`,
                              borderRadius: 12,
                              padding: '1.2rem',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.boxShadow = `0 0 0 1px ${hoverGlow}`;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Name - larger and prominent */}
                            <div style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                              {staff.name}
                            </div>
                            
                            {/* Details - muted labels and values */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#6B7280', minWidth: 70 }}>Staff ID</span>
                                <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'monospace' }}>{staff.staffId}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#6B7280', minWidth: 70 }}>Department</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dept?.color || '#F59E0B' }} />
                                  <span style={{ fontSize: 13, color: '#9CA3AF' }}>{staff.department}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#6B7280', minWidth: 70 }}>Joined</span>
                                <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                                  {new Date(staff.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Create Staff Section (unchanged) */}
                <CollapsibleSection
                  title="Create Staff Account"
                  iconSvg={UserIcon}
                  isOpen={isStaffCreateOpen}
                  onToggle={() => setIsStaffCreateOpen(!isStaffCreateOpen)}
                  theme="neutral"
                >
                  <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Staff Name *</label>
                        <input
                          type="text"
                          value={staffForm.name}
                          onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                          style={inputStyle}
                          placeholder="e.g., Dr. Robert Chen"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Department *</label>
                        <select
                          value={staffForm.department}
                          onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                          style={selectStyle}
                          required
                        >
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept.name}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Staff ID *</label>
                        <input
                          type="text"
                          value={staffForm.staffId}
                          onChange={(e) => setStaffForm({ ...staffForm, staffId: e.target.value })}
                          style={inputStyle}
                          placeholder="e.g., STAFF001"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Password *</label>
                        <input
                          type="password"
                          value={staffForm.password}
                          onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                          style={inputStyle}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Confirm Password *</label>
                        <input
                          type="password"
                          value={staffForm.confirmPassword}
                          onChange={(e) => setStaffForm({ ...staffForm, confirmPassword: e.target.value })}
                          style={inputStyle}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{ ...buttonPrimaryStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                        onMouseOver={(e) => { if (!loading) e.target.style.background = '#6d4fe0'; }}
                        onMouseOut={(e) => { if (!loading) e.target.style.background = '#7C5CFF'; }}
                      >
                        {loading ? 'Creating...' : 'Create Staff Account'}
                      </button>
                    </div>
                  </form>
                </CollapsibleSection>

                {/* Danger Zone (redesigned clean cards) */}
                <CollapsibleSection
                  title="Danger Zone"
                  iconSvg={DangerIcon}
                  isOpen={isStaffDangerOpen}
                  onToggle={() => setIsStaffDangerOpen(!isStaffDangerOpen)}
                  theme="danger"
                >
                  <p style={{ color: '#FCA5A5', fontSize: 13, marginBottom: '1.5rem', opacity: 0.9 }}>
                    Deleting a staff account will permanently remove it. This action cannot be undone.
                    You will need to wait 10 seconds before confirming deletion.
                  </p>
                  {staffList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 13 }}>No staff accounts to delete.</p>
                    </div>
                  ) : (
                    <div className="staff-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {staffList.map((staff) => {
                        const dept = departments.find(d => d.name === staff.department);
                        return (
                          <div key={staff._id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ color: '#FCA5A5', fontWeight: 600, fontSize: 16 }}>{staff.name}</div>
                              <button
                                onClick={() => handleDeleteStaff(staff._id, staff.name)}
                                style={dangerButtonStyle}
                                onMouseOver={(e) => { e.target.style.background = 'rgba(220,38,38,0.4)'; e.target.style.borderColor = '#EF4444'; e.target.style.color = '#FCA5A5'; }}
                                onMouseOut={(e) => { e.target.style.background = 'rgba(220,38,38,0.2)'; e.target.style.borderColor = 'rgba(220,38,38,0.5)'; e.target.style.color = '#EF4444'; }}
                              >
                                Delete
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 70 }}>Staff ID</span>
                                <span style={{ fontSize: 13, color: '#FCA5A5', fontFamily: 'monospace' }}>{staff.staffId}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 70 }}>Department</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dept?.color || '#F59E0B' }} />
                                  <span style={{ fontSize: 13, color: '#FCA5A5' }}>{staff.department}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>
      </div>
      {AlertComponent}
    </div>
  );
}