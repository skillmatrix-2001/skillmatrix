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
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={jobQuery}
          onChange={(e) => setJobQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchJobs(); }}
          placeholder="e.g. frontend developer fresher india"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">Search for jobs above to see results.</p>
        </div>
      )}

      {!loading && searched && jobs.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">No jobs found. Try a different search query.</p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {job.employer_logo ? (
                      <img
                        src={job.employer_logo}
                        alt={job.employer_name}
                        className="w-10 h-10 rounded-lg object-contain border border-gray-200 bg-white p-1"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 font-bold">
                          {job.employer_name ? job.employer_name.charAt(0) : 'J'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{job.job_title}</h4>
                      <p className="text-xs text-gray-600">{job.employer_name}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 flex-shrink-0">
                    Job
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                  {job.job_city && (
                    <span>{job.job_city}{job.job_country ? ', ' + job.job_country : ''}</span>
                  )}
                  {job.job_employment_type && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{job.job_employment_type}</span>
                  )}
                  {job.job_posted_at_datetime_utc && (
                    <span>{formatDate(job.job_posted_at_datetime_utc)}</span>
                  )}
                </div>

                {job.job_description && (
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                    {job.job_description.slice(0, 150) + '...'}
                  </p>
                )}

                {job.job_required_skills && job.job_required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.job_required_skills.slice(0, 4).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded text-xs">
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
                    className="inline-block px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    Apply Now
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}