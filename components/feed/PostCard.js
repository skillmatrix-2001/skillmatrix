"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PostCard({ post, user }) {
  const [expanded, setExpanded] = useState(false);
  const isCertificate = post.type === 'certificate';

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow fade-in">
      {/* User info header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.profile?.profilePic && user.profile.profilePic !== '/placeholder.png' ? (
                <Image
                  src={user.profile.profilePic}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <Link 
                href={`/profile/${user.registerNumber || user.staffId}`}
                className="font-medium text-gray-900 hover:text-emerald-600 truncate"
              >
                {user.name}
              </Link>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {user.registerNumber || user.staffId}
              </span>
            </div>
            <div className="flex items-center mt-1">
              <span 
                className="inline-block px-2 py-1 text-xs font-medium rounded-full mr-2"
                style={{
                  backgroundColor: `${user.departmentColor || '#10b981'}20`,
                  color: user.departmentColor || '#10b981'
                }}
              >
                {user.department}
              </span>
              {user.batchYear && (
                <span className="text-xs text-gray-500">
                  Batch {user.batchYear}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Post content */}
      <div className="p-4">
        <div className="mb-4">
          <p className={`text-gray-700 ${!expanded && 'line-clamp-3'}`}>
            {post.description}
          </p>
          {post.description.length > 150 && (
            <button
              onClick={toggleExpand}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Media display */}
        {post.media && post.media.length > 0 && (
          <div className="mt-4">
            {isCertificate ? (
              // Certificate - single image
              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Certificate</span>
                  </div>
                </div>
              </div>
            ) : (
              // Project - media gallery
              <div className="grid grid-cols-2 gap-2">
                {post.media.slice(0, 4).map((media, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                      index === 3 && post.media.length > 4 ? 'opacity-90' : ''
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {media.type === 'image' ? (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {index === 3 && post.media.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{post.media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post type badge */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isCertificate 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isCertificate ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Certificate
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Project
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}