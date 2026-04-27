"use client";

import { useState } from 'react';

export default function JobsFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobQuery, setJobQuery] = useState('software developer fresher india');
  const [searched, setSearched] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs?query=' + encodeURIComponent(jobQuery));
      const data = await res.json();
      if (data.success) setJobs(data.jobs || []);
      setSearched(true);
    } catch (err) {
      console.error('Jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / 86400000);
      if (diffDays === 0) return 'Today';
      if (diffDays < 7) return diffDays + 'd ago';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div>
      <style jsx>{`
        .jobs-search-input {
          flex: 1;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--input-text);
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .jobs-search-input:focus {
          border-color: var(--input-focus-border);
        }
        .jobs-search-input::placeholder {
          color: var(--input-placeholder);
        }
        .jobs-search-btn {
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
          white-space: nowrap;
        }
        .jobs-search-btn:hover:not(:disabled) {
          background: var(--btn-primary-hover-bg);
        }
        .jobs-search-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .job-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 18px;
          transition: border-color 0.2s;
        }
        .job-card:hover {
          border-color: var(--card-hover-border);
        }
        .job-company-logo-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--primary-soft);
          border: 1px solid var(--primary-soft-border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .job-company-logo {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: contain;
          border: 1px solid var(--border);
          background: var(--surface-1);
          padding: 4px;
        }
        .job-title {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .job-employer {
          color: var(--text-secondary);
          font-size: 12px;
        }
        .job-badge {
          background: var(--primary-soft);
          color: var(--primary);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .job-meta {
          color: var(--text-dim);
          font-size: 12px;
        }
        .job-type-tag {
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .job-description {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .job-skill-tag {
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .job-apply-btn {
          display: inline-block;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          border-radius: 6px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
          font-family: inherit;
        }
        .job-apply-btn:hover {
          background: var(--btn-primary-hover-bg);
        }
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Search bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={jobQuery}
          onChange={(e) => setJobQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchJobs(); }}
          placeholder="e.g. frontend developer fresher india"
          className="jobs-search-input"
        />
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="jobs-search-btn"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="job-card skeleton"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '70%', height: 16, background: 'var(--surface-2)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: '50%', height: 12, background: 'var(--surface-2)', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: '80%', height: 12, background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 12, background: 'var(--surface-2)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !searched && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Search for jobs above to see results.</p>
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>No jobs found. Try a different search query.</p>
        </div>
      )}

      {/* Jobs list */}
      {!loading && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job, index) => (
            <div key={index} className="job-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {job.employer_logo ? (
                    <img
                      src={job.employer_logo}
                      alt={job.employer_name}
                      className="job-company-logo"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="job-company-logo-placeholder">
                      <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
                        {job.employer_name ? job.employer_name.charAt(0).toUpperCase() : 'J'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="job-title">{job.job_title}</h4>
                    <p className="job-employer">{job.employer_name}</p>
                  </div>
                </div>
                <span className="job-badge">Job</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
                {job.job_city && (
                  <span className="job-meta">
                    {job.job_city}{job.job_country ? ', ' + job.job_country : ''}
                  </span>
                )}
                {job.job_employment_type && (
                  <span className="job-type-tag">
                    {job.job_employment_type}
                  </span>
                )}
                {job.job_posted_at_datetime_utc && (
                  <span className="job-meta">{formatDate(job.job_posted_at_datetime_utc)}</span>
                )}
              </div>

              {job.job_description && (
                <p className="job-description">
                  {job.job_description.slice(0, 150) + '...'}
                </p>
              )}

              {job.job_required_skills && job.job_required_skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
                  {job.job_required_skills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="job-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {job.job_apply_link && (
                <a
                  href={job.job_apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="job-apply-btn"
                >
                  Apply Now
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}