"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setEmail(parsedUser.email || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const handleJobsClick = () => {
    if (window.location.pathname === '/feed') {
      window.dispatchEvent(new CustomEvent('openJobs'));
    } else {
      router.push('/feed?jobs=true');
    }
  };

  const handleUpdateEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const identifier = user.staffId || user.registerNumber;
      const response = await fetch('/api/staff/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId: user.role === 'staff' ? user.staffId : identifier,
          email 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local storage
        const updatedUser = { ...user, email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Email updated successfully!');
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setShowEmailModal(false);
          setSuccess('');
          setError('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={user ? "/feed" : "/"} className="flex items-center">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">SM</span>
                </div>
                <span className="text-xl font-bold text-gray-900">SkillMatrix</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-4">
                    {user.role === 'student' && (
                      <Link href="/feed" className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium">
                        Feed
                      </Link>
                    )}
                    {user.role === 'student' && (
                      <button
                        onClick={handleJobsClick}
                        className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium"
                      >
                        💼 Jobs
                      </button>
                    )}
                    {user.role === 'staff' && (
                      <Link href="/staff" className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium">
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin" className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium">
                        Admin
                      </Link>
                    )}
                    <Link href={`/profile/${user.registerNumber || user.staffId}`} className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium">
                      Profile
                    </Link>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 hidden md:inline">
                      {user.name} ({user.role})
                    </span>
                    
                    {/* Email Icon Button - Only for staff */}
                    {user.role === 'staff' && (
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="relative group"
                        title="Update Email"
                      >
                        <svg 
                          className="w-5 h-5 text-gray-500 hover:text-emerald-600 transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {!user.email && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium">
                    Login
                  </Link>
                  <Link href="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Email Update Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Update Email Address</h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setError('');
                  setSuccess('');
                  setEmail(user?.email || '');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user?.email || 'Not set'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@college.edu"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used for password recovery
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setError('');
                  setSuccess('');
                  setEmail(user?.email || '');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmail}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}