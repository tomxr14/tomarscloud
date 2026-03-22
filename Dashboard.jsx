import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// File type icons
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    // Images
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
    // Documents
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📝', 'md': '📝',
    // Spreadsheets
    'xls': '📊', 'xlsx': '📊', 'csv': '📊',
    // Videos
    'mp4': '🎬', 'mov': '🎬', 'avi': '🎬', 'mkv': '🎬', 'webm': '🎬',
    // Audio
    'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'm4a': '🎵',
    // Archives
    'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦',
    // Code
    'js': '💻', 'py': '💻', 'html': '💻', 'css': '💻', 'json': '💻',
  };
  return icons[ext] || '📄';
};

export const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('date'); // date, name, size, type
  const [filterType, setFilterType] = useState('all'); // all, image, document, video, etc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showNavMenu, setShowNavMenu] = useState(true);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [shareModal, setShareModal] = useState(null); // { fileId, filename } or null
  const [shareUrl, setShareUrl] = useState('');
  const { token, logout, user } = useAuth();

  useEffect(() => {
    loadFiles();
    loadStorageInfo();
  }, [currentFolder]);

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const handleRestore = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        loadFiles();
        loadStorageInfo();
        alert('File restored from trash');
      }
    } catch (err) {
      console.error('Restore error:', err);
      alert('Failed to restore file');
    }
  };

  const handlePermanentDelete = async (fileId) => {
    if (!window.confirm('Permanently delete this file? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        loadFiles();
        loadStorageInfo();
        alert('File permanently deleted');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete file');
    }
  };

  const handleShare = async (fileId, filename) => {
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ access: 'download' })
      });
      const data = await response.json();
      setShareModal({ fileId, filename });
      setShareUrl(data.shareUrl);
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to create share link');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };


  const loadFiles = async () => {
    try {
      const endpoint = currentFolder === 'trash' ? '/api/trash' : '/api/files';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/storage-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStorageInfo(data);
    } catch (err) {
      console.error('Error loading storage info:', err);
    }
  };

  const handleFileUpload = async (uploadedFiles) => {
    setUploading(true);
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setUploading(false);
    loadFiles();
    loadStorageInfo();
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Delete this file?')) {
      try {
        await fetch(`${API_BASE}/file/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        loadFiles();
        loadStorageInfo();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const storagePercent = storageInfo ? (storageInfo.usedStorage / storageInfo.totalStorage) * 100 : 0;

  // Filter & search files
  const getFilteredFiles = () => {
    let filtered = files.filter(f => {
      const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterType === 'all') return matchesSearch;
      
      const ext = f.filename.split('.').pop()?.toLowerCase();
      const types = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        document: ['pdf', 'doc', 'docx', 'txt', 'md'],
        video: ['mp4', 'mov', 'avi', 'mkv'],
        audio: ['mp3', 'wav', 'flac']
      };
      
      return matchesSearch && types[filterType]?.includes(ext);
    });

    // Sort files
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (sortBy === 'size') {
      filtered.sort((a, b) => b.size - a.size);
    } else if (sortBy === 'type') {
      filtered.sort((a, b) => {
        const extA = a.filename.split('.').pop();
        const extB = b.filename.split('.').pop();
        return extA.localeCompare(extB);
      });
    } else {
      // date (default)
      filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }

    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☁️</span>
            <h1 className="text-xl font-bold text-gray-800">TomarsCloud</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {[
            { name: 'iCloud Drive', icon: '☁️', id: 'all' },
            { name: 'Recents', icon: '⏱️', id: 'recents' },
            { name: 'Images', icon: '🖼️', id: 'images' },
            { name: 'Documents', icon: '📝', id: 'documents' },
            { name: 'Videos', icon: '🎬', id: 'videos' },
            { name: 'Shared', icon: '👥', id: 'shared' },
            { name: 'Trash', icon: '🗑️', id: 'trash' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentFolder(item.id);
                setFilterType(item.id === 'all' || item.id === 'recents' ? 'all' : 
                  item.id === 'images' ? 'image' : 
                  item.id === 'documents' ? 'document' :
                  item.id === 'videos' ? 'video' : 'all');
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                currentFolder === item.id
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{item.icon}</span>{item.name}
            </button>
          ))}
        </nav>

        {/* Storage Info */}
        {storageInfo && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Storage</h3>
            <div className="bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600">
              {formatFileSize(storageInfo.usedStorage)} of {formatFileSize(storageInfo.totalStorage)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(20 - Math.round(storageInfo.usedStorage / (1024**3))).toFixed(1)} GB available
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {currentFolder === 'all' ? 'iCloud Drive' : 
               currentFolder === 'images' ? 'Images' :
               currentFolder === 'documents' ? 'Documents' :
               currentFolder === 'videos' ? 'Videos' :
               currentFolder === 'shared' ? 'Shared' :
               currentFolder === 'trash' ? 'Trash' : 'Recents'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                ≡ List
              </button>
            </div>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort: Recent</option>
            <option value="name">Sort: Name A-Z</option>
            <option value="size">Sort: Largest</option>
            <option value="type">Sort: Type</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Upload Zone */}
        {currentFolder === 'all' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileUpload(Array.from(e.dataTransfer.files));
            }}
            className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow border-2 border-dashed p-12 text-center mb-8 transition cursor-pointer ${
              dragOver ? 'border-blue-500 scale-105' : 'border-blue-200'
            }`}
          >
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">Drag files here</h3>
            <p className="text-gray-600 mb-4">or click to upload</p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition cursor-pointer"
            >
              Select Files
            </label>
            {uploading && <p className="mt-4 text-blue-600 font-semibold">⏳ Uploading...</p>}
          </div>
        )}

        {/* Files Grid View */}
        {viewMode === 'grid' && filteredFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map(file => (
              <div
                key={file._id}
                onClick={() => {
                  if (selectedFiles.has(file._id)) {
                    selectedFiles.delete(file._id);
                  } else {
                    selectedFiles.add(file._id);
                  }
                  setSelectedFiles(new Set(selectedFiles));
                }}
                className={`p-4 rounded-lg border-2 transition cursor-pointer group ${
                  selectedFiles.has(file._id)
                    ? 'bg-blue-50 border-blue-400 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="text-4xl text-center mb-2">
                  {getFileIcon(file.filename)}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate text-center mb-2">
                  {file.filename}
                </p>
                <p className="text-xs text-gray-500 text-center mb-3">
                  {formatFileSize(file.size)}
                </p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {currentFolder === 'trash' ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(file._id);
                        }}
                        className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1 rounded transition"
                      >
                        ↩️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(file._id);
                        }}
                        className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white py-1 rounded transition"
                      >
                        💥
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file._id, file.filename);
                        }}
                        className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 rounded transition"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(file._id, file.filename);
                        }}
                        className="flex-1 text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 rounded transition"
                        title="Share"
                      >
                        🔗
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file._id);
                        }}
                        className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white py-1 rounded transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Files List View */}
        {viewMode === 'list' && filteredFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date Modified</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map(file => (
                  <tr key={file._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <span className="mr-2">{getFileIcon(file.filename)}</span>
                      {file.filename}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(file.size)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {currentFolder === 'trash' ? (
                        <>
                          <button
                            onClick={() => handleRestore(file._id)}
                            className="text-green-500 hover:text-green-700 font-semibold text-sm"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(file._id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Delete Forever
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleShare(file._id, file.filename)}
                            className="text-purple-500 hover:text-purple-700 font-semibold text-sm"
                          >
                            Share
                          </button>
                          <button
                            onClick={() => handleDownload(file._id, file.filename)}
                            className="text-blue-500 hover:text-blue-700 font-semibold text-sm"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="text-red-500 hover:text-red-700 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No files</h3>
            <p className="text-gray-600">
              {searchQuery ? 'No files match your search' : 'Upload files to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Share: {shareModal.filename}</h2>
            <p className="text-gray-600 mb-4">Anyone with this link can download the file:</p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center gap-2 break-all">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied to clipboard!');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-semibold text-sm"
              >
                Copy
              </button>
            </div>
            
            <button
              onClick={() => {
                setShareModal(null);
                setShareUrl('');
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

