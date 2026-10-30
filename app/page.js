'use client';

import React, { useState, useEffect } from 'react';
import { Search, Play, Film, Tv, TrendingUp, Info, Star, ChevronRight, Sparkles, Server, Heart, Bookmark, X } from 'lucide-react';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '82e67ddb0ee6412aa60aa10240cc50c9';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export default function MasyanyaApp() {
  const [currentTab, setCurrentTab] = useState('all');
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeServer, setActiveServer] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  const [watchlist, setWatchlist] = useState(() => {
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

  // High-Quality 1080p / 4K Embed Source Servers
  const getEmbedSources = (id, type, season = 1, episode = 1) => [
    { 
      name: 'VidKing 1080p Ultra', 
      quality: '1080p / 4K', 
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
      url: type === 'movie' ? `https://vidking.net/embed/movie/${id}` : `https://vidking.net/embed/tv/${id}/${season}/${episode}` 
    },
    { 
      name: 'AutoEmbed HQ', 
      quality: '1080p HD', 
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
      url: type === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` 
    },
    { 
      name: 'Embed.su Master', 
      quality: '1080p HD', 
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
      url: type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${season}/${episode}` 
    },
    { 
      name: 'Vidsrc VIP', 
      quality: '1080p HD', 
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
      url: type === 'movie' ? `https://vidsrc.vip/embed/movie/${id}` : `https://vidsrc.vip/embed/tv/${id}/${season}/${episode}` 
    },
    { 
      name: 'Vidsrc.cc', 
      quality: '1080p HD', 
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30', 
      url: type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` 
    },
    { 
      name: '2Embed Prime', 
      quality: '1080p / 720p', 
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', 
      url: type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` 
    }
  ];

  // Fetch initial content
  useEffect(() => {
    async function fetchContent() {
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

        setTrending(trendingData.results || []);
        setPopularMovies(moviesData.results || []);
        setPopularTV(tvData.results || []);
        setTopRated(topData.results || []);
      } catch (err) {
        console.error('Error fetching TMDB data:', err);
      }
    }
    fetchContent();
  }, []);

  // Search logic with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`);
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

  // Fetch media details when selected
  useEffect(() => {
    if (!selectedMedia) {
      setMediaDetails(null);
      setIsPlaying(false);
      return;
    }

    async function fetchDetails() {
      const mediaType = selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
      try {
        const res = await fetch(`${TMDB_BASE_URL}/${mediaType}/${selectedMedia.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`);
        const data = await res.json();
        setMediaDetails({ ...data, media_type: mediaType });
      } catch (err) {
        console.error('Failed to fetch details:', err);
      }
    }
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

  const heroItem = trending[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-600 selection:text-white font-sans">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => { setCurrentTab('all'); setSearchQuery(''); setSelectedMedia(null); }}
            className="text-3xl font-black tracking-tight focus:outline-none hover:opacity-80 transition-opacity"
          >
            masyanya
          </button>
          
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
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
                    currentTab === tab.id ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search movies & TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900/80 border border-white/10 rounded-full pl-10 pr-10 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pb-24">
        {searchQuery ? (
          <div className="max-w-7xl mx-auto px-6 pt-8">
            <h2 className="text-xl font-semibold mb-6">Search Results for &quot;{searchQuery}&quot;</h2>
            {isSearching ? (
              <div className="text-center py-20 text-neutral-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {searchResults.map(item => (
                  <MediaCard key={item.id} item={item} onClick={() => setSelectedMedia(item)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">No titles or series found. Try another search term!</div>
            )}
          </div>
        ) : currentTab === 'watchlist' ? (
          <div className="max-w-7xl mx-auto px-6 pt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Bookmark className="text-red-500" /> My Saved Watchlist
            </h2>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {watchlist.map(item => (
                  <MediaCard key={item.id} item={item} onClick={() => setSelectedMedia(item)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-neutral-500">
                <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">Your watchlist is currently empty.</p>
                <p className="text-sm text-neutral-600 mt-1">Explore movies and TV shows to save them here.</p>
              </div>
            )}
          </div>
        ) : currentTab === 'movie' ? (
          <div className="max-w-7xl mx-auto px-6 pt-8 space-y-10">
            <MediaRow title="Popular Movies" items={popularMovies} onSelect={setSelectedMedia} />
            <MediaRow title="Top Rated Classics" items={topRated} onSelect={setSelectedMedia} />
          </div>
        ) : currentTab === 'tv' ? (
          <div className="max-w-7xl mx-auto px-6 pt-8 space-y-10">
            <MediaRow title="Popular TV Series" items={popularTV} onSelect={setSelectedMedia} />
          </div>
        ) : (
          <div>
            {/* Hero Banner */}
            {heroItem && (
              <div className="relative h-[75vh] w-full overflow-hidden flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent z-10 w-full md:w-2/3" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent z-10" />
                <img 
                  src={`${IMAGE_BASE_URL}${heroItem.backdrop_path}`} 
                  alt={heroItem.title || heroItem.name} 
                  className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-fade-in"
                />
                
                <div className="relative z-20 max-w-2xl px-6 md:px-12 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Featured
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
                      <Star size={16} fill="currentColor" /> {heroItem.vote_average?.toFixed(1)}
                    </span>
                    <span className="text-neutral-400 text-sm">
                      {new Date(heroItem.release_date || heroItem.first_air_date || '').getFullYear()}
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                    {heroItem.title || heroItem.name}
                  </h1>

                  <p className="text-neutral-300 text-sm md:text-base line-clamp-3 max-w-xl">
                    {heroItem.overview}
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <button 
                      onClick={() => setSelectedMedia(heroItem)}
                      className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all shadow-lg"
                    >
                      <Play fill="currentColor" size={18} /> Watch Now
                    </button>
                    <button 
                      onClick={() => setSelectedMedia(heroItem)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl backdrop-blur-md transition-all border border-white/10"
                    >
                      <Info size={18} /> More Info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Rows */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 space-y-10">
              <MediaRow title="Trending This Week" items={trending} onSelect={setSelectedMedia} />
              <MediaRow title="Popular Movies" items={popularMovies} onSelect={setSelectedMedia} />
              <MediaRow title="Popular TV Shows" items={popularTV} onSelect={setSelectedMedia} />
              <MediaRow title="Top Rated Masterpieces" items={topRated} onSelect={setSelectedMedia} />
            </div>
          </div>
        )}
      </main>

      {/* Media Details & Player Modal */}
      {selectedMedia && mediaDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-5xl bg-[#121216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto">
            
            {/* Close Modal Button */}
            <button 
              onClick={() => { setSelectedMedia(null); setIsPlaying(false); }}
              className="absolute top-4 right-4 z-30 bg-black/60 hover:bg-black text-neutral-300 hover:text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {isPlaying ? (
              <div className="w-full">
                {/* Video Player */}
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={getEmbedSources(
                      mediaDetails.id, 
                      mediaDetails.media_type || (mediaDetails.title ? 'movie' : 'tv'), 
                      selectedSeason, 
                      selectedEpisode
                    )[activeServer].url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                </div>

                {/* Player Controls & Server Switcher */}
                <div className="p-4 bg-[#18181c] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium whitespace-nowrap">
                      <Server size={14} /> Servers (1080p / 4K):
                    </span>
                    <div className="flex gap-2">
                      {getEmbedSources(mediaDetails.id, mediaDetails.media_type || 'movie', selectedSeason, selectedEpisode).map((srv, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveServer(idx)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            activeServer === idx 
                              ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30' 
                              : `bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10`
                          }`}
                        >
                          {srv.name}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${srv.badgeColor}`}>
                            {srv.quality}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPlaying(false)}
                    className="text-sm text-neutral-400 hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all whitespace-nowrap"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Modal Backdrop Preview */}
                <div className="relative h-72 md:h-96 w-full">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/40 to-transparent z-10" />
                  <img 
                    src={`${IMAGE_BASE_URL}${mediaDetails.backdrop_path}`} 
                    alt={mediaDetails.title || mediaDetails.name} 
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute bottom-6 left-6 z-20 space-y-3">
                    <h2 className="text-3xl md:text-5xl font-black">{mediaDetails.title || mediaDetails.name}</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star size={16} fill="currentColor" /> {mediaDetails.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-neutral-400">
                        {new Date(mediaDetails.release_date || mediaDetails.first_air_date || '').getFullYear()}
                      </span>
                      {mediaDetails.runtime && (
                        <span className="text-neutral-400">{mediaDetails.runtime} min</span>
                      )}
                      {mediaDetails.number_of_seasons && (
                        <span className="text-neutral-400">{mediaDetails.number_of_seasons} Seasons</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Details Body */}
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/30"
                    >
                      <Play fill="currentColor" size={20} /> Play Full HD
                    </button>
                    <button
                      onClick={() => toggleWatchlist(mediaDetails)}
                      className={`flex items-center gap-2 font-semibold px-6 py-3.5 rounded-xl border transition-all ${
                        isSaved(mediaDetails.id) 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      <Bookmark size={18} fill={isSaved(mediaDetails.id) ? 'currentColor' : 'none'} />
                      {isSaved(mediaDetails.id) ? 'Saved to List' : 'Add to List'}
                    </button>
                  </div>

                  {/* TV Show Season & Episode Selectors */}
                  {mediaDetails.media_type === 'tv' && mediaDetails.seasons && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                      <h4 className="text-sm font-semibold text-neutral-300">Select Season & Episode</h4>
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={selectedSeason}
                          onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
                          className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                        >
                          {mediaDetails.seasons.filter(s => s.season_number > 0).map(season => (
                            <option key={season.id} value={season.season_number}>
                              Season {season.season_number} ({season.episode_count} Episodes)
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedEpisode}
                          onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                          className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                        >
                          {Array.from({ length: mediaDetails.seasons.find(s => s.season_number === selectedSeason)?.episode_count || 20 }, (_, i) => i + 1).map(ep => (
                            <option key={ep} value={ep}>Episode {ep}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <p className="text-neutral-300 leading-relaxed text-base">
                    {mediaDetails.overview}
                  </p>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2">
                    {mediaDetails.genres?.map(genre => (
                      <span key={genre.id} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-neutral-400">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function MediaRow({ title, items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
        <ChevronRight className="text-red-600" size={20} /> {title}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {items.map(item => (
          <MediaCard key={item.id} item={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}

function MediaCard({ item, onClick }) {
  const posterUrl = item.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null;
  const title = item.title || item.name;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const year = new Date(item.release_date || item.first_air_date || '').getFullYear() || '';

  return (
    <div 
      onClick={onClick}
      className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer space-y-2"
    >
      <div className="relative aspect-[2/3] bg-neutral-900 rounded-xl overflow-hidden border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-red-500/50 group-hover:shadow-xl group-hover:shadow-red-600/10">
        {posterUrl ? (
          <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs text-center p-2">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
            <Play size={12} fill="currentColor" /> Watch
          </span>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm truncate text-neutral-200 group-hover:text-white transition-colors">{title}</h4>
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{year}</span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Star size={12} fill="currentColor" /> {rating}
          </span>
        </div>
      </div>
    </div>
  );
}
