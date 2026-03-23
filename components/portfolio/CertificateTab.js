"use client";

import { useState, useEffect } from 'react';

export default function CertificateTab({ userId, isOwnProfile = false }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null,
    preview: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // For now, use dummy data
      
      // Simulate API call delay
      setTimeout(() => {
        const dummyCertificates = [
          {
            _id: '1',
            title: 'Web Development Certification',
            description: 'Completed advanced web development course with focus on React and Node.js',
            imageUrl: '/placeholder.png',
            issuedBy: 'Tech Academy',
            date: 'Jan 15, 2024',
            type: 'certificate'
          },
          {
            _id: '2',
            title: 'React Mastery Certificate',
            description: 'Mastered React hooks, context API, and advanced state management',
            imageUrl: '/placeholder.png',
            issuedBy: 'Frontend Masters',
            date: 'Feb 20, 2024',
            type: 'certificate'
          },
          {
            _id: '3',
            title: 'MongoDB Fundamentals',
            description: 'Learned database design, NoSQL concepts, and MongoDB operations',
            imageUrl: '/placeholder.png',
            issuedBy: 'Database University',
            date: 'Mar 10, 2024',
            type: 'certificate'
          }
        ];
        
        setCertificates(dummyCertificates);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      setUploadData({
        ...uploadData,
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.title.trim()) {
      alert('Please enter a certificate title');
      return;
    }
    
    if (!uploadData.file) {
      alert('Please select a certificate image');
      return;
    }

    setUploading(true);
    
    try {
      // TODO: Replace with actual API call
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new certificate object
      const newCertificate = {
        _id: Date.now().toString(),
        title: uploadData.title,
        description: uploadData.description,
        imageUrl: uploadData.preview || '/placeholder.png',
        issuedBy: 'Self Uploaded',
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        type: 'certificate'
      };
      
      // Add to certificates list
      setCertificates(prev => [newCertificate, ...prev]);
      
      // Reset form
      setUploadData({
        title: '',
        description: '',
        file: null,
        preview: null
      });
      setShowUpload(false);
      
      alert('Certificate uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading certificate:', error);
      alert('Failed to upload certificate. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (certificateId) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    try {
      // TODO: Replace with actual API delete call
      // For now, just update local state
      setCertificates(prev => prev.filter(c => c._id !== certificateId));
      alert('Certificate deleted successfully!');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Failed to delete certificate. Please try again.');
    }
  };

  const handleView = (certificate) => {
    // Open certificate in new tab or modal
    window.open(certificate.imageUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
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
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Certificate
          </button>
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Upload New Certificate</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Title *
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Web Development Certification"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="3"
                placeholder="Describe your achievement..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Image *
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {uploadData.file ? uploadData.file.name : 'Choose File'}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                </label>
                {uploadData.preview && (
                  <div className="relative w-20 h-20">
                    <img
                      src={uploadData.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, file: null, preview: null })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload an image of your certificate (PNG, JPG, max 5MB)
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className={`flex items-center gap-2 ${
                  uploading 
                    ? 'bg-emerald-400 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                } text-white px-6 py-2 rounded-lg font-medium transition-colors`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : 'Upload Certificate'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false);
                  setUploadData({
                    title: '',
                    description: '',
                    file: null,
                    preview: null
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

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
          <p className="text-gray-600 mb-4">Start by uploading your first certificate</p>
          {isOwnProfile && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload Certificate
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              {/* Certificate Image */}
              <div 
                className="relative h-48 bg-gray-100 cursor-pointer"
                onClick={() => handleView(cert)}
              >
                <img
                  src={cert.imageUrl}
                  alt={cert.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1 rounded-full text-sm">
                    Click to view
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cert._id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Certificate Details */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{cert.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cert.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Issued by</p>
                    <p className="font-medium">{cert.issuedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{cert.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}