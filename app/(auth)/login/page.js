"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('authChange'));

        if (data.user.role === 'student') {
          router.push('/feed');
        } else if (data.user.role === 'staff') {
          router.push('/staff');
        } else if (data.user.role === 'admin') {
          router.push('/admin');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Sign in</h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            Or{' '}
            <Link href="/register" style={{ color: '#7C5CFF', textDecoration: 'none' }}>
              register as a student
            </Link>
          </p>
        </div>

        <div style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 16, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#F87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>I am a</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%', background: '#0B0D12', border: '1px solid #222634',
                  borderRadius: 8, padding: '10px 14px', color: '#E5E7EB', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  fontFamily: 'inherit', cursor: 'pointer'
                }}
                required
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                {formData.role === 'student' ? 'Register Number' : formData.role === 'staff' ? 'Staff ID' : 'Username'}
              </label>
              <input
                name="identifier"
                type="text"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder={formData.role === 'student' ? '9513xxxxxx' : formData.role === 'staff' ? 'STAFF123' : 'admin'}
                style={{
                  width: '100%', background: '#0B0D12', border: '1px solid #222634',
                  borderRadius: 8, padding: '10px 14px', color: '#E5E7EB', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{
                    width: '100%', background: '#0B0D12', border: '1px solid #222634',
                    borderRadius: 8, padding: '10px 14px', paddingRight: '40px',
                    color: '#E5E7EB', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, display: 'flex', alignItems: 'center',
                    color: '#6B7280'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#7C5CFF', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit'
              }}
              onMouseOver={(e) => (e.target.style.background = '#6d4fe0')}
              onMouseOut={(e) => (e.target.style.background = '#7C5CFF')}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/forgot-password" style={{ color: '#7C5CFF', fontSize: 14, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}