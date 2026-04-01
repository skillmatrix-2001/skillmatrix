"use client";

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ResumeButton from "@/components/ResumeButton";
import { useParams, useRouter } from 'next/navigation';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const regNo = params?.regNo || '';

  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('certificates');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ bio: '', interests: '' });

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
    if (regNo && regNo !== 'undefined') {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [regNo]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${regNo}`);
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
        alert('Please log in first');
        return;
      }
      const loggedInUserData = JSON.parse(userData);
      const response = await fetch(`/api/users/${regNo}`, {
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
        alert('Profile updated!');
      } else {
        alert('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error updating profile');
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

  const isOwnProfile =
    loggedInUser &&
    user &&
    (loggedInUser._id === user._id ||
      loggedInUser.registerNumber === user.registerNumber);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0B0D12',
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
              border: '2px solid #222634',
              borderTopColor: '#7C5CFF',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto',
            }}
          />
          <p
            style={{
              marginTop: 16,
              color: '#6B7280',
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
          background: '#0B0D12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#12151C',
            border: '1px solid #222634',
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
              background: 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#EF4444"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3
            style={{
              color: '#E5E7EB',
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            User Not Found
          </h3>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
            No user found with register number{' '}
            <code
              style={{
                background: '#171B24',
                padding: '2px 8px',
                borderRadius: 4,
                color: '#9CA3AF',
              }}
            >
              {regNo}
            </code>
          </p>
          <button
            onClick={() => router.push('/feed')}
            style={{
              width: '100%',
              background: '#7C5CFF',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            Back to Feed
          </button>
          <button
            onClick={fetchUserProfile}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#9CA3AF',
              border: '1px solid #222634',
              borderRadius: 8,
              padding: '10px 0',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D12' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .profile-input {
          width: 100%; background: #0B0D12; border: 1px solid #222634;
          border-radius: 8px; padding: 10px 14px; color: #E5E7EB;
          font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
          font-family: inherit;
        }
        .profile-input:focus { border-color: #7C5CFF; }
        .profile-input::placeholder { color: #6B7280; }
        .tab-btn {
          background: none; border: none; cursor: pointer; font-size: 12px;
          font-weight: 500; letter-spacing: 0.08em; padding: 14px 20px;
          transition: color 0.2s; position: relative; text-transform: uppercase;
          font-family: inherit;
        }
        .tab-btn.active { color: #E5E7EB; }
        .tab-btn.inactive { color: #6B7280; }
        .tab-btn.inactive:hover { color: #9CA3AF; }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 20px; right: 20px;
          height: 2px; background: #7C5CFF; border-radius: 2px;
        }
        .action-btn-primary {
          background: #7C5CFF; color: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.2s; letter-spacing: 0.02em; font-family: inherit;
        }
        .action-btn-primary:hover { background: #6d4fe0; }
        .action-btn-ghost {
          background: transparent; color: #9CA3AF; border: 1px solid #222634; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.02em; font-family: inherit;
        }
        .action-btn-ghost:hover { border-color: #9CA3AF; color: #E5E7EB; }
        .profile-card { background: #12151C; border: 1px solid #222634; border-radius: 16px; animation: fadeUp 0.4s ease; }
        .tag-chip {
          display: inline-block; background: #171B24; border: 1px solid #222634;
          color: #9CA3AF; padding: 3px 10px; border-radius: 999px; font-size: 12px;
          letter-spacing: 0.02em;
        }
        .skill-chip {
          display: inline-block; background: rgba(124,92,255,0.1); border: 1px solid rgba(124,92,255,0.2);
          color: #a78bfa; padding: 4px 12px; border-radius: 6px; font-size: 12px; letter-spacing: 0.02em;
        }
        .tech-chip {
          display: inline-block; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);
          color: #4ade80; padding: 4px 10px; border-radius: 6px; font-size: 12px;
        }
        .delete-btn { background: none; border: none; cursor: pointer; color: #6B7280; font-size: 13px; transition: color 0.2s; font-family: inherit; padding: 4px; }
        .delete-btn:hover { color: #EF4444; }
        .cert-card {
          background: #171B24; border: 1px solid #222634; border-radius: 12px; padding: 18px;
          transition: border-color 0.2s;
        }
        .cert-card:hover { border-color: #2d3148; }
        .section-label {
          color: #6B7280; font-size: 11px; text-transform: uppercase;
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
        <div
          className="profile-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '290px 1fr',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="profile-card" style={{ padding: '1.75rem 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    margin: '0 auto 14px',
                    background:
                      'linear-gradient(135deg, rgba(124,92,255,0.25), rgba(124,92,255,0.05))',
                    border: '1px solid rgba(124,92,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#7C5CFF',
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <h1
                  style={{
                    color: '#E5E7EB',
                    fontSize: 18,
                    fontWeight: 700,
                    margin: '0 0 4px',
                  }}
                >
                  {user.name || 'Unknown'}
                </h1>
                <p
                  style={{
                    color: '#6B7280',
                    fontSize: 12,
                    margin: '0 0 10px',
                    letterSpacing: '0.06em',
                  }}
                >
                  {user.registerNumber || user.staffId}
                </p>
                {user.department && (
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(124,92,255,0.1)',
                      border: '1px solid rgba(124,92,255,0.2)',
                      color: '#a78bfa',
                      padding: '3px 12px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {user.department}
                  </span>
                )}
                {user.batchYear && (
                  <div
                    style={{
                      marginTop: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#171B24',
                      border: '1px solid #222634',
                      borderRadius: 8,
                      padding: '5px 14px',
                    }}
                  >
                    <span
                      style={{
                        color: '#6B7280',
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Batch
                    </span>
                    <span style={{ color: '#E5E7EB', fontSize: 12, fontWeight: 600 }}>
                      {user.batchYear}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: '#222634', marginBottom: '1.25rem' }} />

              <div style={{ marginBottom: 16 }}>
                <span className="section-label">About</span>
                {isEditing ? (
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="profile-input"
                    rows={3}
                    placeholder="Write about yourself..."
                    style={{ resize: 'vertical' }}
                  />
                ) : (
                  <p
                    style={{
                      color: user.profile?.bio ? '#9CA3AF' : '#6B7280',
                      fontSize: 13,
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {user.profile?.bio || 'No bio yet.'}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <span className="section-label">Interests</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.interests}
                    onChange={(e) =>
                      setEditData({ ...editData, interests: e.target.value })
                    }
                    className="profile-input"
                    placeholder="Design, AI, Web Dev..."
                  />
                ) : user.profile?.interests?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {user.profile.interests.map((interest, index) => (
                      <span key={index} className="tag-chip">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
                    No interests yet.
                  </p>
                )}
              </div>

              {isOwnProfile && (
                <>
                  <div
                    style={{ height: 1, background: '#222634', marginBottom: '1rem' }}
                  />
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSave} className="action-btn-primary" style={{ flex: 1 }}>
                        Save
                      </button>
                      <button onClick={handleCancel} className="action-btn-ghost" style={{ flex: 1 }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="action-btn-ghost"
                      style={{ width: '100%' }}
                    >
                      Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-card" style={{ overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid #222634', display: 'flex' }}>
              {[
                { id: 'certificates', label: 'Certificates' },
                { id: 'projects', label: 'Projects' },
                { id: 'resume', label: 'Resume' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`tab-btn ${activeTab === id ? 'active' : 'inactive'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ padding: '1.75rem' }}>
              {activeTab === 'certificates' && (
                <CertificateSection userId={user._id} isOwnProfile={isOwnProfile} />
              )}
              {activeTab === 'projects' && (
                <ProjectSection userId={user._id} isOwnProfile={isOwnProfile} />
              )}
              {activeTab === 'resume' && (
                <div>
                  <ResumeSection
                    user={user}
                    isOwnProfile={isOwnProfile}
                    regNo={regNo}
                    onUpdate={setUser}
                  />
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 24,
                      borderTop: '1px solid #222634',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <ResumeButton regNo={regNo} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── ResumeSection (unchanged) ──────────────────── */
function ResumeSection({ user, isOwnProfile, regNo, onUpdate }) {
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
            },
          },
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdate(data.user);
        setIsEditing(false);
        alert('Resume updated!');
      } else {
        alert('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error updating resume');
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
    });
    setIsEditing(false);
  };

  const profile = user?.profile || {};

  const Block = ({ title, children }) => (
    <div
      style={{
        background: '#171B24',
        border: '1px solid #222634',
        borderRadius: 12,
        padding: '1.25rem',
        marginBottom: 12,
      }}
    >
      <span
        style={{
          color: '#6B7280',
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

  return (
    <div>
      {isOwnProfile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="action-btn-primary"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Resume'}
              </button>
              <button onClick={handleCancel} className="action-btn-ghost">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="action-btn-ghost">
              Edit Resume
            </button>
          )}
        </div>
      )}

      <Block title="Designation">
        {isEditing ? (
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            placeholder="e.g. Frontend Developer"
            className="profile-input"
          />
        ) : (
          <p
            style={{
              color: profile.designation ? '#E5E7EB' : '#6B7280',
              fontSize: 14,
              margin: 0,
            }}
          >
            {profile.designation || 'Not specified'}
          </p>
        )}
      </Block>

      <Block title="Summary">
        {isEditing ? (
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Write a short professional summary..."
            className="profile-input"
            rows={4}
            style={{ resize: 'vertical' }}
          />
        ) : (
          <p
            style={{
              color: profile.summary ? '#9CA3AF' : '#6B7280',
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {profile.summary || 'No summary yet.'}
          </p>
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
                <span style={{ color: '#6B7280', fontSize: 12, width: 68, flexShrink: 0 }}>
                  {label}
                </span>
                <input
                  type="url"
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="profile-input"
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#9CA3AF',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {profile.github}
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#9CA3AF',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <svg width="15" height="15" fill="#60a5fa" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                {profile.linkedin}
              </a>
            )}
            {profile.portfolio && (
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#9CA3AF',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                {profile.portfolio}
              </a>
            )}
            {!profile.github && !profile.linkedin && !profile.portfolio && (
              <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>No links added yet.</p>
            )}
          </div>
        )}
      </Block>

      <Block title="Skills">
        {isEditing ? (
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="React, Node.js, Python…"
            className="profile-input"
          />
        ) : profile.skills?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile.skills.map((s, i) => (
              <span key={i} className="skill-chip">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>No skills added yet.</p>
        )}
      </Block>

      <Block title="Internships & Experience">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.experience.map((exp, index) => (
              <div
                key={index}
                style={{
                  background: '#0B0D12',
                  border: '1px solid #222634',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>Entry {index + 1}</span>
                  {formData.experience.length > 1 && (
                    <button onClick={() => removeExperience(index)} className="delete-btn">
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="Company Name"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateExperience(index, 'role', e.target.value)}
                    placeholder="Role / Position"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                    placeholder="Jan 2024 – Mar 2024"
                    className="profile-input"
                  />
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    placeholder="What did you do?"
                    className="profile-input"
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addExperience}
              style={{
                background: 'none',
                border: '1px dashed #222634',
                borderRadius: 8,
                padding: '10px',
                color: '#7C5CFF',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Add Experience
            </button>
          </div>
        ) : profile.experience?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.experience.map((exp, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid rgba(124,92,255,0.3)' }}>
                <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                  {exp.role}
                </p>
                <p style={{ color: '#7C5CFF', fontSize: 13, margin: '0 0 3px' }}>{exp.company}</p>
                {exp.duration && (
                  <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 6px' }}>{exp.duration}</p>
                )}
                {exp.description && (
                  <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>No experience added yet.</p>
        )}
      </Block>

      <Block title="Education">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.education.map((edu, index) => (
              <div
                key={index}
                style={{
                  background: '#0B0D12',
                  border: '1px solid #222634',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>Entry {index + 1}</span>
                  {formData.education.length > 1 && (
                    <button onClick={() => removeEducation(index)} className="delete-btn">
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    placeholder="Institution Name"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="Degree / Course"
                    className="profile-input"
                  />
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    placeholder="2020 – 2024"
                    className="profile-input"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addEducation}
              style={{
                background: 'none',
                border: '1px dashed #222634',
                borderRadius: 8,
                padding: '10px',
                color: '#7C5CFF',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Add Education
            </button>
          </div>
        ) : profile.education?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.education.map((edu, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: '2px solid rgba(34,197,94,0.3)' }}>
                <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                  {edu.degree}
                </p>
                <p style={{ color: '#22C55E', fontSize: 13, margin: '0 0 3px' }}>{edu.institution}</p>
                {edu.year && (
                  <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>{edu.year}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>No education added yet.</p>
        )}
      </Block>
    </div>
  );
}

/* ──────────────────── Helper: Download all images as ZIP (for projects) ──────────────────── */
async function downloadAllImages(images, title) {
  if (!images || images.length === 0) {
    alert('No images to download.');
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
}

/* ──────────────────── ImageCarousel for Project Cards (fixed) ──────────────────── */
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

/* ──────────────────── CertificateSection (with fixed download and column layout) ──────────────────── */
function CertificateSection({ userId, isOwnProfile }) {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', issuedBy: '', tags: '', semester: '1' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

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
      alert('Please select a valid image file');
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
      alert('Please fill all required fields');
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
      fd.append('tags', formData.tags);
      fd.append('semester', formData.semester);
      fd.append('files', selectedFile);
      const response = await fetch('/api/posts/upload', { method: 'POST', body: fd });
      const data = await response.json();
      if (response.ok && data.success) {
        setCertificates([{ ...data.post, createdAt: data.post.createdAt || new Date().toISOString() }, ...certificates]);
        setShowForm(false);
        setFormData({ title: '', description: '', issuedBy: '', tags: '', semester: '1' });
        clearFile();
        alert('Certificate uploaded!');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this certificate?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setCertificates(certificates.filter((c) => c._id !== postId));
      } else {
        alert('Delete failed');
      }
    } catch {
      alert('Network error');
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
  };

  // Fixed download: fetch as blob and trigger download
  const handleDownload = async (cert) => {
    const imageUrl = cert.media?.[0]?.url;
    if (!imageUrl) {
      alert('No image to download');
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
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image');
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid #222634',
            borderTopColor: '#7C5CFF',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }}
        />
      </div>
    );

  return (
    <>
      {isOwnProfile && !showForm && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowForm(true)} className="action-btn-primary">
            + Add Certificate
          </button>
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: '#171B24',
            border: '1px solid #222634',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: 20,
          }}
        >
          <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
            Upload Certificate
          </p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Title *', key: 'title', placeholder: 'Web Development Certification' },
              { label: 'Issued by', key: 'issuedBy', placeholder: 'University / Platform' },
              { label: 'Tags', key: 'tags', placeholder: 'React, Frontend, Web Dev' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <span
                  style={{
                    color: '#6B7280',
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
                  color: '#6B7280',
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
                placeholder="Describe the certificate…"
                className="profile-input"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <span
                style={{
                  color: '#6B7280',
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
                  color: '#6B7280',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Image *
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0B0D12',
                  border: '1px solid #222634',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
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
                {selectedFile ? selectedFile.name.substring(0, 24) + '…' : 'Choose File'}
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={clearFile}
                  style={{
                    marginLeft: 10,
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Remove
                </button>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    display: 'block',
                    maxHeight: 100,
                    marginTop: 10,
                    borderRadius: 8,
                    border: '1px solid #222634',
                  }}
                />
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
                  clearFile();
                  setFormData({ title: '', description: '', issuedBy: '', tags: '', semester: '1' });
                }}
                className="action-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {certificates.length === 0 ? (
        <EmptyState
          icon={
            <svg width="22" height="22" fill="none" stroke="#6B7280" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
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
                  <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                    {cert.title || 'Untitled'}
                  </p>
                  {cert.semester && (
                    <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>Semester {cert.semester}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === cert._id ? null : cert._id)}
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 16, color: '#9CA3AF' }}
                    >
                      ⋮
                    </button>
                    {activeDropdownId === cert._id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 24,
                          background: '#171B24',
                          border: '1px solid #222634',
                          borderRadius: 8,
                          zIndex: 10,
                          minWidth: 90,
                        }}
                      >
                        <button
                          onClick={() => handleEdit(cert)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#E5E7EB',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 13,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDownload(cert)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#E5E7EB',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 13,
                          }}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
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
              {cert.issuedBy && (
                <p style={{ color: '#7C5CFF', fontSize: 13, margin: '0 0 4px' }}>{cert.issuedBy}</p>
              )}
              <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                {cert.description}
              </p>
              {cert.media?.[0]?.url && (
                <div
                  style={{ marginBottom: 10, cursor: 'pointer', overflow: 'hidden', borderRadius: 8 }}
                  onClick={() => {
                    setSelectedCertificate(cert);
                    setModalOpen(true);
                  }}
                >
                  <img
                    src={cert.media[0].url}
                    alt={cert.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 8,
                      transition: 'transform 0.3s',
                    }}
                    onMouseOver={(e) => (e.target.style.transform = 'scale(1.02)')}
                    onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                  />
                </div>
              )}
              {cert.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                  {cert.tags.map((tag, i) => (
                    <span key={i} className="tag-chip" style={{ fontSize: 10 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          ))}
        </div>
      )}

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedCertificate}
        type="certificate"
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        item={editItem}
        type="certificate"
        onSave={handleEditSave}
      />
    </>
  );
}

/* ──────────────────── ProjectSection (unchanged except download uses helper) ──────────────────── */
function ProjectSection({ userId, isOwnProfile }) {
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
      alert('Please fill all required fields and add at least one image');
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
        alert('Project uploaded!');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setProjects(projects.filter((p) => p._id !== postId));
      } else {
        alert('Delete failed');
      }
    } catch {
      alert('Network error');
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
  };

  const handleDownload = (project) => {
    const images = project.media || [];
    if (images.length === 0) {
      alert('No images to download');
      return;
    }
    downloadAllImages(images, project.title || 'project');
  };

  const handleImageClick = (project, idx) => {
    setSelectedProject(project);
    setSelectedImageIndex(idx);
    setModalOpen(true);
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid #222634',
            borderTopColor: '#22C55E',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }}
        />
      </div>
    );

  return (
    <>
      {isOwnProfile && !showForm && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowForm(true)} className="action-btn-primary">
            + Add Project
          </button>
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: '#171B24',
            border: '1px solid #222634',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: 20,
          }}
        >
          <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
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
                    color: '#6B7280',
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
                  color: '#6B7280',
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
                  color: '#6B7280',
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
                  color: '#6B7280',
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
                  background: '#0B0D12',
                  border: '1px solid #222634',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
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
                <span style={{ marginLeft: 10, color: '#9CA3AF', fontSize: 12 }}>
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
                          border: '1px solid #222634',
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
                          background: '#EF4444',
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
            <svg width="22" height="22" fill="none" stroke="#6B7280" viewBox="0 0 24 24">
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
                  <p style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>
                    {project.title || 'Untitled'}
                  </p>
                  {project.semester && (
                    <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>Semester {project.semester}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === project._id ? null : project._id)}
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 16, color: '#9CA3AF' }}
                    >
                      ⋮
                    </button>
                    {activeDropdownId === project._id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 24,
                          background: '#171B24',
                          border: '1px solid #222634',
                          borderRadius: 8,
                          zIndex: 10,
                          minWidth: 90,
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
                            color: '#E5E7EB',
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
                            color: '#E5E7EB',
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
                            color: '#EF4444',
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
              <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
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
              <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
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
      />
    </>
  );
}

/* ──────────────────── EmptyState ──────────────────── */
function EmptyState({ icon, title, desc, action, actionLabel }) {
  return (
    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#171B24',
          border: '1px solid #222634',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        {icon}
      </div>
      <p style={{ color: '#E5E7EB', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{title}</p>
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: action ? 18 : 0 }}>{desc}</p>
      {action && (
        <button onClick={action} className="action-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ──────────────────── ImageModal ──────────────────── */
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
                  <span key={i} className="tech-chip">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {type === 'certificate' && item.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {item.tags.map((tag, i) => (
                  <span key={i} className="tag-chip" style={{ fontSize: 11 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── EditModal (shared) ──────────────────── */
function EditModal({ isOpen, onClose, item, type, onSave }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    issuedBy: item?.issuedBy || '',
    tags: item?.tags?.join(', ') || '',
    techStack: item?.techStack?.join(', ') || '',
    semester: item?.semester?.toString() || '1',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        issuedBy: item.issuedBy || '',
        tags: item.tags?.join(', ') || '',
        techStack: item.techStack?.join(', ') || '',
        semester: item.semester?.toString() || '1',
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('semester', formData.semester);
      if (type === 'certificate') {
        fd.append('issuedBy', formData.issuedBy);
        fd.append('tags', formData.tags);
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
        onClose();
      } else {
        alert('Update failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#12151C',
          border: '1px solid #222634',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: '#E5E7EB', fontSize: 16, fontWeight: 600, margin: 0 }}>
            Edit {type === 'certificate' ? 'Certificate' : 'Project'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span
              style={{
                color: '#6B7280',
                fontSize: 11,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Title *
            </span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="profile-input"
              required
            />
          </div>
          <div>
            <span
              style={{
                color: '#6B7280',
                fontSize: 11,
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
              className="profile-input"
              rows={3}
              required
            />
          </div>
          {type === 'certificate' && (
            <div>
              <span
                style={{
                  color: '#6B7280',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Issued by
              </span>
              <input
                type="text"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                className="profile-input"
              />
            </div>
          )}
          <div>
            <span
              style={{
                color: '#6B7280',
                fontSize: 11,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Tags (comma separated)
            </span>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="profile-input"
              placeholder="web, react, design"
            />
          </div>
          {type === 'project' && (
            <div>
              <span
                style={{
                  color: '#6B7280',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Technologies
              </span>
              <input
                type="text"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="profile-input"
                placeholder="React, Node.js"
              />
            </div>
          )}
          <div>
            <span
              style={{
                color: '#6B7280',
                fontSize: 11,
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
                color: '#6B7280',
                fontSize: 11,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Images (optional – replace all)
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0B0D12',
                border: '1px solid #222634',
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                color: '#9CA3AF',
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
              {selectedFiles.length ? `${selectedFiles.length} selected` : 'Select Images'}
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                multiple
              />
            </label>
            {previewUrls.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {previewUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`preview ${i + 1}`}
                      style={{
                        width: '100%',
                        height: 70,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid #222634',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        background: '#EF4444',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              disabled={uploading}
              className="action-btn-primary"
              style={{ opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="action-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}