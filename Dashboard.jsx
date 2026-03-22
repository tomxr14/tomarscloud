import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { token, logout, user } = useAuth();

  useEffect(() => {
    loadFiles();
    loadStorageInfo();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/files`, {
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercent = storageInfo ? (storageInfo.usedStorage / storageInfo.totalStorage) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-400 to-blue-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">☁️ TomarsCloud</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Storage Info */}
        {storageInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Storage</h2>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-gray-600">
              {formatFileSize(storageInfo.usedStorage)} / {formatFileSize(storageInfo.totalStorage)} used
            </p>
          </div>
        )}

        {/* Upload Zone */}
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
          className={`bg-white rounded-lg shadow-md p-12 text-center mb-6 border-2 border-dashed transition cursor-pointer ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Files</h3>
          <p className="text-gray-600 mb-4">Drag and drop files here or click to select</p>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-block bg-gradient-to-r from-sky-400 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-sky-500 hover:to-blue-600 transition cursor-pointer"
          >
            Browse Files
          </label>
          {uploading && <p className="mt-4 text-blue-600 font-semibold">Uploading...</p>}
        </div>

        {/* Files Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Files</h2>
          {files.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No files uploaded yet. Upload some files to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <div className="text-4xl mb-2">📄</div>
                  <h3 className="font-semibold text-gray-800 truncate">{file.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{formatFileSize(file.size)}</p>
                  <div className="flex gap-2">
                    <a
                      href={`${API_BASE}/file/${file.id}`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-semibold text-center transition"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
