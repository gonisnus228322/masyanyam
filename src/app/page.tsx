'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Play, Film, Tv, Info, X, Star, 
  Sparkles, Server, Heart, Bookmark, Volume2, CheckCircle2 
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

  // The 3 True Multi-Source Aggregators (They handle fallback mirrors automatically)
  const getEmbedSources = (id, type, season = 1, episode = 1) => [
    {
      id: 'vidsrc_vip',
      name: 'VidSrc Master',
      quality: '1080p HD',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      url: type === 'movie' 
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
    },
    {
      id: 'embed_su',
      name: 'Embed.su Aggregator',
      quality: '1080p / 4K',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      url: type === 'movie'
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${season}/${episode}`
    },
    {
      id: 'autoembed',
      name: 'AutoEmbed Multi',
      quality: '1080p HD',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      url: type === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${id}`
        : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
    },
    {
      id: 'vidsrc_cc',
      name: 'VidSrc V2',
      quality: '1080p HD',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      url: type === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
    }
  ];

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
  }, [selectedMedia]);

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-600 selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => { setSearchQuery(''); setCurrentTab('all'); }} 
              className="text-3xl font-black tracking-tight focus:outline-none"
            >
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                masyanya
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
              {[
                { id: 'all', label: 'Home', icon: Sparkles },
                { id: 'movie', label: 'Movies', icon: Film },
                { id: 'tv', label: 'TV Shows', icon: Tv },
                { id: 'watchlist', label: `My List (${watchlist.length})`, icon: Bookmark }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id); setSearchQuery(''); }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      currentTab === tab.id 
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/80 border border-white/10 rounded-full pl-10 pr-10 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
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

      <main className="pt-20 pb-20">
        {searchQuery ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
              <div className="relative w-full h-[70vh] min-h-[480px] max-h-[750px] mb-8 overflow-hidden">
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
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Watch Now
                      </button>

                      <button
                        onClick={() => setSelectedMedia(heroMedia)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-md transition-all border border-white/10"
                      >
                        <Info className="w-5 h-5" />
                        More Info
                      </button>

                      <button
                        onClick={() => toggleWatchlist(heroMedia)}
                        className={`p-3 rounded-xl transition-all border ${
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

      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/95 backdrop-blur-xl overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <button
              onClick={() => { setSelectedMedia(null); setIsPlaying(false); setActiveServer(0); }}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-neutral-300 hover:text-white transition-all backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-video bg-black w-full overflow-hidden pointer-events-auto">
              {isPlaying ? (
                <iframe
                  src={
                    getEmbedSources(
                      selectedMedia.id,
                      selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv'),
                      selectedSeason,
                      selectedEpisode
                    )[activeServer].url
                  }
                  className="w-full h-full border-0 pointer-events-auto"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope; clipboard-write"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups-to-escape-sandbox allow-modals"
                  referrerPolicy="origin"
                  title="Stream Player"
                />
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
                      onClick={() => setIsPlaying(true)}
                      className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all group"
                    >
                      <Play className="w-9 h-9 fill-current ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="text-sm font-semibold tracking-wide text-neutral-200 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <Volume2 size={16} /> Tap Play to Start Stream
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-neutral-900 border-t border-white/10 space-y-6">
              <div className="flex flex-col space-y-3 p-4 bg-neutral-950/80 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <Server className="w-4 h-4 text-red-500" /> Working Multi-Mirrors:
                  </div>
                  <span className="text-[11px] text-neutral-500">Switch providers instantly</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getEmbedSources(
                    selectedMedia.id,
                    selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv')
                  ).map((srv, idx) => (
                    <button
                      key={srv.id}
                      onClick={() => setActiveServer(idx)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                        activeServer === idx
                          ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold truncate">{srv.name}</span>
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      </div>
                      <span className={`text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded border ${srv.badgeColor}`}>
                        {srv.quality}
                      </span>
                    </button>
                  ))}
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
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

function MediaCard({ media, onClick }) {
  const posterUrl = media.poster_path 
    ? `${POSTER_BASE_URL}${media.poster_path}` 
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-white/5 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/10"
    >
      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
        <img
          src={posterUrl}
          alt={media.title || media.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-75 group-hover:scale-100 transition-transform">
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

      <div className="p-3 flex flex-col flex-1 justify-between bg-neutral-900">
        <h3 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-red-500 transition-colors">
          {media.title || media.name}
        </h3>
        <p className="text-[10px] text-neutral-500 mt-1 font-medium">
          {(media.release_date || media.first_air_date || '').substring(0, 4) || 'N/A'}
        </p>
      </div>
    </div>
  );
}
