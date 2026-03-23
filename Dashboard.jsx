import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://web-production-57dae.up.railway.app/api';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    'folder': '📁',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📝', 'md': '📝',
    'xls': '📊', 'xlsx': '📊', 'csv': '📊',
    'mp4': '🎬', 'mov': '🎬', 'avi': '🎬', 'mkv': '🎬', 'webm': '🎬',
    'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'm4a': '🎵',
    'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦',
    'js': '💻', 'py': '💻', 'html': '💻', 'css': '💻', 'json': '💻',
  };
  return icons[ext] || '📄';
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');
  const [breadcrumb, setBreadcrumb] = useState(['Drive']);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { token, logout, user } = useAuth();

  // Load storage info and files on mount
  useEffect(() => {
    loadStorageInfo();
    loadFiles();
  }, [currentFolder, token]);

  const loadStorageInfo = async () => {
    try {
      console.log('📍 Loading storage info...');
      const response = await fetch(`${API_BASE}/storage-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStorageInfo(data);
      console.log('✅ Storage info loaded:', data);
    } catch (err) {
      console.error('❌ Error loading storage info:', err);
    }
  };

  const loadFiles = async () => {
    try {
      console.log('📁 Loading files...');
      const response = await fetch(`${API_BASE}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFiles(data || []);
      console.log('✅ Files loaded:', data);
    } catch (err) {
      console.error('❌ Error loading files:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      console.log('📂 Creating folder:', newFolderName);
      const response = await fetch(`${API_BASE}/create-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderName: newFolderName,
          parentPath: currentFolder
        })
      });

      if (response.ok) {
        console.log('✅ Folder created');
        setNewFolderName('');
        setShowNewFolderDialog(false);
        setFolders([...folders, { name: newFolderName, path: currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName }]);
      } else {
        alert('Failed to create folder');
      }
    } catch (err) {
      console.error('❌ Error creating folder:', err);
      alert('Error creating folder');
    }
  };

  const handleFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList) return;

    setUploading(true);
    console.log(`📤 Uploading ${fileList.length} files...`);

    try {
      for (let file of fileList) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        console.log(`✅ ${file.name} uploaded`);
      }

      loadFiles();
      loadStorageInfo();
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleFolderUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList) return;

    setUploading(true);
    console.log(`📤 Uploading folder with ${fileList.length} files...`);

    try {
      for (let file of fileList) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        console.log(`✅ ${file.name} uploaded`);
      }

      loadFiles();
      loadStorageInfo();
    } catch (err) {
      console.error('❌ Folder upload error:', err);
      alert('Folder upload failed: ' + err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      console.log(`📥 Downloading ${filename}...`);
      const response = await fetch(`${API_BASE}/file/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      console.log(`✅ ${filename} downloaded`);
    } catch (err) {
      console.error('❌ Download error:', err);
      alert('Download failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file? It will go to trash.')) return;

    try {
      console.log(`🗑️ Deleting file...`);
      const response = await fetch(`${API_BASE}/file/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        console.log(`✅ File deleted`);
        loadFiles();
        loadStorageInfo();
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    if (!items) return;

    setUploading(true);
    console.log(`📤 Drag-and-drop upload...`);

    try {
      for (let item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          console.log(`✅ ${file.name} uploaded`);
        }
      }

      loadFiles();
      loadStorageInfo();
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const progressPercent = storageInfo 
    ? Math.round((storageInfo.usedStorage / storageInfo.totalStorage) * 100)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* User Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center text-blue-700 font-bold text-lg mb-3">
            {storageInfo?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 className="font-semibold text-gray-900">{storageInfo?.username || 'User'}</h2>
          <p className="text-xs text-gray-500">{storageInfo?.email || user?.email}</p>
        </div>

        {/* Storage Progress */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Storage</span>
            <span className="text-sm text-gray-500">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatBytes(storageInfo?.usedStorage || 0)} of {formatBytes(storageInfo?.totalStorage || 0)}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 mb-4 hover:bg-blue-600 flex items-center justify-center gap-2">
            <span>+</span> New
          </button>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700 px-4 py-2 uppercase">Menu</p>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>📁</span> My Drive
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>⭐</span> Starred
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>🕐</span> Recent
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <span>🗑️</span> Trash
            </a>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={logout}
            className="w-full text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-lg text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">My Drive</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNewFolderDialog(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <span>📁</span> New folder
              </button>
              <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                <span>📤</span> Upload file
                <input 
                  type="file" 
                  hidden 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                <span>📂</span> Upload folder
                <input 
                  type="file" 
                  hidden 
                  webkitdirectory="true"
                  directory="true"
                  onChange={handleFolderUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <button className="hover:text-blue-600">{crumb}</button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* File List - Drag and Drop Area */}
        <div 
          className={`flex-1 overflow-auto p-8 ${dragOver ? 'bg-blue-50' : 'bg-gray-50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="fixed inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xl font-semibold text-blue-600">Drop files here to upload</p>
              </div>
            </div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Uploading files...
              </p>
            </div>
          )}

          {files.length === 0 && !uploading && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">📁</p>
              <p className="text-gray-500">No files yet</p>
              <p className="text-sm text-gray-400 mt-2">Drag files here or use the upload button</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left text-sm font-semibold text-gray-700">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Modified</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file._id || file.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(file.originalName || file.fileName)}</span>
                        <span className="text-gray-900">{file.originalName || file.fileName}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {formatBytes(file.fileSize)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="px-6 py-3 flex gap-2">
                        <button 
                          onClick={() => handleDownload(file._id || file.id, file.originalName || file.fileName)}
                          className="text-gray-600 hover:text-blue-600 text-sm"
                          title="Download"
                        >
                          ⬇️
                        </button>
                        <button 
                          onClick={() => handleDelete(file._id || file.id)}
                          className="text-gray-600 hover:text-red-600 text-sm"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create new folder</h2>
            <input 
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowNewFolderDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
