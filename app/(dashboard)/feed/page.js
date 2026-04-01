"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JobsFeed from '@/components/JobsFeed';

// ===================== ImageCarousel =====================
function ImageCarousel({ images, onImageClick, currentIndex: externalIndex, onIndexChange }) {
  const [internalIndex, setInternalIndex] = useState(0);
  const index = externalIndex !== undefined ? externalIndex : internalIndex;

  const setIndex = (newIndex) => {
    if (onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  const next = () => {
    const newIndex = (index + 1) % images.length;
    setIndex(newIndex);
  };
  const prev = () => {
    const newIndex = (index - 1 + images.length) % images.length;
    setIndex(newIndex);
  };

  if (!images.length) return null;

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', background: '#0B0D12' }}>
      <div
        style={{ cursor: 'pointer', position: 'relative', aspectRatio: '16/9' }}
        onClick={() => onImageClick?.(index)}
      >
        <img
          src={images[index]?.url}
          alt={`Slide ${index + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s',
          }}
          onMouseOver={(e) => (e.target.style.transform = 'scale(1.03)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 20,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.target.style.background = 'rgba(0,0,0,0.8)')}
            onMouseOut={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')}
          >
            ‹
          </button>
          <button
            onClick={next}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 20,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.target.style.background = 'rgba(0,0,0,0.8)')}
            onMouseOut={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')}
          >
            ›
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
            }}
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setIndex(idx)}
                style={{
                  width: idx === index ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: idx === index ? '#7C5CFF' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===================== ImageModal =====================
function ImageModal({ isOpen, onClose, item, type, initialImageIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);

  useEffect(() => {
    setCurrentIndex(initialImageIndex);
  }, [item, initialImageIndex]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const images = type === 'certificate' ? (item.media?.length ? item.media : [{ url: item.imageUrl }]) : item.media || [];
  const currentImage = images[currentIndex]?.url;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#12151C',
          border: '1px solid #222634',
          borderRadius: 16,
          overflow: 'hidden',
          maxWidth: 860,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #222634',
            flexShrink: 0,
          }}
        >
          <h3 style={{ color: '#E5E7EB', fontSize: 15, fontWeight: 600, margin: 0 }}>{item.title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#171B24',
              border: '1px solid #222634',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              color: '#9CA3AF',
              display: 'flex',
              lineHeight: 0,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              background: '#0B0D12',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              minHeight: 260,
            }}
          >
            <img
              src={currentImage}
              alt={item.title}
              style={{ maxHeight: '50vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((p) => (p - 1 + images.length) % images.length)}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid #222634',
                    borderRadius: 8,
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#E5E7EB',
                    lineHeight: 0,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex((p) => (p + 1) % images.length)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid #222634',
                    borderRadius: 8,
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#E5E7EB',
                    lineHeight: 0,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      style={{
                        width: idx === currentIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: idx === currentIndex ? '#7C5CFF' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '16px 18px', borderTop: '1px solid #222634' }}>
            {type === 'certificate' && item.issuedBy && (
              <p style={{ color: '#7C5CFF', fontSize: 13, marginBottom: 6, marginTop: 0 }}>
                Issued by {item.issuedBy}
              </p>
            )}
            {item.semester && (
              <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 10, marginTop: 0 }}>
                Semester {item.semester}
              </p>
            )}
            <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
              {item.description}
            </p>
            {type === 'project' && item.techStack?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.techStack.map((tech, i) => (
                  <span key={i} className="tech-chip">{tech}</span>
                ))}
              </div>
            )}
            {type === 'certificate' && item.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.tags.map((tag, i) => (
                  <span key={i} className="tag-chip">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== Feed Content =====================
function FeedContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showJobs, setShowJobs] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselIndices, setCarouselIndices] = useState({});
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

  const handleImageClick = (post, imageIndex = 0) => {
    setSelectedPost(post);
    setSelectedImageIndex(imageIndex);
    setModalOpen(true);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #222634', borderTopColor: '#7C5CFF', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cert-card {
          background: #171B24; border: 1px solid #222634; border-radius: 12px; padding: 18px;
          transition: border-color 0.2s;
        }
        .cert-card:hover { border-color: #2d3148; }
        .tag-chip {
          display: inline-block; background: #171B24; border: 1px solid #222634;
          color: #9CA3AF; padding: 3px 10px; border-radius: 999px; font-size: 12px;
        }
        .tech-chip {
          display: inline-block; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
          color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 12px;
        }
        .action-btn-primary {
          background: #7C5CFF; color: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.2s; font-family: inherit;
        }
        .action-btn-primary:hover { background: #6d4fe0; }
        .action-btn-ghost {
          background: transparent; color: #9CA3AF; border: 1px solid #222634; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .action-btn-ghost:hover { border-color: #9CA3AF; color: #E5E7EB; }
        .section-label {
          color: #6B7280; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 10px; display: block;
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header - responsive */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#E5E7EB', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Activity Feed</h1>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Latest certificates and projects from students</p>
          </div>
          {!showJobs && (
            <button
              onClick={() => setShowJobs(true)}
              className="action-btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Job Updates
            </button>
          )}
        </div>

        {/* Jobs Section */}
        {showJobs && (
          <div
            ref={jobsSectionRef}
            style={{ background: '#12151C', border: '1px solid #222634', borderRadius: 12, marginBottom: 24, scrollMarginTop: '4rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #222634', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ color: '#E5E7EB', fontSize: 16, fontWeight: 600, margin: 0 }}>Job Updates</h2>
              <button
                onClick={() => setShowJobs(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <JobsFeed />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#F87171', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: '#171B24', border: '1px solid #222634', borderRadius: 12, padding: 18, animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0B0D12' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '60%', height: 16, background: '#0B0D12', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: '40%', height: 12, background: '#0B0D12', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ height: 16, width: '80%', background: '#0B0D12', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 120, background: '#0B0D12', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#171B24', border: '1px solid #222634', borderRadius: 12 }}>
            <svg width="48" height="48" fill="none" stroke="#6B7280" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: '#E5E7EB', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 0 }}>Students will appear here when they upload content.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post) => (
              <div key={post._id} className="cert-card">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => handleUserClick(post.owner?.registerNumber)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0B0D12', border: '1px solid #222634', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {post.owner?.profile?.profilePic && post.owner.profile.profilePic !== '/placeholder.png' ? (
                        <img src={post.owner.profile.profilePic} alt={post.owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#7C5CFF' }}>
                          {post.owner?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {post.owner?.name || 'Unknown User'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ color: '#6B7280', fontSize: 12 }}>{post.owner?.registerNumber}</span>
                        {post.owner?.batchYear && (
                          <>
                            <span style={{ color: '#6B7280', fontSize: 12 }}>•</span>
                            <span style={{ color: '#6B7280', fontSize: 12 }}>Batch {post.owner.batchYear}</span>
                          </>
                        )}
                        {post.owner?.department && (
                          <>
                            <span style={{ color: '#6B7280', fontSize: 12 }}>•</span>
                            <span style={{ color: '#9CA3AF', fontSize: 11, background: '#0B0D12', padding: '2px 8px', borderRadius: 12 }}>
                              {post.owner.department}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span
                      style={{
                        background: post.type === 'certificate' ? 'rgba(124,92,255,0.1)' : 'rgba(34,197,94,0.1)',
                        color: post.type === 'certificate' ? '#a78bfa' : '#4ade80',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {post.type === 'certificate' ? 'Certificate' : 'Project'}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>
                      {formatDate(post.createdAt || post.date)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {post.title && (
                  <h4 style={{ color: '#E5E7EB', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{post.title}</h4>
                )}
                <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                  {post.description}
                </p>

                {/* Media */}
                {post.media && post.media.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {post.media.length === 1 ? (
                      <div
                        style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: 8 }}
                        onClick={() => handleImageClick(post, 0)}
                      >
                        <img
                          src={post.media[0].url}
                          alt={post.title || 'Post media'}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, transition: 'transform 0.3s' }}
                          onMouseOver={(e) => (e.target.style.transform = 'scale(1.02)')}
                          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                        />
                      </div>
                    ) : (
                      <ImageCarousel
                        images={post.media}
                        onImageClick={(idx) => handleImageClick(post, idx)}
                        currentIndex={carouselIndices[post._id] || 0}
                        onIndexChange={(idx) => setCarouselIndices(prev => ({ ...prev, [post._id]: idx }))}
                      />
                    )}
                  </div>
                )}

                {/* Tech stack / tags */}
                {post.type === 'project' && post.techStack && post.techStack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {post.techStack.map((tech, i) => (
                      <span key={i} className="tech-chip">{tech}</span>
                    ))}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {post.tags.map((tag, i) => (
                      <span key={i} className="tag-chip" style={{ fontSize: 11 }}>#{tag}</span>
                    ))}
                  </div>
                )}
                {post.type === 'certificate' && post.issuedBy && (
                  <p style={{ color: '#7C5CFF', fontSize: 12, marginBottom: 0 }}>
                    Issued by {post.issuedBy}
                  </p>
                )}
                {post.type === 'project' && (post.githubLink || post.demoLink) && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    {post.githubLink && (
                      <a href={post.githubLink} target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        GitHub
                      </a>
                    )}
                    {post.demoLink && (
                      <a href={post.demoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        Live Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="action-btn-ghost"
            style={{ padding: '8px 20px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {/* Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedPost}
        type={selectedPost?.type}
        initialImageIndex={selectedImageIndex}
      />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #222634', borderTopColor: '#7C5CFF', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}