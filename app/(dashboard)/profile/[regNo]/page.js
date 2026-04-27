"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ResumeButton from "@/components/ResumeButton";
import { useParams, useRouter } from 'next/navigation';

// ===================== Custom Alert System (with animations & red confirm) =====================
function CustomAlert({ message, type, onConfirm, onCancel }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = (confirmed) => {
    setIsClosing(true);
    setTimeout(() => {
      if (confirmed) onConfirm?.();
      else onCancel?.();
    }, 200);
  };

  const isConfirm = type === 'confirm';
  const borderColor = isConfirm ? 'var(--danger)' : 'var(--success)';
  const textColor = isConfirm ? 'var(--danger)' : 'var(--primary)';
  const buttonBg = isConfirm ? 'var(--danger)' : 'var(--primary)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--modal-backdrop)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: '1.5rem',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          animation: isClosing ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        }}
      >
        <p
          style={{
            color: textColor,
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {isConfirm ? (
            <>
              <button
                onClick={() => handleClose(true)}
                style={{
                  background: buttonBg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = 'var(--danger-hover)')}
                onMouseOut={(e) => (e.target.style.background = buttonBg)}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => handleClose(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = 'var(--surface-2)')}
                onMouseOut={(e) => (e.target.style.background = 'transparent')}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => handleClose(true)}
              style={{
                background: buttonBg,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.background = 'var(--primary-hover)')}
              onMouseOut={(e) => (e.target.style.background = buttonBg)}
            >
              OK
            </button>
          )}
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

function useCustomAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'info') => {
    return new Promise((resolve) => {
      setAlert({ message, type, resolve });
    });
  };

  const AlertComponent = alert ? (
    <CustomAlert
      message={alert.message}
      type={alert.type}
      onConfirm={() => {
        if (alert.resolve) alert.resolve(true);
        setAlert(null);
      }}
      onCancel={() => {
        if (alert.resolve) alert.resolve(false);
        setAlert(null);
      }}
    />
  ) : null;

  return { showAlert, AlertComponent };
}

// ===================== Helper: Download all images as ZIP (for projects) =====================
async function downloadAllImages(images, title, showAlert) {
  if (!images || images.length === 0) {
    showAlert('No images to download.', 'error');
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder(`${title}_images`);
  for (let i = 0; i < images.length; i++) {
    const url = images[i].url;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = url.split('.').pop().split('?')[0] || 'jpg';
      folder.file(`image_${i + 1}.${ext}`, blob);
    } catch (err) {
      console.error(`Failed to download ${url}:`, err);
    }
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${title}.zip`);
  showAlert('Download started!', 'success');
}

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
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 6, marginTop: 0 }}>
                Semester {item.semester}
              </p>
            )}
            {type === 'certificate' && item?.participationDate?.from && (
              <p style={{ color: 'var(--success)', fontSize: 12, marginBottom: 6, marginTop: 0 }}>
                {new Date(item.participationDate.from).toLocaleDateString('en-GB')}
                {item.participationDate.to && ` – ${new Date(item.participationDate.to).toLocaleDateString('en-GB')}`}
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

// ===================== ResumeSection (stable Block component) =====================
const Block = ({ title, children }) => (
  <div
    style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '1.25rem',
      marginBottom: 12,
    }}
  >
    <span
      style={{
        color: 'var(--text-dim)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        display: 'block',
        marginBottom: 12,
      }}
    >
      {title}
    </span>
    {children}
  </div>
);

function ResumeSection({ user, isOwnProfile, regNo, onUpdate, showAlert, loggedInUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    designation: user?.profile?.designation || '',
    summary: user?.profile?.summary || '',
    github: user?.profile?.github || '',
    linkedin: user?.profile?.linkedin || '',
    portfolio: user?.profile?.portfolio || '',
    skills: user?.profile?.skills?.join(', ') || '',
    experience:
      user?.profile?.experience?.length > 0
        ? user.profile.experience
        : [{ company: '', role: '', duration: '', description: '' }],
    education:
      user?.profile?.education?.length > 0
        ? user.profile.education
        : [{ institution: '', degree: '', year: '' }],
    tenthPercentage: user?.profile?.tenthPercentage || '',
    twelfthPercentage: user?.profile?.twelfthPercentage || '',
    cgpa: user?.profile?.cgpa || '',
    cgpaSemester: user?.profile?.cgpaSemester || '',
  });

  const addExperience = () =>
    setFormData({
      ...formData,
      experience: [...formData.experience, { company: '', role: '', duration: '', description: '' }],
    });
  const removeExperience = (i) =>
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, idx) => idx !== i),
    });
  const updateExperience = (i, field, value) =>
    setFormData({
      ...formData,
      experience: formData.experience.map((e, idx) =>
        idx === i ? { ...e, [field]: value } : e
      ),
    });

  const addEducation = () =>
    setFormData({
      ...formData,
      education: [...formData.education, { institution: '', degree: '', year: '' }],
    });
  const removeEducation = (i) =>
    setFormData({
      ...formData,
      education: formData.education.filter((_, idx) => idx !== i),
    });
  const updateEducation = (i, field, value) =>
    setFormData({
      ...formData,
      education: formData.education.map((e, idx) =>
        idx === i ? { ...e, [field]: value } : e
      ),
    });

  const handleSave = async () => {
    try {
      setSaving(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const loggedInUser = JSON.parse(userData);
      const response = await fetch(`/api/users/${regNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser._id,
          role: loggedInUser.role,
          updates: {
            profile: {
              ...user.profile,
              designation: formData.designation,
              summary: formData.summary,
              github: formData.github,
              linkedin: formData.linkedin,
              portfolio: formData.portfolio,
              skills: formData.skills
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s),
              experience: formData.experience.filter((e) => e.company || e.role),
              education: formData.education.filter((e) => e.institution || e.degree),
              tenthPercentage: formData.tenthPercentage ? Number(formData.tenthPercentage) : undefined,
              twelfthPercentage: formData.twelfthPercentage ? Number(formData.twelfthPercentage) : undefined,
              cgpa: formData.cgpa ? Number(formData.cgpa) : undefined,
              cgpaSemester: formData.cgpaSemester ? Number(formData.cgpaSemester) : undefined,
            },
          },
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdate(data.user);
        setIsEditing(false);
        showAlert('Resume updated!', 'success');
      } else {
        showAlert('Failed to update: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      showAlert('Error updating resume', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      designation: user?.profile?.designation || '',
      summary: user?.profile?.summary || '',
      github: user?.profile?.github || '',
      linkedin: user?.profile?.linkedin || '',
      portfolio: user?.profile?.portfolio || '',
      skills: user?.profile?.skills?.join(', ') || '',
      experience:
        user?.profile?.experience?.length > 0
          ? user.profile.experience
          : [{ company: '', role: '', duration: '', description: '' }],
      education:
        user?.profile?.education?.length > 0
          ? user.profile.education
          : [{ institution: '', degree: '', year: '' }],
      tenthPercentage: user?.profile?.tenthPercentage || '',
      twelfthPercentage: user?.profile?.twelfthPercentage || '',
      cgpa: user?.profile?.cgpa || '',
      cgpaSemester: user?.profile?.cgpaSemester || '',
    });
    setIsEditing(false);
  };

  const profile = user?.profile || {};
  const showResumeButton = isOwnProfile || loggedInUser?.role === 'staff';

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const GitHubIcon = () => (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );

  const LinkedInIcon = () => (
    <svg width="15" height="15" fill="#60a5fa" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );

  const PortfolioIcon = () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
        {isOwnProfile && (
          isEditing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="action-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Resume'}
              </button>
              <button onClick={handleCancel} className="action-btn-ghost">Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="action-btn-ghost">Edit Resume</button>
          )
        )}
        {showResumeButton && <ResumeButton regNo={regNo} />}
      </div>

      <Block title="Designation">
        {isEditing ? (
          <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g. Frontend Developer" className="profile-input" />
        ) : (
          <p style={{ color: profile.designation ? 'var(--text-primary)' : 'var(--text-dim)', fontSize: 14, margin: 0 }}>{profile.designation || 'Not specified'}</p>
        )}
      </Block>

      <Block title="Summary">
        {isEditing ? (
          <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Write a short professional summary..." className="profile-input" rows={4} style={{ resize: 'vertical' }} />
        ) : (
          <p style={{ color: profile.summary ? 'var(--text-secondary)' : 'var(--text-dim)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{profile.summary || 'No summary yet.'}</p>
        )}
      </Block>

      <Block title="Links">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'GitHub', key: 'github', placeholder: 'https://github.com/username' },
              { label: 'LinkedIn', key: 'linkedin', placeholder: 'https://linkedin.com/in/username' },
              { label: 'Portfolio', key: 'portfolio', placeholder: 'https://yoursite.com' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-dim)', fontSize: 12, width: 68, flexShrink: 0 }}>{label}</span>
                <input type="url" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} placeholder={placeholder} className="profile-input" style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
                <GitHubIcon />
                {profile.github}
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
                <LinkedInIcon />
                {profile.linkedin}
              </a>
            )}
            {profile.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
                <PortfolioIcon />
                {profile.portfolio}
              </a>
            )}
            {!profile.github && !profile.linkedin && !profile.portfolio && (
              <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No links added yet.</p>
            )}
          </div>
        )}
      </Block>

      <Block title="Skills">
        {isEditing ? (
          <input type="text" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="React, Node.js, Python…" className="profile-input" />
        ) : profile.skills?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{profile.skills.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}</div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No skills added yet.</p>
        )}
      </Block>

      <Block title="Internships & Experience">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.experience.map((exp, index) => (
              <div key={index} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Entry {index + 1}</span>
                  {formData.experience.length > 1 && (
                    <button onClick={() => removeExperience(index)} className="delete-btn">Remove</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} placeholder="Company Name" className="profile-input" />
                  <input type="text" value={exp.role} onChange={(e) => updateExperience(index, 'role', e.target.value)} placeholder="Role / Position" className="profile-input" />
                  <input type="text" value={exp.duration} onChange={(e) => updateExperience(index, 'duration', e.target.value)} placeholder="Jan 2024 – Mar 2024" className="profile-input" />
                  <textarea value={exp.description} onChange={(e) => updateExperience(index, 'description', e.target.value)} placeholder="What did you do?" className="profile-input" rows={2} style={{ resize: 'vertical' }} />
                </div>
              </div>
            ))}
            <button onClick={addExperience} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Experience
            </button>
          </div>
        ) : profile.experience?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.experience.map((exp, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid var(--primary-soft-border)' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>{exp.role}</p>
                <p style={{ color: 'var(--primary)', fontSize: 13, margin: '0 0 3px' }}>{exp.company}</p>
                {exp.duration && <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 6px' }}>{exp.duration}</p>}
                {exp.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No experience added yet.</p>
        )}
      </Block>

      <Block title="Education">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.education.map((edu, index) => (
              <div key={index} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Entry {index + 1}</span>
                  {formData.education.length > 1 && (
                    <button onClick={() => removeEducation(index)} className="delete-btn">Remove</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="Institution Name" className="profile-input" />
                  <input type="text" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} placeholder="Degree / Course" className="profile-input" />
                  <input type="text" value={edu.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} placeholder="2020 – 2024" className="profile-input" />
                </div>
              </div>
            ))}
            <button onClick={addEducation} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Education
            </button>
          </div>
        ) : profile.education?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.education.map((edu, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid var(--success-soft-border)' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>{edu.degree}</p>
                <p style={{ color: 'var(--success)', fontSize: 13, margin: '0 0 3px' }}>{edu.institution}</p>
                {edu.year && <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: 0 }}>{edu.year}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No education added yet.</p>
        )}
      </Block>

      <Block title="Academic Performance">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: 11, display: 'block', marginBottom: 6 }}>10th %</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.tenthPercentage} onChange={(e) => setFormData({ ...formData, tenthPercentage: e.target.value })} className="profile-input" placeholder="e.g., 89.5" />
              </div>
              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: 11, display: 'block', marginBottom: 6 }}>12th %</label>
                <input type="number" min="0" max="100" step="0.1" value={formData.twelfthPercentage} onChange={(e) => setFormData({ ...formData, twelfthPercentage: e.target.value })} className="profile-input" placeholder="e.g., 92.3" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: 11, display: 'block', marginBottom: 6 }}>CGPA</label>
                <input type="number" min="0" max="10" step="0.01" value={formData.cgpa} onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })} className="profile-input" placeholder="e.g., 8.5" />
              </div>
              <div>
                <label style={{ color: 'var(--text-dim)', fontSize: 11, display: 'block', marginBottom: 6 }}>Up to Semester</label>
                <select value={formData.cgpaSemester} onChange={(e) => setFormData({ ...formData, cgpaSemester: e.target.value })} className="profile-input">
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(profile.tenthPercentage || profile.twelfthPercentage) && (
              <div style={{ display: 'flex', gap: 24 }}>
                {profile.tenthPercentage && <div><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>10th: </span><span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{profile.tenthPercentage}%</span></div>}
                {profile.twelfthPercentage && <div><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>12th: </span><span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{profile.twelfthPercentage}%</span></div>}
              </div>
            )}
            {profile.cgpa && (
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>CGPA: </span>
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
                  {profile.cgpa}
                  {profile.cgpaSemester && profile.cgpaSemester < 8 
                    ? ` upto ${profile.cgpaSemester}${getOrdinal(profile.cgpaSemester)} semester`
                    : ''}
                </span>
              </div>
            )}
            {!profile.tenthPercentage && !profile.twelfthPercentage && !profile.cgpa && (
              <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No academic details added yet.</p>
            )}
          </div>
        )}
      </Block>
    </div>
  );
}

// ==================== CertificateSection (Modified for Staff) ====================
function CertificateSection({ userId, isOwnProfile, showAlert, student, loggedInUser, isStaffView = false }) {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    issuedBy: '', 
    tags: '', 
    semester: '1',
    category: 'academic'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [closingDropdownId, setClosingDropdownId] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?userId=${userId}&type=certificate`);
      const data = await response.json();
      if (data.success) setCertificates(data.posts || []);
    } catch { } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showAlert('Please select a valid image file', 'error');
      return;
    }
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !selectedFile) {
      showAlert('Please fill all required fields', 'error');
      return;
    }
    if (!fromDate) {
      showAlert('Please select participation date', 'error');
      return;
    }
    if (isDateRange && toDate && new Date(toDate) < new Date(fromDate)) {
      showAlert('End date cannot be earlier than start date', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('type', 'certificate');
      fd.append('userId', userId);
      fd.append('issuedBy', formData.issuedBy || 'Self');
      if (!isStaffView) {
        fd.append('tags', formData.tags);
        fd.append('semester', formData.semester);
        fd.append('category', formData.category);
      }
      fd.append('files', selectedFile);
      fd.append('fromDate', fromDate);
      if (isDateRange && toDate) fd.append('toDate', toDate);

      const response = await fetch('/api/posts/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (response.ok && data.success) {
        setCertificates([{ ...data.post, createdAt: data.post.createdAt || new Date().toISOString() }, ...certificates]);
        setShowForm(false);
        setFormData({ title: '', description: '', issuedBy: '', tags: '', semester: '1', category: 'academic' });
        clearFile();
        setFromDate('');
        setToDate('');
        setIsDateRange(false);
        showAlert('Certificate uploaded!', 'success');
      } else {
        showAlert('Upload failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch {
      showAlert('Network error.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = await showAlert('Delete this certificate? This action cannot be undone.', 'confirm');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setCertificates(certificates.filter((c) => c._id !== postId));
        showAlert('Certificate deleted!', 'success');
      } else {
        showAlert('Delete failed', 'error');
      }
    } catch {
      showAlert('Network error', 'error');
    }
  };

  const handleEdit = (cert) => {
    setEditItem(cert);
    setEditModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleEditSave = (updatedPost) => {
    setCertificates((prev) => prev.map((c) => (c._id === updatedPost._id ? updatedPost : c)));
    setEditModalOpen(false);
    showAlert('Certificate updated!', 'success');
  };

  const handleDownload = async (cert) => {
    const imageUrl = cert.media?.[0]?.url;
    if (!imageUrl) {
      showAlert('No image to download', 'error');
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${cert.title || 'certificate'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showAlert('Download started!', 'success');
    } catch (err) {
      showAlert('Failed to download image', 'error');
    }
  };

  const imageToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  };

  const exportToWord = async () => {
  setExporting(true);
  try {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType,
      VerticalAlign,
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    const fetchBuffer = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.arrayBuffer();
      } catch { return null; }
    };

    const logoBuffer = await fetchBuffer('/logo.png');

    const certsWithImages = await Promise.all(
      certificates.map(async (cert) => {
        const imgUrl = cert.media?.[0]?.url;
        const imgBuffer = imgUrl ? await fetchBuffer(imgUrl) : null;
        return { ...cert, imgBuffer };
      })
    );

    const sorted = [...certsWithImages].sort(
      (a, b) => (a.semester || 1) - (b.semester || 1)
    );

    const dept = student?.department || 'Computer Science and Engineering';
    const studentName = student?.name || 'N/A';
    const studentId = isStaffView 
      ? (student?.staffId || 'N/A')
      : (student?.registerNumber || 'N/A');
    const studentBatch = !isStaffView ? (student?.batchYear || 'N/A') : null;

    const formatDate = (val) => {
      if (!val) return '';
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-GB');
    };

    const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
    const borders = { top: border, bottom: border, left: border, right: border };
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    const cell = (children, opts = {}) =>
      new TableCell({
        borders: opts.noBorder ? noBorders : borders,
        width: { size: opts.width ?? 1500, type: WidthType.DXA },
        shading: opts.fill
          ? { fill: opts.fill, type: ShadingType.CLEAR }
          : { type: ShadingType.NIL },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        ...(opts.colSpan ? { columnSpan: opts.colSpan } : {}),
        children,
      });

    const para = (text, opts = {}) =>
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { before: opts.before ?? 0, after: opts.after ?? 0 },
        children: [
          new TextRun({
            text: text ?? '',
            bold: opts.bold ?? false,
            size: (opts.size ?? 11) * 2,
            font: 'Times New Roman',
            color: opts.color ?? 'auto',
          }),
        ],
      });

    const headerPara = (text, size, bold = false) =>
      para(text, { align: AlignmentType.CENTER, size, bold, before: 20, after: 20 });

    const MARGIN = 851;
    const PAGE_W = 11906;
    const CONTENT_W = PAGE_W - MARGIN * 2; // 10204 DXA

    // Define thCell before using it
    const thCell = (text, w) =>
      cell([para(text, { bold: true, size: 9, align: AlignmentType.CENTER })], { width: w });

    // Determine columns and header based on isStaffView
    let COL_W, headerCells, colSpanCount;
    if (isStaffView) {
      COL_W = [800, 3204, 2500, 1900, 1800]; // sum = 10204
      headerCells = [
        thCell('S.No', COL_W[0]),
        thCell('Certificate Title', COL_W[1]),
        thCell('Issued By', COL_W[2]),
        thCell('Participation Date', COL_W[3]),
        thCell('Preview', COL_W[4]),
      ];
      colSpanCount = 5;
    } else {
      COL_W = [600, 700, 1200, 2804, 2000, 1600, 1800];
      headerCells = [
        thCell('S.No', COL_W[0]),
        thCell('Semester', COL_W[1]),
        thCell('Category', COL_W[2]),
        thCell('Certificate Title', COL_W[3]),
        thCell('Issued By', COL_W[4]),
        thCell('Participation Date', COL_W[5]),
        thCell('Preview', COL_W[6]),
      ];
      colSpanCount = 7;
    }

    // Header table with logo and college name
    const headerRow = new TableRow({
      children: [
        cell(
          logoBuffer
            ? [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({
                  data: logoBuffer, type: 'png',
                  transformation: { width: 55, height: 55 },
                })],
              })]
            : [para('')],
          { width: 1000, noBorder: true }
        ),
        cell(
          [
            headerPara('JAYARAJ ANNAPACKIAM CSI COLLEGE OF ENGINEERING', 16, true),
            headerPara('(Approved by AICTE, New Delhi and Affiliated to Anna University)', 8),
            headerPara('MARGOSCHIS NAGAR, NAZARETH – 628 617', 9),
          ],
          { width: CONTENT_W - 1000, noBorder: true }
        ),
      ],
    });

    const headerTable = new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [1000, CONTENT_W - 1000],
      borders: { top: noBorder, bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' }, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
      rows: [headerRow],
    });

    const deptTitle = para(
      `DEPARTMENT OF ${dept.toUpperCase()}`,
      { align: AlignmentType.CENTER, bold: true, size: 13, before: 120, after: 40 }
    );
    const reportTitle = para('CERTIFICATE REPORT', {
      align: AlignmentType.CENTER, bold: true, size: 13, after: 120,
    });

    // Student info block
    const infoLines = [
      ['Name:', studentName],
      [isStaffView ? 'Staff ID:' : 'Register Number:', studentId],
      ['Department:', dept],
    ];
    if (!isStaffView && studentBatch) {
      infoLines.push(['Batch Year:', String(studentBatch)]);
    }

    const infoTable = new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [2000, CONTENT_W - 2000],
      rows: infoLines.map(([label, value]) =>
        new TableRow({
          children: [
            cell([para(label, { bold: true, size: 10 })], { width: 2000, noBorder: true }),
            cell([para(value, { size: 10 })], { width: CONTENT_W - 2000, noBorder: true }),
          ],
        })
      ),
    });

    const headerTableRow = new TableRow({
      tableHeader: true,
      children: headerCells,
    });

    const dataRows = sorted.map((cert, idx) => {
      const participation = cert.participationDate?.from
        ? formatDate(cert.participationDate.from) +
          (cert.participationDate.to ? ` – ${formatDate(cert.participationDate.to)}` : '')
        : 'Not specified';

      const categoryDisplay = cert.category === 'extra curricular' ? 'Extra Curricular' : 'Academic';

      const previewChildren = cert.imgBuffer
        ? [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              data: cert.imgBuffer,
              type: (() => {
                const url = cert.media?.[0]?.url ?? '';
                if (url.includes('.png')) return 'png';
                if (url.includes('.webp')) return 'webp';
                if (url.includes('.gif')) return 'gif';
                return 'jpg';
              })(),
              transformation: { width: 90, height: 65 },
            })],
          })]
        : [para('No image', { align: AlignmentType.CENTER, size: 9 })];

      if (isStaffView) {
        return new TableRow({
          children: [
            cell([para(String(idx + 1), { align: AlignmentType.CENTER, size: 9 })], { width: COL_W[0] }),
            cell([para(cert.title ?? 'Untitled', { size: 9 })], { width: COL_W[1] }),
            cell([para(cert.issuedBy ?? '—', { size: 9 })], { width: COL_W[2] }),
            cell([para(participation, { size: 9, align: AlignmentType.CENTER })], { width: COL_W[3] }),
            cell(previewChildren, { width: COL_W[4] }),
          ],
        });
      } else {
        return new TableRow({
          children: [
            cell([para(String(idx + 1), { align: AlignmentType.CENTER, size: 9 })], { width: COL_W[0] }),
            cell([para(String(cert.semester ?? '—'), { align: AlignmentType.CENTER, size: 9 })], { width: COL_W[1] }),
            cell([para(categoryDisplay, { align: AlignmentType.CENTER, size: 9 })], { width: COL_W[2] }),
            cell([para(cert.title ?? 'Untitled', { size: 9 })], { width: COL_W[3] }),
            cell([para(cert.issuedBy ?? '—', { size: 9 })], { width: COL_W[4] }),
            cell([para(participation, { size: 9, align: AlignmentType.CENTER })], { width: COL_W[5] }),
            cell(previewChildren, { width: COL_W[6] }),
          ],
        });
      }
    });

    const certTable = new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: COL_W,
      rows: sorted.length === 0
        ? [new TableRow({
            children: [cell(
              [para('No certificates uploaded.', { align: AlignmentType.CENTER })],
              { width: CONTENT_W, colSpan: colSpanCount }
            )],
          })]
        : [headerTableRow, ...dataRows],
    });

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: 'Times New Roman', size: 22 } },
        },
      },
      sections: [{
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [
          headerTable,
          deptTitle,
          reportTitle,
          infoTable,
          para('', { after: 80 }),
          certTable,
        ],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    const fileName = isStaffView 
      ? `${student?.staffId || 'staff'}_Certificates.docx`
      : `${student?.registerNumber || 'student'}_Certificates.docx`;
    saveAs(buffer, fileName);
    showAlert('Word document downloaded!', 'success');

  } catch (error) {
    console.error('Word export error:', error);
    showAlert('Failed to generate Word document', 'error');
  } finally {
    setExporting(false);
  }
};

  const toggleDropdown = (id) => {
    if (activeDropdownId === id) {
      setClosingDropdownId(id);
      setTimeout(() => {
        setActiveDropdownId(null);
        setClosingDropdownId(null);
      }, 150);
    } else {
      setActiveDropdownId(id);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {isOwnProfile && !showForm && (
          <button onClick={() => setShowForm(true)} className="action-btn-primary">
            + Add Certificate
          </button>
        )}
        {(loggedInUser?.role === 'staff' || loggedInUser?.role === 'admin') && certificates.length > 0 && (
          <button onClick={exportToWord} disabled={exporting} className="action-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Word Report
              </>
            )}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: 20 }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Upload Certificate</p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span className="section-label">Title *</span>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="profile-input" />
            </div>
            <div>
              <span className="section-label">Issued by</span>
              <input type="text" value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} className="profile-input" />
            </div>
            <div>
              <span className="section-label">Description *</span>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="profile-input" rows={3} style={{ resize: 'vertical' }} />
            </div>

            {!isStaffView && (
              <>
                <div>
                  <span className="section-label">Tags</span>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="profile-input" placeholder="React, Frontend, Web Dev" />
                </div>
                <div>
                  <span className="section-label">Semester *</span>
                  <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="profile-input">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (<option key={s} value={s}>Semester {s}</option>))}
                  </select>
                </div>
                <div>
                  <span className="section-label">Category *</span>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="profile-input">
                    <option value="academic">Academic</option>
                    <option value="extra curricular">Extra Curricular</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <span className="section-label">Participation Date *</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isDateRange} onChange={(e) => setIsDateRange(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  Date range (from – to)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="profile-input" required style={{ flex: 1 }} />
                {isDateRange && <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="profile-input" style={{ flex: 1 }} />}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 4 }}>Format: DD/MM/YYYY</p>
            </div>

            <div>
              <span className="section-label">Image *</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {selectedFile ? selectedFile.name.substring(0, 24) + '…' : 'Choose File'}
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.gif,.webp" />
              </label>
              {selectedFile && (
                <button type="button" onClick={clearFile} style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              )}
              {previewUrl && <img src={previewUrl} alt="Preview" style={{ display: 'block', maxHeight: 100, marginTop: 10, borderRadius: 8, border: '1px solid var(--border)' }} />}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={uploading} className="action-btn-primary" style={{ opacity: uploading ? 0.6 : 1 }}>{uploading ? 'Uploading…' : 'Upload'}</button>
              <button type="button" onClick={() => { setShowForm(false); clearFile(); setFormData({ title: '', description: '', issuedBy: '', tags: '', semester: '1', category: 'academic' }); setFromDate(''); setToDate(''); setIsDateRange(false); }} className="action-btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {certificates.length === 0 ? (
        <EmptyState
          icon={
            <svg width="22" height="22" fill="none" stroke="var(--text-dim)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="No Certificates Yet"
          desc="Upload your first certificate to showcase your achievements"
          action={isOwnProfile && !showForm ? () => setShowForm(true) : null}
          actionLabel="Upload Certificate"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {certificates.map((cert) => (
            <div key={cert._id} className="cert-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>{cert.title || 'Untitled'}</p>
                  {!isStaffView && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {cert.semester && <p style={{ color: 'var(--text-dim)', fontSize: 11, margin: 0 }}>Semester {cert.semester}</p>}
                      {cert.category && (
                        <span style={{
                          background: cert.category === 'extra curricular' ? 'var(--warning-soft)' : 'var(--primary-soft)',
                          border: cert.category === 'extra curricular' ? '1px solid var(--warning-soft-border)' : '1px solid var(--primary-soft-border)',
                          color: cert.category === 'extra curricular' ? 'var(--warning)' : 'var(--primary)',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}>
                          {cert.category === 'extra curricular' ? 'Extra Curricular' : 'Academic'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => toggleDropdown(cert._id)} className="delete-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 16, color: 'var(--text-muted)' }}>⋮</button>
                    {(activeDropdownId === cert._id || closingDropdownId === cert._id) && (
                      <div style={{ position: 'absolute', right: 0, top: 24, background: 'var(--dropdown-bg)', border: '1px solid var(--dropdown-border)', borderRadius: 8, zIndex: 10, minWidth: 90, animation: closingDropdownId === cert._id ? 'dropdownOut 0.15s ease-out forwards' : 'dropdownIn 0.15s ease-out' }}>
                        <button onClick={() => handleEdit(cert)} style={{ display: 'block', width: '100%', padding: '6px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>Edit</button>
                        <button onClick={() => handleDownload(cert)} style={{ display: 'block', width: '100%', padding: '6px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>Download</button>
                        <button onClick={() => handleDelete(cert._id)} style={{ display: 'block', width: '100%', padding: '6px 16px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {cert.issuedBy && <p style={{ color: 'var(--primary)', fontSize: 13, margin: '0 0 4px' }}>{cert.issuedBy}</p>}
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{cert.description}</p>
              {cert.media?.[0]?.url && (
                <div style={{ marginBottom: 10, cursor: 'pointer', overflow: 'hidden', borderRadius: 8 }} onClick={() => { setSelectedCertificate(cert); setModalOpen(true); }}>
                  <img src={cert.media[0].url} alt={cert.title} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, transition: 'transform 0.3s' }} onMouseOver={(e) => (e.target.style.transform = 'scale(1.02)')} onMouseOut={(e) => (e.target.style.transform = 'scale(1)')} />
                </div>
              )}
              {!isStaffView && cert.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                  {cert.tags.map((tag, i) => (<span key={i} className="tag-chip" style={{ fontSize: 10 }}>#{tag}</span>))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <p style={{ color: 'var(--text-dim)', fontSize: 11, margin: 0 }}>Posted: {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-GB') : 'Recent'}</p>
                {cert.participationDate?.from && (
                  <p style={{ color: 'var(--success)', fontSize: 11, margin: 0, fontWeight: 500 }}>
                    {new Date(cert.participationDate.from).toLocaleDateString('en-GB')}
                    {cert.participationDate.to && ` – ${new Date(cert.participationDate.to).toLocaleDateString('en-GB')}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} item={selectedCertificate} type="certificate" />
      <EditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} item={editItem} type="certificate" onSave={handleEditSave} showAlert={showAlert} isStaffView={isStaffView} />
      <style jsx>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: scale(0.9) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dropdownOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.9) translateY(-5px); }
        }
      `}</style>
    </>
  );
}

// ==================== ProjectSection ====================
function ProjectSection({ userId, isOwnProfile, showAlert }) {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', techStack: '', tags: '', semester: '1' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [closingDropdownId, setClosingDropdownId] = useState(null);
  const [carouselIndices, setCarouselIndices] = useState({});

  useEffect(() => {
    fetchProjects();
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [userId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?userId=${userId}&type=project`);
      const data = await response.json();
      if (data.success) setProjects(data.posts || []);
    } catch { } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const valid = files.filter((f) => allowed.includes(f.type));
    const urls = valid.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...valid]);
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(previewUrls[i]);
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !selectedFiles.length) {
      showAlert('Please fill all required fields and add at least one image', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('type', 'project');
      fd.append('userId', userId);
      fd.append('techStack', formData.techStack);
      fd.append('tags', formData.tags);
      fd.append('semester', formData.semester);
      selectedFiles.forEach((file) => fd.append('files', file));

      const response = await fetch('/api/posts/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (response.ok && data.success) {
        setProjects([{ ...data.post, createdAt: data.post.createdAt || new Date().toISOString() }, ...projects]);
        setShowForm(false);
        setFormData({ title: '', description: '', techStack: '', tags: '', semester: '1' });
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviewUrls([]);
        showAlert('Project uploaded!', 'success');
      } else {
        showAlert('Upload failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch {
      showAlert('Network error.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = await showAlert('Delete this project? This action cannot be undone.', 'confirm');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setProjects(projects.filter((p) => p._id !== postId));
        showAlert('Project deleted!', 'success');
      } else {
        showAlert('Delete failed', 'error');
      }
    } catch {
      showAlert('Network error', 'error');
    }
  };

  const handleEdit = (project) => {
    setEditItem(project);
    setEditModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleEditSave = (updatedPost) => {
    setProjects((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    setEditModalOpen(false);
    showAlert('Project updated!', 'success');
  };

  const handleDownload = (project) => {
    const images = project.media || [];
    if (images.length === 0) {
      showAlert('No images to download', 'error');
      return;
    }
    downloadAllImages(images, project.title || 'project', showAlert);
  };

  const handleImageClick = (project, idx) => {
    setSelectedProject(project);
    setSelectedImageIndex(idx);
    setModalOpen(true);
  };

  const toggleDropdown = (id) => {
    if (activeDropdownId === id) {
      setClosingDropdownId(id);
      setTimeout(() => {
        setActiveDropdownId(null);
        setClosingDropdownId(null);
      }, 150);
    } else {
      setActiveDropdownId(id);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--success)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }}
        />
      </div>
    );

  return (
    <>
      {isOwnProfile && !showForm && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <button onClick={() => setShowForm(true)} className="action-btn-primary">
            + Add Project
          </button>
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: 20,
          }}
        >
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
            Upload Project
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Title *', key: 'title', placeholder: 'E-commerce Website' },
              { label: 'Technologies', key: 'techStack', placeholder: 'React, Node.js, MongoDB' },
              { label: 'Tags', key: 'tags', placeholder: 'fullstack, web-app' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <span
                  style={{
                    color: 'var(--text-dim)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {label}
                </span>
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="profile-input"
                />
              </div>
            ))}
            <div>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Description *
              </span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project…"
                className="profile-input"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Semester *
              </span>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="profile-input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Images *
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Select Images
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  multiple
                />
              </label>
              {selectedFiles.length > 0 && (
                <span style={{ marginLeft: 10, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {selectedFiles.length} selected
                </span>
              )}
              {previewUrls.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {previewUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        style={{
                          width: '100%',
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 3,
                          width: 18,
                          height: 18,
                          background: 'var(--danger)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#fff',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'inherit',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={uploading}
                className="action-btn-primary"
                style={{ opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  previewUrls.forEach((url) => URL.revokeObjectURL(url));
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                  setFormData({ title: '', description: '', techStack: '', tags: '', semester: '1' });
                }}
                className="action-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={
            <svg width="22" height="22" fill="none" stroke="var(--text-dim)" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
          title="No Projects Yet"
          desc="Showcase your work by adding a project"
          action={isOwnProfile && !showForm ? () => setShowForm(true) : null}
          actionLabel="Add Project"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((project) => (
            <div key={project._id} className="cert-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                    {project.title || 'Untitled'}
                  </p>
                  {project.semester && (
                    <p style={{ color: 'var(--text-dim)', fontSize: 11, margin: 0 }}>Semester {project.semester}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => toggleDropdown(project._id)}
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 16, color: 'var(--text-muted)' }}
                    >
                      ⋮
                    </button>
                    {(activeDropdownId === project._id || closingDropdownId === project._id) && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 24,
                          background: 'var(--dropdown-bg)',
                          border: '1px solid var(--dropdown-border)',
                          borderRadius: 8,
                          zIndex: 10,
                          minWidth: 90,
                          animation: closingDropdownId === project._id ? 'dropdownOut 0.15s ease-out forwards' : 'dropdownIn 0.15s ease-out',
                        }}
                      >
                        <button
                          onClick={() => handleEdit(project)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 13,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDownload(project)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 13,
                          }}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 13,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                {project.description}
              </p>
              {project.media?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <ImageCarousel
                    images={project.media}
                    onImageClick={(idx) => handleImageClick(project, idx)}
                    currentIndex={carouselIndices[project._id] || 0}
                    onIndexChange={(idx) => setCarouselIndices(prev => ({ ...prev, [project._id]: idx }))}
                  />
                </div>
              )}
              {project.techStack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                  {project.techStack.map((tech, i) => (
                    <span key={i} className="tech-chip">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {project.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                  {project.tags.map((tag, i) => (
                    <span key={i} className="tag-chip" style={{ fontSize: 10 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 4 }}>
                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          ))}
        </div>
      )}

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedProject}
        type="project"
        initialImageIndex={selectedImageIndex}
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        item={editItem}
        type="project"
        onSave={handleEditSave}
        showAlert={showAlert}
      />
      <style jsx>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: scale(0.9) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dropdownOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.9) translateY(-5px); }
        }
      `}</style>
    </>
  );
}

// ==================== EmptyState ====================
function EmptyState({ icon, title, desc, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        {icon}
      </div>
      <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{title}</p>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: action ? 18 : 0 }}>{desc}</p>
      {action && (
        <button onClick={action} className="action-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ==================== EditModal (with closing animation, Modified for Staff) ====================
function EditModal({ isOpen, onClose, item, type, onSave, showAlert, isStaffView = false }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    issuedBy: item?.issuedBy || '',
    tags: item?.tags?.join(', ') || '',
    techStack: item?.techStack?.join(', ') || '',
    semester: item?.semester?.toString() || '1',
    category: item?.category || 'academic',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        issuedBy: item.issuedBy || '',
        tags: item.tags?.join(', ') || '',
        techStack: item.techStack?.join(', ') || '',
        semester: item.semester?.toString() || '1',
        category: item.category || 'academic',
      });
      setSelectedFiles([]);
      setPreviewUrls([]);

      if (item.participationDate?.from) {
        const from = new Date(item.participationDate.from);
        setFromDate(from.toISOString().split('T')[0]);
        if (item.participationDate.to) {
          const to = new Date(item.participationDate.to);
          setToDate(to.toISOString().split('T')[0]);
          setIsDateRange(true);
        } else {
          setToDate('');
          setIsDateRange(false);
        }
      } else {
        setFromDate('');
        setToDate('');
        setIsDateRange(false);
      }
    }
  }, [item]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const valid = files.filter((f) => allowed.includes(f.type));
    const urls = valid.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...valid]);
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'certificate' && !fromDate) {
      showAlert('Please select participation date', 'error');
      return;
    }
    if (isDateRange && toDate && new Date(toDate) < new Date(fromDate)) {
      showAlert('End date cannot be earlier than start date', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('semester', formData.semester);
      if (type === 'certificate') {
        fd.append('issuedBy', formData.issuedBy);
        if (!isStaffView) {
          fd.append('tags', formData.tags);
          fd.append('category', formData.category);
        }
        if (fromDate) {
          fd.append('fromDate', fromDate);
          if (isDateRange && toDate) fd.append('toDate', toDate);
        }
      } else {
        fd.append('techStack', formData.techStack);
        fd.append('tags', formData.tags);
      }
      if (selectedFiles.length) {
        selectedFiles.forEach((file) => fd.append('files', file));
      }

      const response = await fetch(`/api/posts/${item._id}`, {
        method: 'PUT',
        body: fd,
      });
      const data = await response.json();
      if (data.success) {
        onSave(data.post);
        handleClose();
      } else {
        showAlert('Update failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch {
      showAlert('Network error', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--modal-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: isClosing ? 'fadeOut 0.2s ease-out forwards' : 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '1.5rem',
          animation: isClosing ? 'slideOut 0.2s ease-out forwards' : 'slideIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, margin: 0 }}>
            Edit {type === 'certificate' ? 'Certificate' : 'Project'}
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><span className="section-label">Title *</span><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="profile-input" required /></div>
          <div><span className="section-label">Description *</span><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="profile-input" rows={3} required /></div>
          {type === 'certificate' && <div><span className="section-label">Issued by</span><input type="text" value={formData.issuedBy} onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })} className="profile-input" /></div>}
          {!isStaffView && (
            <>
              <div><span className="section-label">Tags (comma separated)</span><input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="profile-input" placeholder="web, react, design" /></div>
            </>
          )}
          {type === 'project' && <div><span className="section-label">Technologies</span><input type="text" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className="profile-input" placeholder="React, Node.js" /></div>}
          {!isStaffView && (
            <div><span className="section-label">Semester *</span><select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="profile-input">{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}</select></div>
          )}
          {type === 'certificate' && !isStaffView && (
            <div><span className="section-label">Category *</span><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="profile-input"><option value="academic">Academic</option><option value="extra curricular">Extra Curricular</option></select></div>
          )}
          {type === 'certificate' && (
            <div>
              <span className="section-label">Participation Date *</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isDateRange} onChange={(e) => setIsDateRange(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> Date range (from – to)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="profile-input" required style={{ flex: 1 }} />
                {isDateRange && <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="profile-input" style={{ flex: 1 }} />}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 4 }}>Format: DD/MM/YYYY</p>
            </div>
          )}
          <div>
            <span className="section-label">Images (optional – replace all)</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              {selectedFiles.length ? `${selectedFiles.length} selected` : 'Select Images'}
              <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.gif,.webp" multiple />
            </label>
            {previewUrls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, marginTop: 10 }}>
                {previewUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt={`preview ${i+1}`} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                    <button type="button" onClick={() => removeFile(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, background: 'var(--danger)', border: 'none', borderRadius: '50%', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={uploading} className="action-btn-primary" style={{ opacity: uploading ? 0.6 : 1 }}>{uploading ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={handleClose} className="action-btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-20px) scale(0.95); } }
      `}</style>
    </div>
  );
}

// ==================== Main ProfilePage ====================
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const identifier = params?.regNo || '';

  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('certificates');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', interests: '' });
  const { showAlert, AlertComponent } = useCustomAlert();

  const isStaffView = user?.role === 'staff';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setLoggedInUser(parsed);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    if (identifier && identifier !== 'undefined') {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [identifier]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${identifier}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        setEditData({
          bio: data.user.profile?.bio || '',
          interests: data.user.profile?.interests?.join(', ') || '',
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        showAlert('Please log in first', 'error');
        return;
      }
      const loggedInUserData = JSON.parse(userData);
      const response = await fetch(`/api/users/${identifier}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUserData._id,
          role: loggedInUserData.role,
          updates: {
            profile: {
              bio: editData.bio,
              interests: editData.interests
                .split(',')
                .map((i) => i.trim())
                .filter((i) => i),
            },
          },
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
        setIsEditing(false);
        showAlert('Profile updated!', 'success');
      } else {
        showAlert('Failed to update: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showAlert('Error updating profile', 'error');
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        bio: user.profile?.bio || '',
        interests: user.profile?.interests?.join(', ') || '',
      });
    }
    setIsEditing(false);
  };

  const isOwnProfile = loggedInUser && user && (
  loggedInUser._id === user._id ||
  (user.role === 'student' && loggedInUser.registerNumber === user.registerNumber) ||
  (user.role === 'staff' && loggedInUser.staffId === user.staffId)
);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto',
            }}
          />
          <p
            style={{
              marginTop: 16,
              color: 'var(--text-dim)',
              fontSize: 14,
              letterSpacing: '0.05em',
            }}
          >
            Loading profile
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '2.5rem',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--danger-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <svg width="28" height="28" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>User Not Found</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>
            No user found with ID{' '}
            <code style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>{identifier}</code>
          </p>
          <button onClick={() => router.push('/feed')} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 500, cursor: 'pointer', marginBottom: 8, fontSize: 14 }}>Back to Feed</button>
          <button onClick={fetchUserProfile} style={{ width: '100%', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-20px) scale(0.95); } }
        .profile-input {
          width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 8px; padding: 10px 14px; color: var(--input-text);
          font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
          font-family: inherit;
        }
        .profile-input:focus { border-color: var(--input-focus-border); }
        .profile-input::placeholder { color: var(--input-placeholder); }
        .tab-btn {
          background: none; border: none; cursor: pointer; font-size: 12px;
          font-weight: 500; letter-spacing: 0.08em; padding: 14px 20px;
          transition: color 0.2s; position: relative; text-transform: uppercase;
          font-family: inherit;
        }
        .tab-btn.active { color: var(--text-primary); }
        .tab-btn.inactive { color: var(--text-muted); }
        .tab-btn.inactive:hover { color: var(--text-secondary); }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 20px; right: 20px;
          height: 2px; background: var(--primary); border-radius: 2px;
        }
        .action-btn-primary {
          background: var(--btn-primary-bg); color: var(--btn-primary-text); border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.2s; letter-spacing: 0.02em; font-family: inherit;
        }
        .action-btn-primary:hover { background: var(--btn-primary-hover-bg); }
        .action-btn-ghost {
          background: var(--btn-ghost-bg); color: var(--btn-ghost-text); border: 1px solid var(--btn-ghost-border); border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.02em; font-family: inherit;
        }
        .action-btn-ghost:hover { border-color: var(--btn-ghost-hover-border); color: var(--btn-ghost-hover-text); }
        .profile-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 16px; animation: fadeUp 0.4s ease; }
        .tag-chip {
          display: inline-block; background: var(--tag-bg); border: 1px solid var(--tag-border);
          color: var(--tag-text); padding: 3px 10px; border-radius: 999px; font-size: 12px;
          letter-spacing: 0.02em;
        }
        .skill-chip {
          display: inline-block; background: var(--skill-bg); border: 1px solid var(--skill-border);
          color: var(--skill-text); padding: 4px 12px; border-radius: 6px; font-size: 12px; letter-spacing: 0.02em;
        }
        .tech-chip {
          display: inline-block; background: var(--tech-bg); border: 1px solid var(--tech-border);
          color: var(--tech-text); padding: 4px 10px; border-radius: 6px; font-size: 12px;
        }
        .delete-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 13px; transition: color 0.2s; font-family: inherit; padding: 4px; }
        .delete-btn:hover { color: var(--danger); }
        .cert-card {
          background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px;
          transition: border-color 0.2s;
        }
        .cert-card:hover { border-color: var(--card-hover-border); }
        .section-label {
          color: var(--text-dim); font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 10px; display: block;
        }
        @media (max-width: 1024px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .tab-btn { padding: 12px 12px; font-size: 10px; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="profile-card" style={{ padding: '1.75rem 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 14px', background: 'linear-gradient(135deg, var(--primary-soft), var(--primary-soft-border))', border: '1px solid var(--primary-soft-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
                <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{user.name || 'Unknown'}</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 10px', letterSpacing: '0.06em' }}>
                  {user.role === 'staff' ? user.staffId : user.registerNumber}
                </p>
                {user.department && (
                  <span style={{ display: 'inline-block', background: 'var(--primary-soft)', border: '1px solid var(--primary-soft-border)', color: 'var(--primary)', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>{user.department}</span>
                )}
                {user.batchYear && user.role === 'student' && (
                  <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 14px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Batch</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{user.batchYear}</span>
                  </div>
                )}
              </div>

              {!isStaffView && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: '1.25rem' }} />
                  <div style={{ marginBottom: 16 }}>
                    <span className="section-label">About</span>
                    {isEditing ? (
                      <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="profile-input" rows={3} placeholder="Write about yourself..." style={{ resize: 'vertical' }} />
                    ) : (
                      <p style={{ color: user.profile?.bio ? 'var(--text-secondary)' : 'var(--text-dim)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{user.profile?.bio || 'No bio yet.'}</p>
                    )}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <span className="section-label">Interests</span>
                    {isEditing ? (
                      <input type="text" value={editData.interests} onChange={(e) => setEditData({ ...editData, interests: e.target.value })} className="profile-input" placeholder="Design, AI, Web Dev..." />
                    ) : user.profile?.interests?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{user.profile.interests.map((interest, index) => <span key={index} className="tag-chip">{interest}</span>)}</div>
                    ) : (
                      <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>No interests yet.</p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <>
                      <div style={{ height: 1, background: 'var(--border)', marginBottom: '1rem' }} />
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleSave} className="action-btn-primary" style={{ flex: 1 }}>Save</button>
                          <button onClick={handleCancel} className="action-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="action-btn-ghost" style={{ width: '100%' }}>Edit Profile</button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-card" style={{ overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid var(--border)', display: 'flex' }}>
              {!isStaffView ? (
                <>
                  <button onClick={() => setActiveTab('certificates')} className={`tab-btn ${activeTab === 'certificates' ? 'active' : 'inactive'}`}>Certificates</button>
                  <button onClick={() => setActiveTab('projects')} className={`tab-btn ${activeTab === 'projects' ? 'active' : 'inactive'}`}>Projects</button>
                  <button onClick={() => setActiveTab('resume')} className={`tab-btn ${activeTab === 'resume' ? 'active' : 'inactive'}`}>Resume</button>
                </>
              ) : (
                <button className="tab-btn active">Certificates</button>
              )}
            </div>
            <div style={{ padding: '1.75rem' }}>
              {activeTab === 'certificates' && (
                <CertificateSection
                  userId={user._id}
                  isOwnProfile={isOwnProfile}
                  showAlert={showAlert}
                  student={user}
                  loggedInUser={loggedInUser}
                  isStaffView={isStaffView}
                />
              )}
              {!isStaffView && activeTab === 'projects' && (
                <ProjectSection userId={user._id} isOwnProfile={isOwnProfile} showAlert={showAlert} />
              )}
              {!isStaffView && activeTab === 'resume' && (
                <ResumeSection
                  user={user}
                  isOwnProfile={isOwnProfile}
                  regNo={identifier}
                  onUpdate={setUser}
                  showAlert={showAlert}
                  loggedInUser={loggedInUser}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {AlertComponent}
    </div>
  );
}