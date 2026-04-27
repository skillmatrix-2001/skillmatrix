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
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <style jsx>{`
        .auth-card {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
        }
        .auth-title {
          color: var(--text-primary);
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          color: var(--text-dim);
          font-size: 14px;
        }
        .input-label {
          display: block;
          color: var(--text-dim);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .auth-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--input-text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .auth-input:focus {
          border-color: var(--input-focus-border);
        }
        .auth-input::placeholder {
          color: var(--input-placeholder);
        }
        .auth-select {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--input-text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
          cursor: pointer;
        }
        .auth-select:focus {
          border-color: var(--input-focus-border);
        }
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          color: var(--text-dim);
        }
        .password-toggle:hover {
          color: var(--text-secondary);
        }
        .submit-btn {
          width: 100%;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--btn-primary-hover-bg);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-box {
          background: var(--danger-soft);
          border: 1px solid var(--danger);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--danger);
          font-size: 14px;
        }
      `}</style>

      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-subtitle">
            Or{' '}
            <Link href="/register" style={{ color: 'var(--link)' }}>
              register as a student
            </Link>
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <div>
              <label className="input-label">I am a</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="auth-select"
                required
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="input-label">
                {formData.role === 'student' ? 'Register Number' : formData.role === 'staff' ? 'Staff ID' : 'Username'}
              </label>
              <input
                name="identifier"
                type="text"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder={formData.role === 'student' ? '9513xxxxxx' : formData.role === 'staff' ? 'STAFF123' : 'admin'}
                className="auth-input"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
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
              className="submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Forgot password link with inline color */}
            <div style={{ textAlign: 'center', color: 'var(--link)' }}>
              <Link href="/forgot-password" style={{ color: 'inherit', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}