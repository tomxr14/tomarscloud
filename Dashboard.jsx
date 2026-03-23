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

export const Dashboard = ({ showAdminDashboard }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('');
  const [breadcrumb, setBreadcrumb] = useState(['Drive']);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [currentView, setCurrentView] = useState('drive'); // 'drive', 'starred', 'recent', 'trash'
  const [showNewMenu, setShowNewMenu] = useState(false);
  const { token, logout, user } = useAuth();

  // Show notification toast
  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  };

  // Get user's initials (e.g., "Anurag Tomar" → "AT")
  const getInitials = (username) => {
    if (!username) return 'U';
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user's cloud name display (e.g., "Anurag's Cloud")
  const getCloudName = (username) => {
    if (!username) return 'My Cloud';
    const firstName = username.split(' ')[0];
    return `${firstName}'s Cloud`;
  };

  // Load storage info and files on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadStorageInfo();
        await loadFiles();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentFolder, token]);

  const loadStorageInfo = async () => {
    try {
      console.log('📍 Loading storage info...');
      const response = await fetch(`${API_BASE}/storage-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStorageInfo(data);
      setIsAdmin(data.isAdmin || false);
      console.log('✅ Storage info loaded:', data);
    } catch (err) {
      console.error('❌ Error loading storage info:', err);
      showNotification('Failed to load storage info', 'error');
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
      showNotification(`${fileList.length} file(s) uploaded successfully!`, 'success');
    } catch (err) {
      console.error('❌ Upload error:', err);
      showNotification('Upload failed: ' + err.message, 'error');
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
        showNotification('File moved to trash', 'success');
        loadFiles();
        loadStorageInfo();
      } else {
        showNotification('Failed to delete file', 'error');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      showNotification('Error deleting file: ' + err.message, 'error');
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
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-gray-700">Loading...</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* User Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center text-blue-700 font-bold text-lg mb-3">
            {getInitials(storageInfo?.fullName || user?.fullName || 'User')}
          </div>
          <h2 className="font-semibold text-gray-900">{getCloudName(storageInfo?.fullName || user?.fullName || 'User')}</h2>
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
          <div className="relative mb-4">
            <button 
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <span>+</span> New
            </button>
            {showNewMenu && (
              <div className="absolute top-12 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button 
                  onClick={() => {
                    setShowNewFolderDialog(true);
                    setShowNewMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <span>📁</span> New folder
                </button>
                <label className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer">
                  <span>📤</span> Upload file
                  <input 
                    type="file" 
                    hidden 
                    onChange={(e) => {
                      handleFileUpload(e);
                      setShowNewMenu(false);
                    }}
                    disabled={uploading}
                  />
                </label>
                <label className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer">
                  <span>📂</span> Upload folder
                  <input 
                    type="file" 
                    hidden 
                    webkitdirectory="true"
                    directory="true"
                    onChange={(e) => {
                      handleFolderUpload(e);
                      setShowNewMenu(false);
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700 px-4 py-2 uppercase">Menu</p>
            <button 
              onClick={() => setCurrentView('drive')}
              className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg ${currentView === 'drive' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span>📁</span> My Drive
            </button>
            <button 
              onClick={() => setCurrentView('starred')}
              className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg ${currentView === 'starred' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span>⭐</span> Starred
            </button>
            <button 
              onClick={() => setCurrentView('recent')}
              className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg ${currentView === 'recent' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span>🕐</span> Recent
            </button>
            <button 
              onClick={() => setCurrentView('trash')}
              className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg ${currentView === 'trash' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span>🗑️</span> Trash
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {isAdmin && (
            <button 
              onClick={showAdminDashboard}
              className="w-full bg-purple-500 text-white hover:bg-purple-600 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              👑 Admin Panel
            </button>
          )}
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
            <h1 className="text-2xl font-semibold text-gray-900">
              {currentView === 'drive' && 'My Drive'}
              {currentView === 'starred' && 'Starred'}
              {currentView === 'recent' && 'Recent'}
              {currentView === 'trash' && 'Trash'}
            </h1>
          </div>

          {/* Breadcrumb - only show for My Drive view */}
          {currentView === 'drive' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  <button className="hover:text-blue-600">{crumb}</button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* File List - Drag and Drop Area */}
        <div 
          className={`flex-1 overflow-auto p-8 ${dragOver && currentView === 'drive' ? 'bg-blue-50' : 'bg-gray-50'}`}
          onDragOver={currentView === 'drive' ? handleDragOver : null}
          onDragLeave={currentView === 'drive' ? handleDragLeave : null}
          onDrop={currentView === 'drive' ? handleDrop : null}
        >
          {dragOver && currentView === 'drive' && (
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

          {/* MY DRIVE VIEW */}
          {currentView === 'drive' && (
            <>
              {files.length === 0 && !uploading && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📁</p>
                  <p className="text-gray-500">No files yet</p>
                  <p className="text-sm text-gray-400 mt-2">Drag files here or use the + New button</p>
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
            </>
          )}

          {/* STARRED VIEW */}
          {currentView === 'starred' && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">⭐</p>
              <p className="text-gray-500">No starred files yet</p>
              <p className="text-sm text-gray-400 mt-2">Star files to access them here</p>
            </div>
          )}

          {/* RECENT VIEW */}
          {currentView === 'recent' && (
            <div className="flex flex-col gap-4">
              {files.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-4xl mb-4">🕐</p>
                  <p className="text-gray-500">No recent files</p>
                  <p className="text-sm text-gray-400 mt-2">Recently accessed files will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-sm font-semibold text-gray-700">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">Modified</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files && files.length > 0 && files.slice(0, 10).map((file) => (
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
          )}

          {/* TRASH VIEW */}
          {currentView === 'trash' && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🗑️</p>
              <p className="text-gray-500">Trash is empty</p>
              <p className="text-sm text-gray-400 mt-2">Deleted files will appear here for 30 days</p>
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
