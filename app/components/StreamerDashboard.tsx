'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Users, Tv, Clock, TrendingUp, RefreshCw } from 'lucide-react';

interface StreamData {
  username: string;
  profilePic: string;
  isLive: boolean;
  viewerCount: number;
  title: string;
  category: string;
  startTime: string | null;
  followersCount: number;
  streamId: number | null;
}

interface SessionStats {
  peakViewers: number;
  startTime: string | null;
}

export default function StreamerDashboard() {
  const [username, setUsername] = useState('');
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    peakViewers: 0,
    startTime: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStreamData = useCallback(async (streamerName: string) => {
    if (!streamerName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/streamer/${streamerName}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setStreamData(data);

      // Update session stats
      if (data.isLive) {
        setSessionStats(prev => {
          // Reset if new stream session
          if (prev.startTime !== data.startTime) {
            return {
              peakViewers: data.viewerCount,
              startTime: data.startTime
            };
          }
          // Update peak viewers
          return {
            ...prev,
            peakViewers: Math.max(prev.peakViewers, data.viewerCount)
          };
        });
      } else {
        // Reset session stats when offline
        if (sessionStats.startTime) {
          setSessionStats({ peakViewers: 0, startTime: null });
        }
      }
    } catch (err: any) {
      setError(err.message);
      setStreamData(null);
    } finally {
      setLoading(false);
    }
  }, [sessionStats.startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStreamData(username);
    setAutoRefresh(true);
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh || !username) return;

    const interval = setInterval(() => {
      fetchStreamData(username);
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, username, fetchStreamData]);

  const getUptime = () => {
    if (!streamData?.startTime) return 'N/A';
    return formatDistanceToNow(new Date(streamData.startTime), { addSuffix: false });
  };

  // Helper function to get proxied image URL
  const getProxiedImageUrl = (url: string | null, username: string) => {
    if (!url || url === 'https://kick.com/favicon.ico') {
      // Return UI Avatars if no valid URL
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=22c55e&color=fff&size=200&bold=true`;
    }
    // Proxy the actual Kick image
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            KickStream Monitor
          </h1>
          <p className="text-gray-400">Real-time analytics for Kick streamers</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Kick username..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Monitor'
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Dashboard */}
        {streamData && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-4">
                <img
                  src={getProxiedImageUrl(streamData.profilePic, streamData.username)}
                  alt={streamData.username}
                  className="w-20 h-20 rounded-full border-4 border-green-500 object-cover bg-gray-700"
                  onError={(e) => {
                    // Fallback to UI Avatars if proxy fails
                    const target = e.currentTarget;
                    target.onerror = null; // Prevent infinite loop
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(streamData.username)}&background=22c55e&color=fff&size=200&bold=true`;
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{streamData.username}</h2>
                  <p className="text-gray-400">{streamData.followersCount.toLocaleString()} followers</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${
                  streamData.isLive 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {streamData.isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Viewer Count */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Current Viewers</span>
                </div>
                <p className="text-3xl font-bold">
                  {streamData.isLive ? streamData.viewerCount.toLocaleString() : '0'}
                </p>
              </div>

              {/* Peak Viewers */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Peak Viewers</span>
                </div>
                <p className="text-3xl font-bold">{sessionStats.peakViewers.toLocaleString()}</p>
              </div>

              {/* Uptime */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Stream Uptime</span>
                </div>
                <p className="text-2xl font-bold">{streamData.isLive ? getUptime() : 'N/A'}</p>
              </div>

              {/* Category */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <Tv className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Category</span>
                </div>
                <p className="text-xl font-bold truncate">{streamData.category}</p>
              </div>
            </div>

            {/* Stream Info */}
            {streamData.isLive && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Stream Title</h3>
                <p className="text-xl">{streamData.title}</p>
              </div>
            )}

            {/* Auto-refresh indicator */}
            <div className="text-center text-sm text-gray-500">
              Auto-refreshing every 15 seconds
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
