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
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dobError, setDobError] = useState('');

  // Generate batch years (current year to 10 years back)
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
    
    // Update batch year when year changes (optional: add listener for year change)
    const interval = setInterval(() => {
      const newYear = new Date().getFullYear();
      if (newYear !== currentYear) {
        setCurrentYear(newYear);
        setFormData(prev => ({ ...prev, batchYear: newYear }));
      }
    }, 60000); // Check every minute
    
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

  // Function to calculate age from date of birth
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

  // Validate date of birth
  const validateDOB = (dob) => {
    if (!dob) return false;
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      setDobError('Please enter a valid date');
      return false;
    }
    
    // Check if date is not in the future
    if (birthDate > today) {
      setDobError('Date of birth cannot be in the future');
      return false;
    }
    
    const age = calculateAge(dob);
    
    // Check if age is at least 17 years
    if (age < 17) {
      setDobError(`⚠️ You must be at least 17 years old to register. Your age: ${age} years`);
      return false;
    }
    
    // Optional: Add maximum age limit (60 years)
    if (age > 60) {
      setDobError(`⚠️ Age must be between 17 and 60 years. Your age: ${age} years`);
      return false;
    }
    
    setDobError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Validate DOB when it changes
    if (name === 'dob') {
      validateDOB(value);
    }
    
    // Clear general error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate register number (12 digits)
    if (!/^\d{12}$/.test(formData.registerNumber)) {
      setError('Register number must be exactly 12 digits');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate DOB (must be at least 17 years)
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
        setTimeout(() => {
          router.push('/login');
        }, 2000);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="text-emerald-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 mb-6">You will be redirected to login page shortly.</p>
            <Link
              href="/login"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              sign in to your account
            </Link>
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="registerNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Register Number * (12 digits)
              </label>
              <input
                id="registerNumber"
                name="registerNumber"
                type="text"
                required
                value={formData.registerNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="951321001234"
                pattern="\d{12}"
                maxLength="12"
                title="Must be exactly 12 digits"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exactly 12 digits (e.g., 951321001234)
              </p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send important notifications to this email
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    dobError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {dobError && (
                  <p className="text-xs text-red-600 mt-1">{dobError}</p>
                )}
                {!dobError && formData.dob && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Age: {calculateAge(formData.dob)} years
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  You must be at least 17 years old to register
                </p>
              </div>
              
              <div>
                <label htmlFor="batchYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Year *
                </label>
                <select
                  id="batchYear"
                  name="batchYear"
                  required
                  value={formData.batchYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {generateBatchYears().map(year => (
                    <option key={year} value={year}>
                      {year} {year === new Date().getFullYear() ? '(Current Year)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Your joining batch year (automatically updates each year)
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              {departments.length === 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No departments available yet. Please contact administrator.
                    </p>
                  </div>
                  <select
                    id="department"
                    name="department"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  >
                    <option value="">No departments available</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Admin must create departments first. 
                    <a href="/login" className="text-emerald-600 hover:text-emerald-700 ml-1">
                      Login as admin
                    </a>
                  </p>
                </div>
              ) : (
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || departments.length === 0}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Registering...' : 'Register as Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}