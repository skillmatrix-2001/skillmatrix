"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    registerNumber: '',
    name: '',
    email: '',
    dob: '',
    batchYear: new Date().getFullYear(),
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dobError, setDobError] = useState('');

  const generateBatchYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  useEffect(() => {
    fetchDepartments();
    const interval = setInterval(() => {
      const newYear = new Date().getFullYear();
      if (newYear !== currentYear) {
        setCurrentYear(newYear);
        setFormData(prev => ({ ...prev, batchYear: newYear }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/depts');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, department: data[0].name }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateDOB = (dob) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) {
      setDobError('Please enter a valid date');
      return false;
    }
    if (birthDate > today) {
      setDobError('Date of birth cannot be in the future');
      return false;
    }
    const age = calculateAge(dob);
    if (age < 17) {
      setDobError(`⚠️ You must be at least 17 years old to register. Your age: ${age} years`);
      return false;
    }
    if (age > 60) {
      setDobError(`⚠️ Age must be between 17 and 60 years. Your age: ${age} years`);
      return false;
    }
    setDobError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'dob') validateDOB(value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^\d{12}$/.test(formData.registerNumber)) {
      setError('Register number must be exactly 12 digits');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (!validateDOB(formData.dob)) {
      setError(dobError || 'Invalid date of birth. You must be at least 17 years old.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 16, padding: '2rem' }}>
            <div style={{ color: '#7C5CFF', marginBottom: '1.5rem' }}>
              <svg style={{ width: 64, height: 64, margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ color: '#E5E7EB', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Registration Successful!</h3>
            <p style={{ color: '#9CA3AF', marginBottom: 24 }}>You will be redirected to login page shortly.</p>
            <Link href="/login" style={{ display: 'inline-block', background: '#7C5CFF', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#E5E7EB', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Student Registration</h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            Or{' '}
            <Link href="/login" style={{ color: '#7C5CFF', textDecoration: 'none' }}>
              sign in to your account
            </Link>
          </p>
        </div>

        <div style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 16, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#F87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Register Number * (12 digits)</label>
              <input
                name="registerNumber"
                type="text"
                required
                value={formData.registerNumber}
                onChange={handleChange}
                placeholder="951321001234"
                maxLength={12}
                style={inputStyle}
              />
              <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>Exactly 12 digits (e.g., 951321001234)</p>
            </div>

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Full Name *</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Email Address *</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                style={inputStyle}
              />
              <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>We'll send important notifications to this email</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Date of Birth *</label>
                <input
                  name="dob"
                  type="date"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  style={{ ...inputStyle, borderColor: dobError ? '#EF4444' : '#222634' }}
                />
                {dobError && <p style={{ color: '#F87171', fontSize: 11, marginTop: 4 }}>{dobError}</p>}
                {!dobError && formData.dob && (
                  <p style={{ color: '#10B981', fontSize: 11, marginTop: 4 }}>✓ Age: {calculateAge(formData.dob)} years</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Batch Year *</label>
                <select
                  name="batchYear"
                  value={formData.batchYear}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  required
                >
                  {generateBatchYears().map(year => (
                    <option key={year} value={year}>{year} {year === new Date().getFullYear() ? '(Current Year)' : ''}</option>
                  ))}
                </select>
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>Your joining batch year (automatically updates each year)</p>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Department *</label>
              {departments.length === 0 ? (
                <>
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, color: '#F59E0B', fontSize: 13 }}>
                    ⚠️ No departments available yet. Please contact administrator.
                  </div>
                  <select disabled style={{ ...inputStyle, background: '#171B24', color: '#6B7280', cursor: 'not-allowed' }}>
                    <option>No departments available</option>
                  </select>
                  <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                    Admin must create departments first. <Link href="/login" style={{ color: '#7C5CFF' }}>Login as admin</Link>
                  </p>
                </>
              ) : (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  required
                >
                  {departments.map(dept => (
                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Password *</label>
                <div style={passwordContainerStyle}>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
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
              <div>
                <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Confirm Password *</label>
                <div style={passwordContainerStyle}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
            </div>

            <button
              type="submit"
              disabled={loading || departments.length === 0}
              style={{
                width: '100%', background: '#7C5CFF', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit',
                marginTop: '0.5rem'
              }}
              onMouseOver={(e) => (e.target.style.background = '#6d4fe0')}
              onMouseOut={(e) => (e.target.style.background = '#7C5CFF')}
            >
              {loading ? 'Registering...' : 'Register as Student'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}