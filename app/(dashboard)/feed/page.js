"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JobsFeed from '@/components/JobsFeed';

function FeedContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showJobs, setShowJobs] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobsSectionRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchPosts();
      } catch (err) {
        console.error('Error parsing user data:', err);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('jobs') === 'true') {
      setShowJobs(true);
    }
  }, [searchParams]);

  // Listen for navbar Jobs button click when already on feed page
  useEffect(() => {
    const handler = () => {
      setShowJobs(true);
      setTimeout(() => {
        jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
    window.addEventListener('openJobs', handler);
    return () => window.removeEventListener('openJobs', handler);
  }, []);

  // Scroll to jobs section when showJobs becomes true
  useEffect(() => {
    if (showJobs && jobsSectionRef.current) {
      setTimeout(() => {
        jobsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showJobs]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/posts', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        setError(data.error || 'Failed to load posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 60) return `${diffMins}m ago`;
      else if (diffHours < 24) return `${diffHours}h ago`;
      else if (diffDays < 7) return `${diffDays}d ago`;
      else return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  const handleUserClick = (registerNumber) => {
    router.push(`/profile/${registerNumber}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Feed</h1>
              <p className="text-gray-600">Latest certificates and projects from students</p>
            </div>
            {!showJobs && (
              <button
                onClick={() => setShowJobs(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium transition-colors"
              >
                💼 Job Updates
              </button>
            )}
          </div>
        </div>

        {/* Jobs Section */}
        {showJobs && (
          <div
            ref={jobsSectionRef}
            className="bg-white rounded-xl border border-gray-200 mb-6 scroll-mt-4"
          >
            <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">💼 Job Updates</h2>
              <button
                onClick={() => setShowJobs(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6">
              <JobsFeed />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">No student activities found. Students will appear here when they upload content.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleUserClick(post.owner?.registerNumber)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                        {post.owner?.profile?.profilePic && post.owner.profile.profilePic !== '/placeholder.png' ? (
                          <img
                            src={post.owner.profile.profilePic}
                            alt={post.owner.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<span class="text-gray-600 font-bold text-lg">${post.owner?.name?.charAt(0).toUpperCase() || 'U'}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 font-bold text-lg">
                            {post.owner?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-black">
                          {post.owner?.name || 'Unknown User'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{post.owner?.registerNumber}</span>
                          <span className="text-xs text-gray-400">•</span>
                          {post.owner?.batchYear && (
                            <>
                              <span className="text-sm text-gray-500">Batch {post.owner.batchYear}</span>
                              <span className="text-xs text-gray-400">•</span>
                            </>
                          )}
                          {post.owner?.department && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                              {post.owner.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                        post.type === 'certificate'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {post.type === 'certificate' ? '📜 Certificate' : '🚀 Project'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(post.createdAt || post.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {post.title && (
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                  )}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{post.description}</p>
                  </div>

                  {post.type === 'project' && post.techStack && post.techStack.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Technologies used:</p>
                      <div className="flex flex-wrap gap-2">
                        {post.techStack.map((tech, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {post.type === 'certificate' && post.issuedBy && (
                    <div className="mb-4 text-sm text-gray-600">
                      <span className="font-medium">Issued by:</span> {post.issuedBy}
                    </div>
                  )}

                  {post.media && post.media.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-50">
                      {post.media[0]?.type === 'video' ? (
                        <div className="relative aspect-video">
                          <video src={post.media[0].url} controls className="w-full h-full object-contain bg-black" />
                        </div>
                      ) : (
                        <img
                          src={post.media[0].url}
                          alt={post.title || 'Post media'}
                          className="w-full max-h-[400px] object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            parent.innerHTML = `<div class="w-full h-48 flex items-center justify-center bg-gray-100"><div class="text-center"><svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p class="text-sm text-gray-500">Media not available</p></div></div>`;
                          }}
                        />
                      )}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {post.type === 'project' && (post.githubLink || post.demoLink) && (
                    <div className="mt-4 flex gap-4">
                      {post.githubLink && (
                        <a
                          href={post.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-black flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </a>
                      )}
                      {post.demoLink && (
                        <a
                          href={post.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-black flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                          Live Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}