"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('request');
  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    role: 'student',
  });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.identifier.trim()) {
      setError(formData.role === 'student' ? 'Register Number is required' : 'Staff ID is required');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('OTP sent to your registered email address! Please check your inbox.');
        setStep('verify');
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          otp: otp,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: '#0B0D12', border: '1px solid #222634',
    borderRadius: 8, padding: '10px 14px', color: '#E5E7EB', fontSize: 14,
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const passwordContainerStyle = {
    position: 'relative',
    width: '100%'
  };

  const eyeButtonStyle = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, display: 'flex', alignItems: 'center',
    color: '#6B7280'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Forgot Password</h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            Or{' '}
            <Link href="/login" style={{ color: '#7C5CFF', textDecoration: 'none' }}>
              back to login
            </Link>
          </p>
        </div>

        <div style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 16, padding: '2rem' }}>
          {step === 'request' ? (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#F87171', fontSize: 14 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', color: '#10B981', fontSize: 14 }}>
                  {success}
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>I am a *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                  {formData.role === 'student' ? 'Register Number *' : 'Staff ID *'}
                </label>
                <input
                  name="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder={formData.role === 'student' ? '9513xxxxxx' : 'STAFF123'}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Registered Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>Must match the email registered with your account</p>
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
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#F87171', fontSize: 14 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', color: '#10B981', fontSize: 14 }}>
                  {success}
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Enter OTP *</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  style={{ ...inputStyle, textAlign: 'center', fontSize: 20, letterSpacing: 4 }}
                />
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                  OTP sent to {formData.email} — valid for 10 minutes
                </p>
              </div>

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>New Password *</label>
                <div style={passwordContainerStyle}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={eyeButtonStyle}>
                    {showNewPassword ? (
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
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>Minimum 6 characters</p>
              </div>

              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Confirm Password *</label>
                <div style={passwordContainerStyle}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeButtonStyle}>
                    {showConfirmPassword ? (
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

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep('request'); setError(''); setSuccess(''); setOtp(''); }}
                  style={{
                    flex: 1, background: 'transparent', border: '1px solid #222634',
                    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit',
                    color: '#9CA3AF'
                  }}
                  onMouseOver={(e) => (e.target.style.background = '#171B24')}
                  onMouseOut={(e) => (e.target.style.background = 'transparent')}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1, background: '#7C5CFF', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit'
                  }}
                  onMouseOver={(e) => (e.target.style.background = '#6d4fe0')}
                  onMouseOut={(e) => (e.target.style.background = '#7C5CFF')}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}