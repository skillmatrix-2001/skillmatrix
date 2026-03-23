"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcut (Ctrl + \)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && e.target.closest('.search-modal-content') === null) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults = [
        {
          _id: '1',
          name: 'Alice Johnson',
          registerNumber: '951321001',
          department: 'Computer Science',
          role: 'student',
          profile: { profilePic: '' }
        },
        {
          _id: '2',
          name: 'Bob Smith',
          registerNumber: '951321002',
          department: 'Electronics',
          role: 'student',
          profile: { profilePic: '' }
        },
        {
          _id: '3',
          name: 'Carol Davis',
          registerNumber: '951321003',
          department: 'Information Technology',
          role: 'student',
          profile: { profilePic: '' }
        },
        {
          _id: '4',
          name: 'Dr. Robert Chen',
          staffId: 'STAFF001',
          department: 'Computer Science',
          role: 'staff',
          profile: { profilePic: '' }
        }
      ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.registerNumber && item.registerNumber.includes(query)) ||
        (item.staffId && item.staffId.includes(query))
      ).slice(0, 5);
      
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      const debounceTimer = setTimeout(handleSearch, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleResultClick = (result) => {
    if (result.role === 'student') {
      router.push(`/profile/${result.registerNumber}`);
    } else if (result.role === 'staff') {
      // For staff, we could show a different view or modal
      alert(`Staff profile: ${result.name}`);
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm">Search (Ctrl + \)</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 px-4">
          <div className="search-modal-content bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-fadeIn">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, register number, or staff ID..."
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span>Press Esc to close • Enter to select</span>
                <span className="ml-auto">Ctrl + \ to open</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <p className="mt-2 text-gray-600">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {result.profile?.profilePic && result.profile.profilePic !== '/placeholder.png' ? (
                            <img 
                              src={result.profile.profilePic} 
                              alt={result.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {result.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900 truncate">{result.name}</h3>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            result.role === 'student' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {result.role.charAt(0).toUpperCase() + result.role.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {result.registerNumber || result.staffId}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{result.department}</p>
                      </div>
                      
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">No results found for "{query}"</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try searching by name, register number, or staff ID
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-600">Start typing to search</p>
                  <div className="mt-4 text-sm text-gray-500 space-y-1">
                    <p>• Search by student name or register number</p>
                    <p>• Search by staff name or ID</p>
                    <p>• Use Ctrl + \ to open this search anytime</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    router.push('/feed');
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to Feed
                </button>
                <button
                  onClick={() => {
                    const userData = localStorage.getItem('user');
                    if (userData) {
                      const user = JSON.parse(userData);
                      if (user.registerNumber) {
                        router.push(`/profile/${user.registerNumber}`);
                      } else if (user.staffId) {
                        alert('Staff profile view coming soon');
                      }
                    }
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}