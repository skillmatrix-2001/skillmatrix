"use client";

import { useState, useEffect } from 'react';

export default function ProjectTab({ userId, isOwnProfile = false }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    techStack: '',
    files: [],
    previews: []
  });

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // In the future, replace with: fetch(`/api/posts?userId=${userId}&type=project`)
      // For now, show placeholder data
      
      // Simulate API call
      setTimeout(() => {
        // Dummy data - replace with real API call
        const dummyProjects = [
          {
            _id: '1',
            title: 'E-commerce Platform',
            description: 'Full-featured online shopping platform with cart, payment, and admin dashboard',
            techStack: ['React', 'Node.js', 'MongoDB', 'Express'],
            images: ['/placeholder.png', '/placeholder.png'],
            date: '2024-01-10',
            type: 'project',
            githubUrl: 'https://github.com/username/ecommerce'
          },
          {
            _id: '2',
            title: 'Task Management App',
            description: 'Collaborative task management with real-time updates and team features',
            techStack: ['Next.js', 'Socket.io', 'PostgreSQL', 'Tailwind'],
            images: ['/placeholder.png'],
            date: '2024-02-15',
            type: 'project',
            liveUrl: 'https://taskapp.example.com'
          },
          {
            _id: '3',
            title: 'Portfolio Website',
            description: 'Responsive portfolio website with dark mode and animation effects',
            techStack: ['React', 'Framer Motion', 'CSS3', 'Vite'],
            images: ['/placeholder.png', '/placeholder.png', '/placeholder.png'],
            date: '2024-03-01',
            type: 'project'
          }
        ];
        
        setProjects(dummyProjects);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setUploadData({
      ...uploadData,
      files: [...uploadData.files, ...files],
      previews: [...uploadData.previews, ...newPreviews]
    });
  };

  const removeFile = (index) => {
    const newFiles = [...uploadData.files];
    const newPreviews = [...uploadData.previews];
    
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setUploadData({
      ...uploadData,
      files: newFiles,
      previews: newPreviews
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.title.trim() || uploadData.files.length === 0) {
      alert('Please fill all required fields and upload at least one file');
      return;
    }

    // TODO: Implement actual upload
    alert('Upload feature coming soon!');
    setShowUpload(false);
    setUploadData({
      title: '',
      description: '',
      techStack: '',
      files: [],
      previews: []
    });
  };

  const handleDelete = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      // TODO: Implement actual delete
      setProjects(projects.filter(p => p._id !== projectId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Upload Button */}
      {isOwnProfile && !showUpload && (
        <div className="mb-6">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Upload New Project</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., E-commerce Platform"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Describe your project..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tech Stack (comma separated)
              </label>
              <input
                type="text"
                value={uploadData.techStack}
                onChange={(e) => setUploadData({ ...uploadData, techStack: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., React, Node.js, MongoDB, Express"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Images/Videos *
              </label>
              <div className="mt-2">
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-gray-700 font-medium">Choose Files</span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                </label>
                
                {/* File Previews */}
                {uploadData.previews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 mb-2">
                      {uploadData.files.length} file(s) selected
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {uploadData.previews.map((preview, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            {uploadData.files[index].type.startsWith('image/') ? (
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {uploadData.files[index].name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload images or videos of your project (max 10 files)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Upload Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false);
                  setUploadData({
                    title: '',
                    description: '',
                    techStack: '',
                    files: [],
                    previews: []
                  });
                }}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-4">Showcase your technical projects here</p>
          {isOwnProfile && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload Project
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Project Images Carousel */}
              {project.images && project.images.length > 0 && (
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  {project.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      +{project.images.length - 1} more
                    </div>
                  )}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {/* Project Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-xl font-medium text-gray-900 mb-1">{project.title}</h4>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {project.date}
                  </span>
                </div>
                
                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Links */}
                <div className="flex gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="text-sm">GitHub</span>
                    </a>
                  )}
                  
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-sm">Live Demo</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}