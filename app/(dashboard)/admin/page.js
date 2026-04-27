"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const borderColor = isConfirm ? 'var(--danger)' : 'var(--success)';
  const textColor = isConfirm ? 'var(--danger)' : 'var(--primary)';
  const buttonBg = isConfirm ? 'var(--danger)' : 'var(--primary)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--modal-backdrop)',
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
          background: 'var(--modal-bg)',
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
                onMouseOver={(e) => { if (canConfirm) e.target.style.background = 'var(--danger-hover)'; }}
                onMouseOut={(e) => { if (canConfirm) e.target.style.background = buttonBg; }}
              >
                Yes, Delete {!canConfirm && `(${timeLeft}s)`}
              </button>
              <button
                onClick={() => handleClose(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = 'var(--surface-2)')}
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
              onMouseOver={(e) => (e.target.style.background = 'var(--primary-hover)')}
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

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();

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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/all');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await showAlert('Delete this user? This action cannot be undone.', 'confirm', 10);
    if (!confirmed) return;
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: adminUser._id,
          adminUserRole: adminUser.role,
          targetUserId: userId,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(users.filter(user => user._id !== userId));
        showAlert('User deleted successfully', 'success');
      } else {
        showAlert(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Failed to delete user', 'error');
    }
  };

  // Filter users: exclude the current admin user from the list
  const filteredUsers = users.filter(user => {
    if (adminUser && user._id === adminUser._id) return false;
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.registerNumber && user.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.staffId && user.staffId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Role‑based full card background tint using CSS variables
  const getRoleCardStyle = (role) => {
    let bg = '';
    let border = '';
    let glow = '';
    if (role === 'student') {
      bg = 'var(--success-soft)';
      border = 'var(--success-soft-border)';
      glow = 'var(--success-soft-border)';
    } else if (role === 'staff') {
      bg = 'var(--warning-soft, rgba(212, 160, 23, 0.09))';  // fallback for missing token
      border = 'var(--warning-soft-border, rgba(212, 160, 23, 0.18))';
      glow = 'var(--warning-soft-border, rgba(212, 160, 23, 0.18))';
    } else {
      bg = 'var(--primary-soft)';
      border = 'var(--primary-soft-border)';
      glow = 'var(--primary-soft-border)';
    }
    return { bg, border, glow };
  };

  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const cardStyle = {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '1.5rem',
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: 8,
    padding: '10px 14px 10px 32px',
    color: 'var(--input-text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--input-text)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const buttonPrimaryStyle = {
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };

  const buttonSecondaryStyle = {
    background: 'var(--btn-ghost-bg)',
    color: 'var(--btn-ghost-text)',
    border: '1px solid var(--btn-ghost-border)',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .controls-row { flex-direction: column; align-items: stretch !important; }
          .users-grid { grid-template-columns: 1fr !important; }
        }
        .card-hover:hover {
          box-shadow: 0 0 0 1px var(--card-hover-border);
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Manage all users, staff accounts, and departments</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: users.length - 1, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'var(--primary)' },
            { label: 'Students', value: users.filter(u => u.role === 'student').length, icon: 'M12 14l9-5-9-5-9 5 9 5z', color: 'var(--success)' },
            { label: 'Staff Members', value: users.filter(u => u.role === 'staff').length, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'var(--warning)' },
          ].map((stat, idx) => (
            <div key={idx} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, background: 'var(--primary-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <svg width="24" height="24" fill="none" stroke={stat.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</p>
                  <p style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700 }}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <div className="controls-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by name, register number, or staff ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={inputStyle}
                />
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={selectStyle}>
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
              </select>
              <button
                onClick={() => router.push('/admin/settings')}
                style={buttonPrimaryStyle}
                onMouseOver={(e) => e.target.style.background = 'var(--btn-primary-hover-bg)'}
                onMouseOut={(e) => e.target.style.background = 'var(--btn-primary-bg)'}
              >
                Admin Settings
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 16, width: '60%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '40%', background: 'var(--surface-2)', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 10, width: '50%', background: 'var(--surface-2)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <svg width="48" height="48" fill="none" stroke="var(--text-dim)" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No users found</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {searchQuery ? 'Try adjusting your search query' : 'No users in the system yet'}
            </p>
          </div>
        ) : (
          <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredUsers.map((user) => {
              const isStudent = user.role === 'student';
              const { bg, border, glow } = getRoleCardStyle(user.role);
              const handleCardClick = () => {
                if (isStudent && user.registerNumber) {
                  router.push(`/profile/${user.registerNumber}`);
                }
              };
              return (
                <div
                  key={user._id}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    padding: '1rem',
                    cursor: isStudent ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                  onClick={handleCardClick}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${glow}`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {user.role === 'student' ? user.registerNumber : user.staffId}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        background: user.role === 'student' ? 'var(--success-soft)' : user.role === 'staff' ? 'var(--warning-soft, rgba(212,160,23,0.1))' : 'var(--primary-soft)',
                        color: user.role === 'student' ? 'var(--success)' : user.role === 'staff' ? 'var(--warning)' : 'var(--primary)',
                        border: `1px solid ${user.role === 'student' ? 'var(--success-soft-border)' : user.role === 'staff' ? 'var(--warning-soft-border, rgba(212,160,23,0.2))' : 'var(--primary-soft-border)'}`,
                      }}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 12 }}>
                    {user.department && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Dept:</span> {user.department}
                      </div>
                    )}
                    {user.batchYear && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Batch:</span> {user.batchYear}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                    Joined: {formatDate(user.createdAt)}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user._id);
                      }}
                      style={{ color: 'var(--danger)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseOver={(e) => e.target.style.color = 'var(--danger-hover)'}
                      onMouseOut={(e) => e.target.style.color = 'var(--danger)'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          <p>Showing {filteredUsers.length} of {users.length - 1} users (excluding yourself)</p>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{ ...buttonSecondaryStyle, padding: '6px 14px' }}
            onMouseOver={(e) => { if (!loading) e.target.style.background = 'var(--surface-2)'; }}
            onMouseOut={(e) => { if (!loading) e.target.style.background = 'transparent'; }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {AlertComponent}
    </div>
  );
}