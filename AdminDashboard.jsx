import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://web-production-57dae.up.railway.app/api';

export const AdminDashboard = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState('stats'); // stats, users, files
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    loadStats();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'files') {
      loadFiles();
    }
  }, [activeTab, token]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load files: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all their files?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('User deleted successfully');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        alert('File deleted successfully');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const makeAdmin = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/make-admin/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadUsers();
        alert('User is now an admin');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      alert('Operation failed: ' + err.message);
    }
  };

  const removeAdmin = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/remove-admin/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadUsers();
        alert('Admin role removed');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (err) {
      alert('Operation failed: ' + err.message);
    }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">👑 Admin Dashboard</h1>
          <button
            onClick={onBackToDashboard}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'users'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'files'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 Files
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'stats' && stats && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <span className="text-4xl">👥</span>
              </div>
            </div>

            {/* Total Admin */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Admin Users</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalAdmin}</p>
                </div>
                <span className="text-4xl">👑</span>
              </div>
            </div>

            {/* Total Files */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Files</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalFiles}</p>
                </div>
                <span className="text-4xl">📁</span>
              </div>
            </div>

            {/* Total Storage */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Storage</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.storageInGB} GB</p>
                </div>
                <span className="text-4xl">💾</span>
              </div>
            </div>

            {/* Admin Users List */}
            <div className="col-span-full bg-white p-6 rounded-lg shadow-sm mt-4">
              <h3 className="text-lg font-semibold mb-4">👑 Admin Users</h3>
              {stats.adminUsers && stats.adminUsers.length > 0 ? (
                <div className="space-y-2">
                  {stats.adminUsers.map((admin, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-700">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium">{admin.username}</span>
                      <span className="text-gray-500">({admin.email})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No admin users</p>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && !loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-3 text-gray-600">{user.email}</td>
                    <td className="px-6 py-3">
                      {user.isAdmin ? (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                          👑 Admin
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-3 flex gap-2">
                      {user.isAdmin ? (
                        <button
                          onClick={() => removeAdmin(user.id)}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => makeAdmin(user.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Make Admin
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-6 text-center text-gray-500">No users found</div>
            )}
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && !loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">File Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Owner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Uploaded</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{file.name}</td>
                    <td className="px-6 py-3 text-gray-600">{file.username}</td>
                    <td className="px-6 py-3 text-gray-600">{formatBytes(file.size)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(file.uploadedAt)}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {files.length === 0 && (
              <div className="p-6 text-center text-gray-500">No files found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
