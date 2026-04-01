"use client";

import { useState, useEffect } from 'react';
import UserTile from '@/components/ui/UserTile';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();

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
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const adminUser = JSON.parse(localStorage.getItem('user'));
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
          alert('User deleted successfully');
        } else {
          alert(data.error || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.registerNumber && user.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.staffId && user.staffId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

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
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const selectStyle = {
    width: '100%',
    background: '#0B0D12',
    border: '1px solid #222634',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#E5E7EB',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .controls-row { flex-direction: column; align-items: stretch !important; }
          .users-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Manage all users, staff accounts, and departments</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: users.length, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: '#7C5CFF' },
            { label: 'Students', value: users.filter(u => u.role === 'student').length, icon: 'M12 14l9-5-9-5-9 5 9 5z', color: '#22C55E' },
            { label: 'Staff Members', value: users.filter(u => u.role === 'staff').length, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: '#F59E0B' },
          ].map((stat, idx) => (
            <div key={idx} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, background: 'rgba(124,92,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <svg width="24" height="24" fill="none" stroke={stat.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{stat.label}</p>
                  <p style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700 }}>{stat.value}</p>
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
                <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                style={{ ...buttonPrimaryStyle, background: '#7C5CFF' }}
                onMouseOver={(e) => e.target.style.background = '#6d4fe0'}
                onMouseOut={(e) => e.target.style.background = '#7C5CFF'}
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
              <div key={i} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, padding: '1.5rem', animation: 'pulse 1.5s infinite' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#171B24' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, width: '70%', background: '#171B24', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '50%', background: '#171B24', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ height: 12, width: '80%', background: '#171B24', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '60%', background: '#171B24', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#12151C', border: '1px solid #222634', borderRadius: 16 }}>
            <svg width="48" height="48" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No users found</h3>
            <p style={{ color: '#6B7280', fontSize: 14 }}>
              {searchQuery ? 'Try adjusting your search query' : 'No users in the system yet'}
            </p>
          </div>
        ) : (
          <div className="users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredUsers.map((user) => (
              <div key={user._id} style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, overflow: 'hidden' }}>
                <UserTile user={user} />
                <div style={{ padding: '1rem', borderTop: '1px solid #222634', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                    background: user.role === 'student' ? 'rgba(34,197,94,0.1)' : user.role === 'staff' ? 'rgba(245,158,11,0.1)' : 'rgba(124,92,255,0.1)',
                    color: user.role === 'student' ? '#4ADE80' : user.role === 'staff' ? '#F59E0B' : '#7C5CFF',
                    border: `1px solid ${user.role === 'student' ? 'rgba(34,197,94,0.2)' : user.role === 'staff' ? 'rgba(245,158,11,0.2)' : 'rgba(124,92,255,0.2)'}`,
                  }}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    style={{ color: '#EF4444', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.target.style.color = '#ff6b6b'}
                    onMouseOut={(e) => e.target.style.color = '#EF4444'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: 13 }}>
          <p>Showing {filteredUsers.length} of {users.length} users</p>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{ ...buttonSecondaryStyle, padding: '6px 14px' }}
            onMouseOver={(e) => { if (!loading) e.target.style.background = '#171B24'; }}
            onMouseOut={(e) => { if (!loading) e.target.style.background = 'transparent'; }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}