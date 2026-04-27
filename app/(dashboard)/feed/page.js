"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JobsFeed from '@/components/JobsFeed';

// ===================== Enhanced ImageCarousel with swipe & slide animation =====================
function ImageCarousel({ images, onImageClick, currentIndex: externalIndex, onIndexChange }) {
  const [internalIndex, setInternalIndex] = useState(0);
  const index = externalIndex !== undefined ? externalIndex : internalIndex;

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [didSwipe, setDidSwipe] = useState(false);
  const containerRef = useRef(null);

  const setIndex = (newIndex) => {
    if (onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  const next = useCallback(() => {
    if (images.length === 0) return;
    const newIndex = (index + 1) % images.length;
    setIndex(newIndex);
  }, [images.length, index]);

  const prev = useCallback(() => {
    if (images.length === 0) return;
    const newIndex = (index - 1 + images.length) % images.length;
    setIndex(newIndex);
  }, [images.length, index]);

  // Touch / Mouse swipe handlers
  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
    setIsDragging(true);
    setTransitionEnabled(false);
    setDidSwipe(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    setTouchEnd(e.targetTouches[0].clientX);
    const delta = touchEnd - touchStart;
    setDragOffset(delta);
    if (Math.abs(delta) > 10) setDidSwipe(true);
  }, [isDragging, touchEnd, touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTransitionEnabled(true);
    const delta = touchEnd - touchStart;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
    }
    setDragOffset(0);
    setTimeout(() => setDidSwipe(false), 100);
  }, [isDragging, touchEnd, touchStart, prev, next]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setTouchStart(e.clientX);
    setTouchEnd(e.clientX);
    setIsDragging(true);
    setTransitionEnabled(false);
    setDidSwipe(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
    const delta = touchEnd - touchStart;
    setDragOffset(delta);
    if (Math.abs(delta) > 10) setDidSwipe(true);
  }, [isDragging, touchEnd, touchStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTransitionEnabled(true);
    const delta = touchEnd - touchStart;
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev();
      else next();
    }
    setDragOffset(0);
    setTimeout(() => setDidSwipe(false), 100);
  }, [isDragging, touchEnd, touchStart, prev, next]);

  const handleImageClick = useCallback((idx, e) => {
    if (didSwipe) {
      e.stopPropagation();
      return;
    }
    onImageClick?.(idx);
  }, [didSwipe, onImageClick]);

  // Cleanup global mouseup
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  if (!images.length) return null;

  const containerWidth = containerRef.current?.offsetWidth || 0;
  const dragPercent = containerWidth ? (dragOffset / containerWidth) * 100 : 0;
  const translateX = -index * 100 + dragPercent;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--background)',
        touchAction: 'pan-y pinch-zoom',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        style={{
          display: 'flex',
          transition: transitionEnabled ? 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)' : 'none',
          transform: `translateX(${translateX}%)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{
              flex: '0 0 100%',
              position: 'relative',
              aspectRatio: '16/9',
              cursor: 'pointer',
            }}
            onClick={(e) => handleImageClick(idx, e)}
          >
            <img
              src={img.url}
              alt={`Slide ${idx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s',
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
              onMouseOver={(e) => { if (!isDragging) e.target.style.transform = 'scale(1.03)'; }}
              onMouseOut={(e) => { if (!isDragging) e.target.style.transform = 'scale(1)'; }}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
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
              zIndex: 2,
            }}
            onMouseOver={(e) => (e.target.style.background = 'rgba(0,0,0,0.8)')}
            onMouseOut={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
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
              zIndex: 2,
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
              zIndex: 2,
            }}
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setIndex(idx); }}
                style={{
                  width: idx === index ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: idx === index ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===================== ImageModal with swipe support (NO DARK BACKGROUND, ONLY BLUR) =====================
function ImageModal({ isOpen, onClose, item, type, initialImageIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const modalImageRef = useRef(null);

  const images = item ? (type === 'certificate' ? (item.media?.length ? item.media : [{ url: item.imageUrl }]) : item.media || []) : [];
  const total = images.length;

  useEffect(() => {
    setCurrentIndex(initialImageIndex);
  }, [item, initialImageIndex]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const next = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(e.targetTouches[0].clientX);
    setIsDragging(true);
    setTransitionEnabled(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    setTouchEnd(e.targetTouches[0].clientX);
    const delta = touchEnd - touchStart;
    setDragOffset(delta);
  }, [isDragging, touchEnd, touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTransitionEnabled(true);
    const delta = touchEnd - touchStart;
    if (Math.abs(delta) > 50 && total > 1) {
      if (delta > 0) prev();
      else next();
    }
    setDragOffset(0);
  }, [isDragging, touchEnd, touchStart, prev, next, total]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setTouchStart(e.clientX);
    setTouchEnd(e.clientX);
    setIsDragging(true);
    setTransitionEnabled(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
    const delta = touchEnd - touchStart;
    setDragOffset(delta);
  }, [isDragging, touchEnd, touchStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setTransitionEnabled(true);
    const delta = touchEnd - touchStart;
    if (Math.abs(delta) > 50 && total > 1) {
      if (delta > 0) prev();
      else next();
    }
    setDragOffset(0);
  }, [isDragging, touchEnd, touchStart, prev, next, total]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) handleMouseUp();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  if (!isOpen && !isClosing) return null;

  const currentImage = images[currentIndex]?.url;
  const containerWidth = modalImageRef.current?.offsetWidth || 0;
  const dragPercent = containerWidth ? (dragOffset / containerWidth) * 100 : 0;
  const translateX = -currentIndex * 100 + dragPercent;

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
        background: 'transparent',
        backdropFilter: 'blur(12px)',
        animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: 16,
          overflow: 'hidden',
          maxWidth: 860,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: isClosing ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>{item?.title}</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
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
            ref={modalImageRef}
            style={{
              background: 'var(--background)',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'pan-y pinch-zoom',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div
              style={{
                display: 'flex',
                transition: transitionEnabled ? 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)' : 'none',
                transform: `translateX(${translateX}%)`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: '0 0 100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    minHeight: 260,
                  }}
                >
                  <img
                    src={img.url}
                    alt={item?.title}
                    style={{
                      maxHeight: '50vh',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: 8,
                      pointerEvents: isDragging ? 'none' : 'auto',
                    }}
                  />
                </div>
              ))}
            </div>

            {total > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#E5E7EB',
                    lineHeight: 0,
                    zIndex: 3,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#E5E7EB',
                    lineHeight: 0,
                    zIndex: 3,
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
                    zIndex: 3,
                  }}
                >
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                      style={{
                        width: idx === currentIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: idx === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border)' }}>
            {type === 'certificate' && item?.issuedBy && (
              <p style={{ color: 'var(--primary)', fontSize: 13, marginBottom: 6, marginTop: 0 }}>
                Issued by {item.issuedBy}
              </p>
            )}
            {item?.semester && (
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 10, marginTop: 0 }}>
                Semester {item.semester}
              </p>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 10, marginTop: 0 }}>
              {item?.description}
            </p>
            {type === 'project' && item?.techStack?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.techStack.map((tech, i) => (
                  <span key={i} className="tech-chip">{tech}</span>
                ))}
              </div>
            )}
            {type === 'certificate' && item?.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.tags.map((tag, i) => (
                  <span key={i} className="tag-chip">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
      `}</style>
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
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: 14 }}>Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cert-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 18px;
          transition: border-color 0.2s;
        }
        .cert-card:hover { border-color: var(--card-hover-border); }
        .tag-chip {
          display: inline-block;
          background: var(--tag-bg);
          border: 1px solid var(--tag-border);
          color: var(--tag-text);
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.02em;
        }
        .tech-chip {
          display: inline-block;
          background: var(--tech-bg);
          border: 1px solid var(--tech-border);
          color: var(--tech-text);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
        }
        .action-btn-primary {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          font-family: inherit;
          letter-spacing: 0.02em;
        }
        .action-btn-primary:hover { background: var(--btn-primary-hover-bg); }
        .action-btn-ghost {
          background: var(--btn-ghost-bg);
          color: var(--btn-ghost-text);
          border: 1px solid var(--btn-ghost-border);
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          letter-spacing: 0.02em;
        }
        .action-btn-ghost:hover {
          border-color: var(--btn-ghost-hover-border);
          color: var(--btn-ghost-hover-text);
        }
        .section-label {
          color: var(--text-dim);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
          display: block;
        }
        @media (max-width: 640px) {
          .cert-card { padding: 14px; }
          .action-btn-primary, .action-btn-ghost { padding: 6px 14px; font-size: 12px; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Activity Feed</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Latest certificates and projects from students</p>
          </div>
          {!showJobs && (
            <button onClick={() => setShowJobs(true)} className="action-btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Job Updates
            </button>
          )}
        </div>

        {/* Jobs Section */}
        {showJobs && (
          <div
            ref={jobsSectionRef}
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 24, scrollMarginTop: '4rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, margin: 0 }}>Job Updates</h2>
              <button onClick={() => setShowJobs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}>
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
          <div style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: 'var(--danger)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--background)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '60%', height: 16, background: 'var(--background)', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: '40%', height: 12, background: 'var(--background)', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ height: 16, width: '80%', background: 'var(--background)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 120, background: 'var(--background)', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <svg width="48" height="48" fill="none" stroke="var(--text-dim)" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 0 }}>Students will appear here when they upload content.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post) => (
              <div key={post._id} className="cert-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => handleUserClick(post.owner?.registerNumber)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {post.owner?.profile?.profilePic && post.owner.profile.profilePic !== '/placeholder.png' ? (
                        <img src={post.owner.profile.profilePic} alt={post.owner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                          {post.owner?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{post.owner?.name || 'Unknown User'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{post.owner?.registerNumber}</span>
                        {post.owner?.batchYear && (
                          <>
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>•</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Batch {post.owner.batchYear}</span>
                          </>
                        )}
                        {post.owner?.department && (
                          <>
                            <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>•</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 11, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 12 }}>
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
                        background: post.type === 'certificate' ? 'var(--primary-soft)' : 'var(--success-soft)',
                        color: post.type === 'certificate' ? 'var(--primary)' : 'var(--success)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {post.type === 'certificate' ? 'Certificate' : 'Project'}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{formatDate(post.createdAt || post.date)}</span>
                  </div>
                </div>

                {post.title && <h4 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{post.title}</h4>}
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{post.description}</p>

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

                {post.type === 'project' && post.techStack && post.techStack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {post.techStack.map((tech, i) => <span key={i} className="tech-chip">{tech}</span>)}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {post.tags.map((tag, i) => <span key={i} className="tag-chip" style={{ fontSize: 11 }}>#{tag}</span>)}
                  </div>
                )}
                {post.type === 'certificate' && post.issuedBy && (
                  <p style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 0 }}>Issued by {post.issuedBy}</p>
                )}
                {post.type === 'project' && (post.githubLink || post.demoLink) && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    {post.githubLink && (
                      <a href={post.githubLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        GitHub
                      </a>
                    )}
                    {post.demoLink && (
                      <a href={post.demoLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
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
          <button onClick={fetchPosts} disabled={loading} className="action-btn-ghost" style={{ padding: '8px 20px' }}>
            {loading ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

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
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}