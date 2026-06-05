"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  BarChart3, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  Search,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

function UrlShortenerContent() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'recent'
  const [recentGlobal, setRecentGlobal] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // Set the base URL dynamically in the client
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // Handle redirect errors from URL search parameters on mount
  useEffect(() => {
    const error = searchParams.get('error');
    const code = searchParams.get('code');
    if (error === 'not-found') {
      toast.error(`Short link "${code || ''}" does not exist!`, {
        description: 'Please verify the short code and try again.',
        duration: 5000,
      });
      router.replace('/');
    } else if (error === 'server-error') {
      toast.error('Server redirection failed. Please try again later.');
      router.replace('/');
    }
  }, [searchParams, router]);

  // Load user's saved links from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shortener_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        refreshStats(parsed.map(item => item.shortCode), false);
      } catch (e) {
        console.error('Failed to parse links from storage:', e);
      }
    }
    fetchRecentGlobal();
  }, []);

  // Poll for stats updates periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (history.length > 0) {
        refreshStats(history.map(item => item.shortCode), false);
      }
      fetchRecentGlobal();
    }, 12000);
    return () => clearInterval(timer);
  }, [history]);

  // Fetch the 10 most recent global shortened links
  const fetchRecentGlobal = async () => {
    try {
      const res = await fetch('/api/shorten');
      if (res.ok) {
        const data = await res.json();
        setRecentGlobal(data);
      }
    } catch (error) {
      console.error('Failed to fetch global links:', error);
    }
  };

  // Sync click counts from the server
  const refreshStats = async (codes, showToast = false) => {
    if (!codes || codes.length === 0) return;
    if (showToast) setIsSyncing(true);
    try {
      const res = await fetch(`/api/shorten?codes=${codes.join(',')}`);
      if (res.ok) {
        const updatedUrls = await res.json();
        
        setHistory(prevHistory => {
          const newHistory = prevHistory.map(item => {
            const match = updatedUrls.find(u => u.shortCode === item.shortCode);
            return match ? { ...item, clicks: match.clicks } : item;
          });
          localStorage.setItem('shortener_history', JSON.stringify(newHistory));
          return newHistory;
        });

        if (showToast) {
          toast.success('Analytics synced and up to date!');
        }
      }
    } catch (error) {
      console.error('Failed to sync stats:', error);
      if (showToast) toast.error('Failed to synchronize analytics.');
    } finally {
      if (showToast) setIsSyncing(false);
    }
  };

  // Submits a URL to be shortened
  const handleShorten = async (e) => {
    e.preventDefault();
    if (!originalUrl.trim()) {
      toast.warning('Please enter a URL to shorten.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl: originalUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten link');
      }

      toast.success('Link shortened successfully!');
      
      const newHistory = [data, ...history];
      setHistory(newHistory);
      localStorage.setItem('shortener_history', JSON.stringify(newHistory));
      setOriginalUrl('');
      
      fetchRecentGlobal();
    } catch (err) {
      toast.error(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copies the shortened link to clipboard
  const handleCopy = (shortCode) => {
    const urlToCopy = `${baseUrl}/${shortCode}`;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedCode(shortCode);
    toast.success('Copied URL to clipboard!', {
      description: urlToCopy,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Deletes an item from local history
  const handleDelete = (shortCode) => {
    const newHistory = history.filter(item => item.shortCode !== shortCode);
    setHistory(newHistory);
    localStorage.setItem('shortener_history', JSON.stringify(newHistory));
    toast.info('Removed link from your local dashboard.');
  };

  // Filter lists based on search input
  const filteredHistory = history.filter(item => 
    item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlobal = recentGlobal.filter(item => 
    item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeList = activeTab === 'mine' ? filteredHistory : filteredGlobal;

  // Utility to truncate long urls
  const truncateUrl = (url, maxLen = 45) => {
    if (url.length <= maxLen) return url;
    return url.substring(0, maxLen) + '...';
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-pink-600/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Link<span className="text-purple-500">Vibe</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://github.com" 
              target="_blank" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
            >
              Docs
            </a>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              v1.0 (Stable)
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Input Panel */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col gap-12 z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-5">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur text-xs font-semibold text-purple-400 shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simplify your links & Track Analytics</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.2] flex flex-col items-center cursor-default select-none"
          >
            {/* First Line Wrapper */}
            <div className="h-[1.2em] overflow-hidden relative flex flex-col items-center">
              <div className="transition-transform duration-500 ease-out transform group-hover:-translate-y-1/2 flex flex-col items-center">
                <span className="h-[1.2em] flex items-center justify-center text-white">
                  Shorten links.
                </span>
                <span className="h-[1.2em] flex items-center justify-center text-purple-400">
                  Compress URLs.
                </span>
              </div>
            </div>

            {/* Second Line Wrapper */}
            <div className="h-[1.2em] overflow-hidden relative flex flex-col items-center">
              <div className="transition-transform duration-500 ease-out transform group-hover:-translate-y-1/2 flex flex-col items-center">
                <span className="h-[1.2em] flex items-center justify-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                  Measure click rates.
                </span>
                <span className="h-[1.2em] flex items-center justify-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-400">
                  Track analytics.
                </span>
              </div>
            </div>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed"
          >
            An open-source link management tool designed for modern creators. Generate elegant, 
            high-speed URL aliases and track traffic statistics in real-time.
          </motion.p>
        </div>

        {/* Input Form container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl w-full mx-auto"
        >
          <div className="p-1 rounded-2xl bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-pink-600/30 shadow-2xl shadow-purple-950/20 backdrop-blur-md">
            <form 
              onSubmit={handleShorten}
              className="bg-slate-900/90 rounded-[14px] p-4 flex flex-col md:flex-row gap-3 items-center border border-slate-800/80"
            >
              <div className="relative flex-1 w-full">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  placeholder="Paste your long link here (e.g., https://very-long-url.com/path)..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-800 focus:border-purple-500/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all duration-300 font-medium"
                />
              </div>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group transition-all duration-300 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Shorten URL</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Dashboard Area */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="w-full bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md shadow-lg"
        >
          {/* Header Dashboard Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5 mb-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Analytics Dashboard
              </h2>
              <p className="text-slate-400 text-xs">
                Real-time dashboard tracking visits, click activity, and redirect routes.
              </p>
            </div>
            
            {/* Controls panel */}
            <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-lg text-xs focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Refresh buttons */}
              <button
                onClick={() => {
                  if (activeTab === 'mine') {
                    refreshStats(history.map(item => item.shortCode), true);
                  } else {
                    fetchRecentGlobal();
                    toast.success('Refreshed recent public links!');
                  }
                }}
                disabled={isSyncing}
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 hover:bg-slate-900/60 transition-all flex items-center justify-center cursor-pointer"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'mine' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' 
                  : 'bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              My Links ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'recent' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' 
                  : 'bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              Recent Public Links ({recentGlobal.length})
            </button>
          </div>

          {/* Links Dashboard Content */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {activeList.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-900 rounded-xl"
                >
                  <Link2 className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-sm font-medium">No shortened URLs to display.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {searchTerm ? "Try searching for a different keyword." : "Shorten a URL above to populate this list."}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-4"
                >
                  {activeList.map((item) => {
                    const shortLink = `${baseUrl}/${item.shortCode}`;
                    return (
                      <motion.div
                        layout
                        key={item.shortCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-xl hover:shadow-lg hover:shadow-purple-900/5 hover:-translate-y-[2px] transition-all duration-300 gap-4"
                      >
                        {/* Left Side Info */}
                        <div className="flex-1 min-w-0 space-y-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-900/30 font-semibold tracking-wider uppercase">
                              {item.shortCode}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="font-semibold text-purple-400 text-sm md:text-base break-all flex items-center gap-1.5">
                            <a 
                              href={shortLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1 hover:text-purple-300 transition-all"
                            >
                              {shortLink}
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </a>
                          </div>

                          <div className="text-slate-400 text-xs break-all" title={item.originalUrl}>
                            <span className="text-slate-600 font-medium mr-1">Target:</span>
                            {truncateUrl(item.originalUrl)}
                          </div>
                        </div>

                        {/* Right Side Controls & Clicks */}
                        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 border-slate-900 pt-3.5 md:pt-0">
                          {/* Clicks counter */}
                          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800/80 min-w-20 justify-center">
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-bold text-slate-200">{item.clicks}</span>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider ml-0.5">
                              {item.clicks === 1 ? 'click' : 'clicks'}
                            </span>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(item.shortCode)}
                              className="p-2 bg-slate-900 hover:bg-purple-600 border border-slate-800 hover:border-purple-500 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                              title="Copy Short Link"
                            >
                              {copiedCode === item.shortCode ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            
                            {activeTab === 'mine' && (
                              <button
                                onClick={() => handleDelete(item.shortCode)}
                                className="p-2 bg-slate-900 hover:bg-red-950/80 border border-slate-800 hover:border-red-900/60 rounded-lg text-slate-400 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center"
                                title="Remove Link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600 mt-auto">
        <p className="mb-2">LinkVibe is powered by Next.js, Tailwind CSS, MongoDB, and Mongoose.</p>
        <p>&copy; {new Date().getFullYear()} LinkVibe Corp. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans items-center justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-purple-900/30">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading LinkVibe Dashboard...</p>
        </div>
      </div>
    }>
      <UrlShortenerContent />
    </Suspense>
  );
}
