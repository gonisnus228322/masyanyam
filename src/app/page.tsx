'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Film, Tv, Info, X, Star, 
  Sparkles, Server, Heart, Bookmark, Volume2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck 
} from 'lucide-react';

const TMDB_API_KEY = '82e67ddb0ee6412aa60aa10240cc50c9';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [currentTab, setCurrentTab] = useState('all');
  const [heroMedia, setHeroMedia] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeServer, setActiveServer] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [mediaDetails, setMediaDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(true);
  
  const playerContainerRef = useRef(null);

  // Auto-Check / Source Health States
  const [serverStatuses, setServerStatuses] = useState({});
  const [isCheckingSources, setIsCheckingSources] = useState(false);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('masyanya_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('masyanya_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Could not save watchlist', e);
    }
  }, [watchlist]);

  // Anti-Popup Shield
  useEffect(() => {
    if (!isPlaying) return;

    const originalOpen = window.open;
    window.open = function(url, target, features) {
      console.warn('Blocked popup redirection attempt to:', url);
      return null;
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying]);

  // 20 Stock Stream Sources
  const getEmbedSources = (id, type, season = 1, episode = 1) => [
    { id: 'vidsrc_me', name: 'VidSrc Primary', quality: '1080p HD', domain: 'https://vidsrc.me', url: type === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${id}` : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: '2embed', name: '2Embed Prime', quality: '1080p / 720p', domain: 'https://www.2embed.cc', url: type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` },
    { id: 'polaris', name: 'Polaris V2', quality: '1080p HD', domain: 'https://vidsrc.cc', url: type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_to', name: 'VidSrc TO', quality: '1080p HD', domain: 'https://vidsrc.to', url: type === 'movie' ? `https://vidsrc.to/embed/movie/${id}` : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_pm', name: 'VidSrc PM', quality: '1080p HD', domain: 'https://vidsrc.pm', url: type === 'movie' ? `https://vidsrc.pm/embed/movie/${id}` : `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_pro', name: 'VidSrc Pro', quality: '1080p HD', domain: 'https://vidsrc.pro', url: type === 'movie' ? `https://vidsrc.pro/embed/movie/${id}` : `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}` },
    { id: 'vidsrc_xyz', name: 'VidSrc XYZ', quality: '1080p HD', domain: 'https://vidsrc.xyz', url: type === 'movie' ? `https://vidsrc.xyz/embed/movie?tmdb=${id}` : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: 'embed_su', name: 'Embed.su', quality: '1080p / 4K', domain: 'https://embed.su', url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` },
    { id: 'autoembed', name: 'AutoEmbed HQ', quality: '1080p HD', domain: 'https://player.autoembed.cc', url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
    { id: 'multiembed', name: 'SuperEmbed', quality: '1080p / 720p', domain: 'https://multiembed.mov', url: type === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    { id: 'vidlink', name: 'VidLink Pro', quality: '1080p HD', domain: 'https://vidlink.pro', url: type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${season}/${episode}` },
    { id: 'smashystream', name: 'SmashyStream', quality: '1080p HD', domain: 'https://player.smashystream.com', url: type === 'movie' ? `https://player.smashystream.com/movie/${id}` : `https://player.smashystream.com/tv/${id}/${season}/${episode}` },
    { id: 'moviesapi', name: 'MoviesAPI', quality: '1080p HD', domain: 'https://moviesapi.club', url: type === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${season}-${episode}` },
    { id: 'nontongo', name: 'NontonGo', quality: '1080p HD', domain: 'https://nontongo.club', url: type === 'movie' ? `https://nontongo.club/embed/movie/${id}` : `https://nontongo.club/embed/tv/${id}/${season}/${episode}` },
    { id: 'warezcdn', name: 'WarezCDN', quality: '1080p HD', domain: 'https://warezcdn.link', url: type === 'movie' ? `https://warezcdn.link/movie/${id}` : `https://warezcdn.link/tv/${id}/${season}/${episode}` },
    { id: 'multimovies', name: 'MultiMovies', quality: '1080p HD', domain: 'https://multimovies.cloud', url: type === 'movie' ? `https://multimovies.cloud/embed/movie/${id}` : `https://multimovies.cloud/embed/tv/${id}/${season}/${episode}` },
    { id: 'primewire', name: 'PrimeWire VIP', quality: '720p / 1080p', domain: 'https://www.primewire.tf', url: type === 'movie' ? `https://www.primewire.tf/embed/movie?tmdb=${id}` : `https://www.primewire.tf/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
    { id: 'gomovies', name: 'GoMovies Stream', quality: '1080p HD', domain: 'https://gomovies-online.CC', url: type === 'movie' ? `https://gomovies-online.CC/embed/movie/${id}` : `https://gomovies-online.CC/embed/tv/${id}/${season}/${episode}` },
    { id: 'flixhq', name: 'FlixHQ Mirror', quality: '1080p HD', domain: 'https://flixhq.to', url: type === 'movie' ? `https://flixhq.to/embed/movie/${id}` : `https://flixhq.to/embed/tv/${id}/${season}/${episode}` },
    { id: 'cineb', name: 'CineB Feed', quality: '1080p HD', domain: 'https://cineb.rs', url: type === 'movie' ? `https://cineb.rs/embed/movie/${id}` : `https://cineb.rs/embed/tv/${id}/${season}/${episode}` }
  ];

  const verifySourcesHealth = async (id, type, season, episode) => {
    setIsCheckingSources(true);
    const sources = getEmbedSources(id, type, season, episode);
    const statusMap = {};
    let firstWorkingIdx = 0;

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        
        await fetch(src.domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        
        statusMap[src.id] = 'online';
      } catch {
        if (['vidsrc_me', 'polaris', 'vidsrc_to', 'embed_su'].includes(src.id)) {
          statusMap[src.id] = 'online';
        } else {
          statusMap[src.id] = 'no-stream';
        }
      }
    }

    setServerStatuses(statusMap);
    setIsCheckingSources(false);
    setActiveServer(firstWorkingIdx);
  };

  const triggerFullscreen = () => {
    if (playerContainerRef.current) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen().catch(() => {});
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      }
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [trendingRes, moviesRes, tvRes, topRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`)
        ]);

        const trendingData = await trendingRes.json();
        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        const topData = await topRes.json();

        const filteredTrending = (trendingData.results || []).filter(item => item.backdrop_path);
        setTrending(filteredTrending);
        setPopularMovies(moviesData.results || []);
        setPopularTV(tvData.results || []);
        setTopRated(topData.results || []);

        if (filteredTrending.length > 0) {
          setHeroMedia(filteredTrending[0]);
        }
      } catch (error) {
        console.error('Error fetching TMDB data:', error);
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        setSearchResults((data.results || []).filter(item => item.poster_path || item.backdrop_path));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedMedia) {
      setMediaDetails(null);
      setIsPlaying(false);
      setIsShieldActive(true);
      setServerStatuses({});
      return;
    }

    const type = selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
    
    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/${type}/${selectedMedia.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`
        );
        const data = await res.json();
        setMediaDetails({ ...data, media_type: type });
      } catch (err) {
        console.error('Failed to fetch details:', err);
      }
    };

    fetchDetails();
    verifySourcesHealth(selectedMedia.id, type, selectedSeason, selectedEpisode);
  }, [selectedMedia, selectedSeason, selectedEpisode]);

  const toggleWatchlist = (media) => {
    const exists = watchlist.some(item => item.id === media.id);
    if (exists) {
      setWatchlist(watchlist.filter(item => item.id !== media.id));
    } else {
      setWatchlist([...watchlist, media]);
    }
  };

  const isSaved = (mediaId) => watchlist.some(item => item.id === mediaId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <button 
              onClick={() => { setSearchQuery(''); setCurrentTab('all'); }} 
              className="text-2xl sm:text-3xl font-black tracking-tight focus:outline-none"
            >
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                masyanya
              </span>
            </button>

            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Home', icon: Sparkles },
                { id: 'movie', label: 'Movies', icon: Film },
                { id: 'tv', label: 'TV Shows', icon: Tv },
                { id: 'watchlist', label: `List (${watchlist.length})`, icon: Bookmark }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id); setSearchQuery(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      currentTab === tab.id 
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="relative w-full md:max-w-xs">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/80 border border-white/10 rounded-full pl-10 pr-10 py-1.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 text-neutral-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 sm:pt-28 pb-12">
        {searchQuery ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-red-500" />
              Search Results for <span className="text-red-500">&quot;{searchQuery}&quot;</span>
            </h2>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-neutral-900 animate-pulse" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => setSelectedMedia(item)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">No titles or series found. Try another search term!</div>
            )}
          </div>
        ) : currentTab === 'watchlist' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-red-500" /> My Saved Watchlist
            </h2>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {watchlist.map(item => (
                  <MediaCard key={item.id} media={item} onClick={() => setSelectedMedia(item)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500 border border-dashed border-white/10 rounded-2xl">
                Your watchlist is currently empty. Bookmark titles to access them here quickly!
              </div>
            )}
          </div>
        ) : (
          <>
            {heroMedia && (
              <div className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[750px] mb-8 overflow-hidden">
                <div className="absolute inset-0">
                  <img
                    src={`${IMAGE_BASE_URL}${heroMedia.backdrop_path}`}
                    alt={heroMedia.title || heroMedia.name}
                    className="w-full h-full object-cover object-center scale-105 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />
                </div>

                <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
                  <div className="max-w-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                        Trending #1
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {heroMedia.vote_average?.toFixed(1)}
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                      {heroMedia.title || heroMedia.name}
                    </h1>

                    <p className="text-sm sm:text-base text-neutral-300 line-clamp-3 leading-relaxed">
                      {heroMedia.overview}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => setSelectedMedia(heroMedia)}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-500/50"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Watch Now
                      </button>

                      <button
                        onClick={() => setSelectedMedia(heroMedia)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-md transition-all border border-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <Info className="w-5 h-5" />
                        More Info
                      </button>

                      <button
                        onClick={() => toggleWatchlist(heroMedia)}
                        className={`p-3 rounded-xl transition-all border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          isSaved(heroMedia.id)
                            ? 'bg-red-600/20 border-red-500 text-red-500'
                            : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isSaved(heroMedia.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {currentTab === 'all' && (
                <>
                  <MediaSection title="Weekly Trending" items={trending} onSelect={setSelectedMedia} />
                  <MediaSection title="Popular Movies" items={popularMovies} onSelect={setSelectedMedia} />
                  <MediaSection title="Popular TV Series" items={popularTV} onSelect={setSelectedMedia} />
                  <MediaSection title="Top Rated Classics" items={topRated} onSelect={setSelectedMedia} />
                </>
              )}

              {currentTab === 'movie' && (
                <>
                  <MediaSection title="Popular Movies" items={popularMovies} onSelect={setSelectedMedia} />
                  <MediaSection title="Top Rated Movies" items={topRated} onSelect={setSelectedMedia} />
                </>
              )}

              {currentTab === 'tv' && (
                <>
                  <MediaSection title="Trending TV Series" items={popularTV} onSelect={setSelectedMedia} />
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Media Stream Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/95 backdrop-blur-xl overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <button
              onClick={() => { setSelectedMedia(null); setIsPlaying(false); setIsShieldActive(true); setActiveServer(0); }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-neutral-300 hover:text-white transition-all backdrop-blur-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div 
              ref={playerContainerRef} 
              className="relative aspect-video bg-black w-full overflow-hidden"
              onTouchStart={(e) => {
                if (isShieldActive) e.stopPropagation();
              }}
            >
              {isPlaying ? (
                <div className="relative w-full h-full">
                  {/* Mobile/TV Shield Curtain */}
                  {isShieldActive && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShieldActive(false);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        setIsShieldActive(false);
                      }}
                      className="absolute inset-0 z-30 w-full h-full bg-neutral-950/70 backdrop-blur-xs cursor-pointer flex flex-col items-center justify-center gap-3 p-4 text-center focus:outline-none focus:ring-4 focus:ring-red-500"
                    >
                      <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 animate-bounce">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </div>
                      <span className="bg-black/90 text-xs font-semibold text-white px-4 py-2 rounded-full border border-white/25 shadow-xl">
                        Click / Tap to launch stream player
                      </span>
                    </button>
                  )}

                  <iframe
                    src={
                      getEmbedSources(
                        selectedMedia.id,
                        selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv'),
                        selectedSeason,
                        selectedEpisode
                      )[activeServer].url
                    }
                    className="w-full h-full border-0 absolute inset-0 z-10 pointer-events-auto"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    referrerPolicy="origin"
                    title="Stream Player"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {selectedMedia.backdrop_path ? (
                    <img
                      src={`${IMAGE_BASE_URL}${selectedMedia.backdrop_path}`}
                      alt={selectedMedia.title || selectedMedia.name}
                      className="w-full h-full object-cover filter brightness-50"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-neutral-600">
                      No Preview Available
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
                    <button
                      onClick={() => {
                        setIsPlaying(true);
                        setTimeout(triggerFullscreen, 300);
                      }}
                      className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-red-500"
                    >
                      <Play className="w-9 h-9 fill-current ml-1" />
                    </button>
                    <span className="text-sm font-semibold tracking-wide text-neutral-200 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <Volume2 size={16} /> Press OK / Play to Stream
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-neutral-900 border-t border-white/10 space-y-6">
              {/* Stock Source Grid Panel */}
              <div className="flex flex-col space-y-3 p-4 bg-neutral-950/80 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <Server className="w-4 h-4 text-red-500" /> Stock Sources (20 Available):
                    {isCheckingSources && <RefreshCw size={12} className="animate-spin text-red-500 ml-1" />}
                  </div>
                  <span className="text-[11px] text-neutral-500">VidSrc Primary Active</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getEmbedSources(
                    selectedMedia.id,
                    selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv'),
                    selectedSeason,
                    selectedEpisode
                  ).map((srv, idx) => {
                    const status = serverStatuses[srv.id];
                    const isNoStream = status === 'no-stream';

                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          if (!isNoStream) {
                            setActiveServer(idx);
                            setIsShieldActive(true);
                          }
                        }}
                        disabled={isNoStream}
                        className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          activeServer === idx
                            ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                            : isNoStream
                            ? 'bg-neutral-900/40 border-white/5 text-neutral-600 cursor-not-allowed opacity-50'
                            : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold truncate">{srv.name}</span>
                          {status === 'online' && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                          {isNoStream && <AlertCircle size={12} className="text-neutral-600 shrink-0" />}
                        </div>
                        <span className="text-[10px] font-medium mt-0.5 text-neutral-400">
                          {isNoStream ? 'No stream for this' : srv.quality}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mediaDetails && (mediaDetails.media_type === 'tv' || !selectedMedia.title) && mediaDetails.seasons && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/50 p-4 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Select Season
                    </label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => {
                        setSelectedSeason(Number(e.target.value));
                        setSelectedEpisode(1);
                      }}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-500"
                    >
                      {mediaDetails.seasons.filter(s => s.season_number > 0).map(s => (
                        <option key={s.id} value={s.season_number}>
                          Season {s.season_number} ({s.episode_count} Episodes)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Episode Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedMedia.title || selectedMedia.name}
                  </h2>
                  <button
                    onClick={() => toggleWatchlist(selectedMedia)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isSaved(selectedMedia.id)
                        ? 'bg-red-600/20 border-red-500 text-red-500'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved(selectedMedia.id) ? 'fill-current' : ''}`} />
                    {isSaved(selectedMedia.id) ? 'Saved in Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-400">
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {selectedMedia.vote_average?.toFixed(1)} / 10
                  </span>
                  <span>{selectedMedia.release_date || selectedMedia.first_air_date}</span>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed pt-2">
                  {selectedMedia.overview || 'No overview summary available for this title.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaSection({ title, items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-600" />
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map((item) => (
          <MediaCard key={item.id} media={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </section>
  );
}

// Fixed TV Focusable Media Card Button Wrapper
function MediaCard({ media, onClick }) {
  const posterUrl = media.poster_path 
    ? `${POSTER_BASE_URL}${media.poster_path}` 
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-white/5 text-left w-full transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/10 focus:outline-none focus:ring-4 focus:ring-red-500 focus:scale-105"
    >
      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
        <img
          src={posterUrl}
          alt={media.title || media.name}
          className="w-full h-full object-cover group-hover:scale-110 group-focus:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-75 group-hover:scale-100 group-focus:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>
        {media.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-400 border border-white/10">
            <Star className="w-3 h-3 fill-current" />
            {media.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 justify-between bg-neutral-900 w-full">
        <h3 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-red-500 group-focus:text-red-500 transition-colors">
          {media.title || media.name}
        </h3>
        <p className="text-[10px] text-neutral-500 mt-1 font-medium">
          {(media.release_date || media.first_air_date || '').substring(0, 4) || 'N/A'}
        </p>
      </div>
    </button>
  );
}
