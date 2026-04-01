"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef(null);

  const refreshUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEmail(parsedUser.email || '');
      } catch {}
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    const handleStorageChange = (e) => { if (e.key === 'user') refreshUser(); };
    const handleAuthChange = () => refreshUser();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setShowUserMenu(false);
    window.dispatchEvent(new Event('authChange'));
    router.push('/login');
  };

  const handleJobsClick = () => {
    if (pathname === '/feed') {
      window.dispatchEvent(new CustomEvent('openJobs'));
    } else {
      router.push('/feed?jobs=true');
    }
    setShowUserMenu(false);
  };

  const handleUpdateEmail = async () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const identifier = user.staffId || user.registerNumber;
      const response = await fetch('/api/staff/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: user.role === 'staff' ? user.staffId : identifier, email }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = { ...user, email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Email updated!');
        setTimeout(() => { setShowEmailModal(false); setSuccess(''); setError(''); }, 1500);
      } else {
        setError(data.error || 'Failed to update email');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const isActive = (href) => pathname === href;

  const navLinks = user ? [
    { href: '/feed', label: 'Feed', show: true },
    { href: null, label: 'Jobs', show: user.role === 'student', onClick: handleJobsClick },
    { href: user.role === 'staff' ? '/staff' : '/admin', label: 'Dashboard', show: user.role === 'staff' || user.role === 'admin' },
    { href: `/profile/${user.registerNumber}`, label: 'Profile', show: user.role === 'student' },
  ].filter(l => l.show) : [];

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(11,13,18,0.92); backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid #222634;
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 1.25rem;
          height: 56px; display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0;
        }
        .nav-logo-icon {
          width: 28px; height: 28px; background: #7C5CFF; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #fff; letter-spacing: -0.02em;
        }
        .nav-logo-text {
          font-size: 15px; font-weight: 700; color: #E5E7EB; letter-spacing: -0.02em;
        }
        .nav-links {
          display: flex; align-items: center; gap: 2px;
        }
        .nav-link {
          padding: 6px 12px; border-radius: 7px; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.15s; color: #9CA3AF;
          background: none; border: none; cursor: pointer; font-family: inherit;
          letter-spacing: 0.01em; white-space: nowrap;
        }
        .nav-link:hover { color: #E5E7EB; background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #E5E7EB; background: rgba(124,92,255,0.12); }
        .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .nav-avatar-btn {
          display: flex; align-items: center; gap: 7px;
          background: #171B24; border: 1px solid #222634; border-radius: 9px;
          padding: 5px 10px 5px 5px; cursor: pointer; transition: border-color 0.15s; flex-shrink: 0;
        }
        .nav-avatar-btn:hover { border-color: rgba(124,92,255,0.5); }
        .nav-avatar {
          width: 24px; height: 24px; border-radius: 6px;
          background: rgba(124,92,255,0.2); border: 1px solid rgba(124,92,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #7C5CFF; flex-shrink: 0;
        }
        .nav-username {
          font-size: 13px; font-weight: 500; color: #E5E7EB;
          max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .nav-role-badge {
          font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500;
          background: rgba(124,92,255,0.1); color: #a78bfa;
          border: 1px solid rgba(124,92,255,0.18); letter-spacing: 0.04em;
          text-transform: uppercase; white-space: nowrap;
        }
        .nav-chevron { transition: transform 0.2s; }
        .nav-chevron.open { transform: rotate(180deg); }
        .nav-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #12151C; border: 1px solid #222634; border-radius: 12px;
          min-width: 196px; padding: 5px; box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          animation: dropIn 0.12s ease;
        }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-item {
          display: flex; align-items: center; gap: 9px; width: 100%;
          padding: 8px 10px; border-radius: 7px; background: none; border: none;
          cursor: pointer; color: #9CA3AF; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.12s; font-family: inherit;
          letter-spacing: 0.01em; text-align: left; box-sizing: border-box;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.04); color: #E5E7EB; }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.07); color: #EF4444; }
        .dropdown-divider { height: 1px; background: #222634; margin: 4px 0; }
        .auth-link {
          padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.15s; letter-spacing: 0.01em; white-space: nowrap;
        }
        .auth-link-ghost { color: #9CA3AF; }
        .auth-link-ghost:hover { color: #E5E7EB; background: rgba(255,255,255,0.05); }
        .auth-link-primary { background: #7C5CFF; color: #fff; }
        .auth-link-primary:hover { background: #6d4fe0; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          backdrop-filter: blur(10px);
        }
        .modal-box {
          background: #12151C; border: 1px solid #222634; border-radius: 16px;
          max-width: 400px; width: 100%; overflow: hidden;
        }
        .modal-input {
          width: 100%; background: #0B0D12; border: 1px solid #222634; border-radius: 8px;
          padding: 10px 14px; color: #E5E7EB; font-size: 14px; outline: none;
          transition: border-color 0.2s; box-sizing: border-box; font-family: inherit;
        }
        .modal-input:focus { border-color: #7C5CFF; }
        .modal-input::placeholder { color: #6B7280; }
        .modal-input:disabled { color: #6B7280; cursor: not-allowed; }
        .modal-btn-primary {
          background: #7C5CFF; color: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
        }
        .modal-btn-primary:hover:not(:disabled) { background: #6d4fe0; }
        .modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-btn-ghost {
          background: transparent; color: #9CA3AF; border: 1px solid #222634;
          border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .modal-btn-ghost:hover { border-color: #9CA3AF; color: #E5E7EB; }

        @media (max-width: 640px) {
          .nav-links { display: none; }
          .nav-username { display: none; }
          .nav-role-badge { display: none; }
          .mobile-only { display: block !important; }
        }
        .mobile-only { display: none; }
      `}</style>

      <nav className="nav-root">
        <div className="nav-inner">

          {/* Logo */}
          <Link href={user ? '/feed' : '/'} className="nav-logo">
            <div className="nav-logo-icon">[s]</div>
            <span className="nav-logo-text">SkillMatrix</span>
          </Link>

          {/* Nav links — desktop */}
          {user && (
            <div className="nav-links">
              {navLinks.map((link) =>
                link.onClick ? (
                  <button key={link.label} onClick={link.onClick} className="nav-link">
                    {link.label}
                  </button>
                ) : (
                  <Link key={link.label} href={link.href} className={`nav-link${isActive(link.href) ? ' active' : ''}`}>
                    {link.label}
                  </Link>
                )
              )}
            </div>
          )}

          {/* Right side */}
          <div className="nav-right">
            {user ? (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button className="nav-avatar-btn" onClick={() => setShowUserMenu(v => !v)}>
                  <div className="nav-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="nav-username">{user.name}</span>
                  <span className="nav-role-badge">{user.role}</span>
                  <svg className={`nav-chevron${showUserMenu ? ' open' : ''}`} width="11" height="11" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ marginLeft: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="nav-dropdown">
                    {/* Mobile: nav links */}
                    <div className="mobile-only">
                      {navLinks.map((link) =>
                        link.onClick ? (
                          <button key={link.label} onClick={() => { link.onClick(); setShowUserMenu(false); }} className="dropdown-item">
                            {link.label}
                          </button>
                        ) : (
                          <Link key={link.label} href={link.href} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                            {link.label}
                          </Link>
                        )
                      )}
                      <div className="dropdown-divider" />
                    </div>

                    {/* Profile */}
                    {user.role === 'student' && (
                      <Link href={`/profile/${user.registerNumber}`} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        My Profile
                      </Link>
                    )}

                    {/* Staff email update */}
                    {user.role === 'staff' && (
                      <button className="dropdown-item" onClick={() => { setShowEmailModal(true); setShowUserMenu(false); }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        Update Email
                        {!user.email && (
                          <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                        )}
                      </button>
                    )}

                    <div className="dropdown-divider" />

                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link href="/login" className="auth-link auth-link-ghost">Login</Link>
                <Link href="/register" className="auth-link auth-link-primary">Register</Link>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #222634' }}>
              <h2 style={{ color: '#E5E7EB', fontSize: 15, fontWeight: 600, margin: 0 }}>Update Email</h2>
              <button
                onClick={() => { setShowEmailModal(false); setError(''); setSuccess(''); setEmail(user?.email || ''); }}
                style={{ background: '#171B24', border: '1px solid #222634', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#9CA3AF', lineHeight: 0 }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Current Email</label>
                <input type="email" value={user?.email || 'Not set'} disabled className="modal-input" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>New Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@college.edu" className="modal-input" />
                <p style={{ color: '#6B7280', fontSize: 12, marginTop: 6, marginBottom: 0 }}>Used for password recovery.</p>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                  <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                  <p style={{ color: '#22C55E', fontSize: 13, margin: 0 }}>{success}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid #222634' }}>
              <button onClick={() => { setShowEmailModal(false); setError(''); setSuccess(''); setEmail(user?.email || ''); }} className="modal-btn-ghost">Cancel</button>
              <button onClick={handleUpdateEmail} disabled={loading} className="modal-btn-primary">
                {loading ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}