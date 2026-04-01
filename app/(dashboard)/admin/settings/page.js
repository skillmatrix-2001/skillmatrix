"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ColorPicker from '@/components/ui/ColorPicker';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', color: '#7C5CFF' });
  const [staffForm, setStaffForm] = useState({
    name: '',
    department: '',
    username: '',
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
        if (data.length > 0) {
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
      alert('Department name is required');
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
        alert('Department created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create department');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    if (!adminUser) return;
    try {
      const response = await fetch(`/api/depts?id=${deptId}&userId=${adminUser._id}&role=${adminUser.role}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchDepartments();
        alert('Department deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete department');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (staffForm.password !== staffForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (staffForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (!staffForm.staffId.trim()) {
      alert('Staff ID is required');
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
          ...staffForm,
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
          username: '',
          staffId: '',
          password: '',
          confirmPassword: '',
        });
        alert('Staff account created successfully!');
      } else {
        alert(data.error || 'Failed to create staff account');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff account? This action cannot be undone.')) return;
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
        alert('Staff account deleted successfully');
      } else {
        alert(data.error || 'Failed to delete staff account');
      }
    } catch (error) {
      alert('Network error. Please try again.');
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

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .settings-header { flex-direction: column; align-items: stretch !important; }
          .dept-grid { grid-template-columns: 1fr !important; }
          .staff-table-container { overflow-x: auto; }
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Create Department Form */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>Create New Department</h2>
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
                </div>

                {/* Departments List */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>All Departments</h2>
                  {departments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#0B0D12', borderRadius: 12, border: '1px solid #222634' }}>
                      <p style={{ color: '#6B7280' }}>No departments yet. Create your first department above.</p>
                    </div>
                  ) : (
                    <div className="dept-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {departments.map((dept) => (
                        <div key={dept._id} style={{ background: '#0B0D12', border: '1px solid #222634', borderRadius: 12, padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 12, height: 12, borderRadius: 999, background: dept.color }} />
                              <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{dept.name}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteDept(dept._id)}
                              style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
                              onMouseOver={(e) => e.target.style.color = '#ff6b6b'}
                              onMouseOut={(e) => e.target.style.color = '#EF4444'}
                            >
                              Delete
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>ID: {dept._id.substring(0, 8)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Create Staff Form */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>Create Staff Account</h2>
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
                        <label style={{ display: 'block', color: '#6B7280', fontSize: 12, marginBottom: 6 }}>Username *</label>
                        <input
                          type="text"
                          value={staffForm.username}
                          onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                          style={inputStyle}
                          placeholder="e.g., r.chen"
                          required
                        />
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
                </div>

                {/* Staff List */}
                <div>
                  <h2 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>All Staff Accounts</h2>
                  {staffList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#0B0D12', borderRadius: 12, border: '1px solid #222634' }}>
                      <p style={{ color: '#6B7280' }}>No staff accounts created yet.</p>
                    </div>
                  ) : (
                    <div className="staff-table-container" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0B0D12', borderRadius: 12, overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #222634', background: '#171B24' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontSize: 12, fontWeight: 500 }}>Staff Info</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontSize: 12, fontWeight: 500 }}>Department</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontSize: 12, fontWeight: 500 }}>Created</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontSize: 12, fontWeight: 500 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffList.map((staff) => {
                            const deptColor = departments.find(d => d.name === staff.department)?.color || '#7C5CFF';
                            return (
                              <tr key={staff._id} style={{ borderBottom: '1px solid #222634' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  <div>
                                    <div style={{ color: '#E5E7EB', fontWeight: 500 }}>{staff.name}</div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {staff.staffId} • @{staff.username}</div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: deptColor }} />
                                    <span style={{ color: '#E5E7EB', fontSize: 13 }}>{staff.department}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 13 }}>
                                  {new Date(staff.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button
                                    onClick={() => handleDeleteStaff(staff._id)}
                                    style={{ color: '#EF4444', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
                                    onMouseOver={(e) => e.target.style.color = '#ff6b6b'}
                                    onMouseOut={(e) => e.target.style.color = '#EF4444'}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}