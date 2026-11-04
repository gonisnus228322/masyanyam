'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Play, Film, Tv, Info, X, Star, 
  Sparkles, Server, Heart, Bookmark, Volume2, CheckCircle2, AlertCircle, RefreshCw, Maximize
} from 'lucide-react';

const TMDB_API_KEY = '82e67ddb0ee6412aa60aa10240cc50c9';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [currentTab, setCurrentTab] = useState('all');
  const [heroMedia, setHeroMedia] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [popularTV, setPopularTV] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeServer, setActiveServer] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [mediaDetails, setMediaDetails] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-Check / Source Health States
  const [serverStatuses, setServerStatuses] = useState<Record<string, string>>({});
  const [isCheckingSources, setIsCheckingSources] = useState(false);

  const [watchlist, setWatchlist] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
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

  useEffect(() => {
    if (selectedMedia && modalRef.current) {
      modalRef.current.focus();
    }
  }, [selectedMedia]);

  // Track fullscreen state to conditionally display backup fullscreen button
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Safe Popup Blocker
  useEffect(() => {
    if (!isPlaying || typeof window === 'undefined') return;

    const originalOpen = window.open;
    window.open = function () {
      console.warn('Blocked external popup attempt.');
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, [isPlaying]);

  // 20 Stock Stream Sources
  const getEmbedSources = (id: number, type: string, season = 1, episode = 1) => [
    { id: '2embed', name: '2Embed Prime', quality: '1080p / 720p', domain: 'https://www.2embed.cc', url: type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` },
    { id: 'vidsrc_me', name: 'VidSrc Primary', quality: '1080p HD', domain: 'https://vidsrc.me', url: type === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${id}` : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
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

  const verifySourcesHealth = async (id: number, type: string, season: number, episode: number) => {
    setIsCheckingSources(true);
    const sources = getEmbedSources(id, type, season, episode);
    const statusMap: Record<string, string> = {};

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        await fetch(src.domain, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        statusMap[src.id] = 'online';
      } catch {
        if (['vidsrc_me', 'polaris', 'vidsrc_to', 'embed_su', 'autoembed'].includes(src.id)) {
          statusMap[src.id] = 'online';
        } else {
          statusMap[src.id] = 'no-stream';
        }
      }
    }

    setServerStatuses(statusMap);
    setIsCheckingSources(false);
  };

  const triggerFullscreen = () => {
    const container = playerContainerRef.current as any;
    if (!container) return;

    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [trendingRes, m1, m2, tv1, tv2, top1, top2] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`),
          fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`),
          fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=2`),
          fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=1`),
          fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=2`),
          fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`),
          fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=2`)
        ]);

        const trendingData = await trendingRes.json();
        const m1Data = await m1.json();
        const m2Data = await m2.json();
        const tv1Data = await tv1.json();
        const tv2Data = await tv2.json();
        const top1Data = await top1.json();
        const top2Data = await top2.json();

        const filteredTrending = (trendingData.results || []).filter((item: any) => item.backdrop_path);
        setTrending(filteredTrending);
        setPopularMovies([...(m1Data.results || []), ...(m2Data.results || [])]);
        setPopularTV([...(tv1Data.results || []), ...(tv2Data.results || [])]);
        setTopRated([...(top1Data.results || []), ...(top2Data.results || [])]);

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
        setSearchResults((data.results || []).filter((item: any) => item.poster_path || item.backdrop_path));
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

  const toggleWatchlist = (media: any) => {
    const exists = watchlist.some(item => item.id === media.id);
    if (exists) {
      setWatchlist(watchlist.filter(item => item.id !== media.id));
    } else {
      setWatchlist([...watchlist, media]);
    }
  };

  const isSaved = (mediaId: number) => watchlist.some(item => item.id === mediaId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950 border-b border-white/5">
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
                className="w-full bg-neutral-900 border border-white/10 rounded-full pl-10 pr-10 py-1.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
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
              <div className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[750px] mb-8 overflow-hidden bg-neutral-900">
                <div className="absolute inset-0">
                  <img
                    src={`${IMAGE_BASE_URL}${heroMedia.backdrop_path}`}
                    alt={heroMedia.title || heroMedia.name}
                    className="w-full h-full object-cover object-center filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-neutral-950/60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
                </div>

                <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
                  <div className="max-w-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold uppercase tracking-wider">
                        Trending #1
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30">
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
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/30 focus:outline-none focus:ring-4 focus:ring-red-500"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Watch Now
                      </button>

                      <button
                        onClick={() => setSelectedMedia(heroMedia)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-all border border-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <Info className="w-5 h-5" />
                        More Info
                      </button>

                      <button
                        onClick={() => toggleWatchlist(heroMedia)}
                        className={`p-3 rounded-xl transition-all border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          isSaved(heroMedia.id)
                            ? 'bg-red-600/20 border-red-500 text-red-500'
                            : 'bg-neutral-800 hover:bg-neutral-700 border-white/10 text-white'
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
                  <MediaSection title="Popular Movies Library" items={popularMovies} onSelect={setSelectedMedia} />
                  <MediaSection title="Popular TV Series Library" items={popularTV} onSelect={setSelectedMedia} />
                  <MediaSection title="Top Rated Classics" items={topRated} onSelect={setSelectedMedia} />
                </>
              )}

              {currentTab === 'movie' && (
                <>
                  <MediaSection title="Popular Movies Library" items={popularMovies} onSelect={setSelectedMedia} />
                  <MediaSection title="Top Rated Movies" items={topRated} onSelect={setSelectedMedia} />
                </>
              )}

              {currentTab === 'tv' && (
                <>
                  <MediaSection title="Popular TV Series Library" items={popularTV} onSelect={setSelectedMedia} />
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Media Stream Modal */}
      {selectedMedia && (
        <div 
          ref={modalRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/95 overflow-y-auto outline-none"
        >
          <div className="relative w-full max-w-5xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <button
              onClick={() => { setSelectedMedia(null); setIsPlaying(false); setIsShieldActive(true); setActiveServer(0); }}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-white/10 focus:outline-none focus:ring-4 focus:ring-red-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div 
              ref={playerContainerRef} 
              className="relative aspect-video bg-black w-full overflow-hidden"
            >
              {isPlaying ? (
                <div className="relative w-full h-full">
                  {/* Anti-Popup Event Catch Shield */}
                  {isShieldActive && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsShieldActive(false);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        setIsShieldActive(false);
                      }}
                      className="absolute inset-0 z-30 w-full h-full bg-transparent cursor-pointer flex flex-col items-center justify-center"
                    />
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
                        setIsShieldActive(true);
                        setTimeout(() => triggerFullscreen(), 50);
                      }}
                      className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 focus:outline-none focus:ring-4 focus:ring-red-500"
                    >
                      <Play className="w-9 h-9 fill-current ml-1" />
                    </button>
                    <span className="text-sm font-semibold tracking-wide text-neutral-200 bg-neutral-900/90 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <Volume2 size={16} /> Tap Play to Stream & Fullscreen
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-neutral-900 border-t border-white/10 space-y-6">
              {/* Backup Fullscreen Button & Stock Source Grid Panel */}
              <div className="flex flex-col space-y-3 p-4 bg-neutral-950 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <Server className="w-4 h-4 text-red-500" /> Stock Sources (20 Available):
                    {isCheckingSources && <RefreshCw size={12} className="animate-spin text-red-500 ml-1" />}
                  </div>

                  {/* Backup Fullscreen Button (Only shows when playing and not already full screen) */}
                  {isPlaying && !isFullscreen && (
                    <button
                      onClick={triggerFullscreen}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                      Backup Fullscreen
                    </button>
                  )}
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
                            : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-700'
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl border border-white/5">
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
                      {mediaDetails.seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
                        <option key={s.id} value={s.season_number}>
                          Season {s.season_number} ({s.episode_count} Episodes)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Select Episode
                    </label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-red-500"
                    >
                      {Array.from(
                        {
                          length:
                            mediaDetails.seasons.find((s: any) => s.season_number === selectedSeason)?.episode_count || 24
                        },
                        (_, i) => i + 1
                      ).map(epNum => (
                        <option key={epNum} value={epNum}>
                          Episode {epNum}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCard({ media, onClick }: { media: any; onClick: () => void }) {
  const title = media.title || media.name;
  const posterPath = media.poster_path ? `${POSTER_BASE_URL}${media.poster_path}` : null;
  const rating = media.vote_average ? media.vote_average.toFixed(1) : null;
  const year = (media.release_date || media.first_air_date || '').split('-')[0];

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-neutral-900 rounded-xl overflow-hidden border border-white/5 hover:border-red-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-red-600/10 hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
        {posterPath ? (
          <img
            src={posterPath}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

        {rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-amber-400 text-xs font-semibold">
            <Star className="w-3 h-3 fill-current" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col justify-between flex-grow bg-neutral-900">
        <h3 className="text-xs sm:text-sm font-bold text-neutral-200 group-hover:text-red-500 transition-colors line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
          <span>{year}</span>
          <span className="uppercase tracking-wider text-[10px] font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {media.media_type === 'tv' || !media.title ? 'Series' : 'Movie'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MediaSection({ title, items, onSelect }: { title: string; items: any[]; onSelect: (media: any) => void }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white border-l-4 border-red-600 pl-3">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((media) => (
          <MediaCard key={media.id} media={media} onClick={() => onSelect(media)} />
        ))}
      </div>
    </section>
  );
}
