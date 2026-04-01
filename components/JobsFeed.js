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
      {/* Search bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={jobQuery}
          onChange={(e) => setJobQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchJobs(); }}
          placeholder="e.g. frontend developer fresher india"
          style={{
            flex: 1,
            background: '#0B0D12',
            border: '1px solid #222634',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#E5E7EB',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={fetchJobs}
          disabled={loading}
          style={{
            background: '#7C5CFF',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => { if (!loading) e.target.style.background = '#6d4fe0'; }}
          onMouseOut={(e) => { if (!loading) e.target.style.background = '#7C5CFF'; }}
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
              style={{
                background: '#171B24',
                border: '1px solid #222634',
                borderRadius: 12,
                padding: 18,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0B0D12' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '70%', height: 16, background: '#0B0D12', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: '50%', height: 12, background: '#0B0D12', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: '80%', height: 12, background: '#0B0D12', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 12, background: '#0B0D12', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && !searched && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: '#6B7280', fontSize: 13 }}>Search for jobs above to see results.</p>
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: '#6B7280', fontSize: 13 }}>No jobs found. Try a different search query.</p>
        </div>
      )}

      {/* Jobs list */}
      {!loading && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job, index) => (
            <div
              key={index}
              style={{
                background: '#171B24',
                border: '1px solid #222634',
                borderRadius: 12,
                padding: 18,
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2d3148'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#222634'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {job.employer_logo ? (
                    <img
                      src={job.employer_logo}
                      alt={job.employer_name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        objectFit: 'contain',
                        border: '1px solid #222634',
                        background: '#0B0D12',
                        padding: 4,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'rgba(124,92,255,0.1)',
                        border: '1px solid rgba(124,92,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14 }}>
                        {job.employer_name ? job.employer_name.charAt(0).toUpperCase() : 'J'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                      {job.job_title}
                    </h4>
                    <p style={{ color: '#9CA3AF', fontSize: 12 }}>{job.employer_name}</p>
                  </div>
                </div>
                <span
                  style={{
                    background: 'rgba(124,92,255,0.1)',
                    color: '#a78bfa',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Job
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
                {job.job_city && (
                  <span style={{ color: '#6B7280', fontSize: 12 }}>
                    {job.job_city}{job.job_country ? ', ' + job.job_country : ''}
                  </span>
                )}
                {job.job_employment_type && (
                  <span
                    style={{
                      background: '#0B0D12',
                      border: '1px solid #222634',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      color: '#9CA3AF',
                    }}
                  >
                    {job.job_employment_type}
                  </span>
                )}
                {job.job_posted_at_datetime_utc && (
                  <span style={{ color: '#6B7280', fontSize: 11 }}>{formatDate(job.job_posted_at_datetime_utc)}</span>
                )}
              </div>

              {job.job_description && (
                <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                  {job.job_description.slice(0, 150) + '...'}
                </p>
              )}

              {job.job_required_skills && job.job_required_skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
                  {job.job_required_skills.slice(0, 4).map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#0B0D12',
                        border: '1px solid #222634',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        color: '#9CA3AF',
                      }}
                    >
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
                  style={{
                    display: 'inline-block',
                    background: '#7C5CFF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 16px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => { e.target.style.background = '#6d4fe0'; }}
                  onMouseOut={(e) => { e.target.style.background = '#7C5CFF'; }}
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