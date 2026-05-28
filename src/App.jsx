import React, { useState, useEffect } from 'react';
import { 
  Search, Bookmark, Menu, Download, 
  Calendar, Users, Monitor, SlidersHorizontal, 
  Clock, TrendingUp, ArrowUpDown, List, 
  LayoutGrid, MoreVertical, ArrowUp, Loader2, ArrowLeft, Star, PlayCircle
} from 'lucide-react';

const API_URL = "https://simplysmart.github.io/Ultra/latest/feed.json";
const DETAILS_API_URL = "https://simplysmart.github.io/Ultra/anime/";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  
  const [filters, setFilters] = useState({
    season: 'All Seasons', group: 'All Groups', resolution: '1080p', sort: 'Latest'
  });

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching static feed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Dynamic Routing Logic
  if (selectedAnimeId) {
    return <AnimeViewer 
      animeId={selectedAnimeId} 
      onBack={() => setSelectedAnimeId(null)} 
    />;
  }

  const groupedItems = items.reduce((groups, item) => {
    const date = new Date(item.pub_date);
    const today = new Date();
    let key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = "Today";
    else if (new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString()) key = "Yesterday";
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="text-xl font-bold tracking-tight text-gray-900">NEXTTOSHO</div>
        <div className="flex items-center gap-6 text-gray-600">
          <button className="hover:text-purple-600 transition-colors"><Search size={22} /></button>
          <button className="hover:text-purple-600 transition-colors"><Bookmark size={22} /></button>
          <button className="hover:text-purple-600 transition-colors"><Menu size={24} /></button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
              <Download size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Releases</h1>
          </div>
          <p className="text-gray-500 ml-[58px]">Latest anime episode releases from your favorite fansub groups.</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[160px]">
            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filters.resolution}
              onChange={(e) => handleFilterChange('resolution', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 font-medium text-gray-700"
            >
              <option>All Res</option><option>1080p</option><option>720p</option>
            </select>
          </div>
          <button className="bg-purple-50 text-purple-600 p-2.5 rounded-xl border border-purple-100 hover:bg-purple-100 shrink-0">
            <SlidersHorizontal size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader2 className="animate-spin text-purple-500" size={32} />
            <p>Syncing release feed...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p>No releases found.</p></div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedItems).map(([dateLabel, groupItems]) => (
              <div key={dateLabel}>
                <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-4 ml-1">{dateLabel}</h3>
                <div className="grid gap-4 grid-cols-1">
                  {groupItems.map(item => (
                    <ReleaseCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => {
                        // Extract anime_id gracefully for older items that might not have it explicitly
                        const aId = item.anime_id || item.id.substring(0, item.id.lastIndexOf('-'));
                        setSelectedAnimeId(aId);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// THE NEW EPISODE VIEWER COMPONENT
function AnimeViewer({ animeId, onBack }) {
  const [animeData, setAnimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetails = async () => {
      try {
        const response = await fetch(`${DETAILS_API_URL}${animeId}.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Could not find historical data");
        const data = await response.json();
        setAnimeData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [animeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center text-gray-400 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <p>Loading full database...</p>
      </div>
    );
  }

  if (!animeData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-4">Failed to load series history.</p>
        <button onClick={onBack} className="text-purple-600 font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  const details = animeData.details || {};
  const encodedTitle = encodeURIComponent(animeData.title);
  const poster = animeData.poster || details.poster || `https://ui-avatars.com/api/?name=${encodedTitle}&background=F3F4F6&color=7C3AED&size=256&font-size=0.4&bold=true`;
  
  // Sort episodes highest to lowest
  const sortedEpisodes = Object.entries(animeData.episodes).sort((a, b) => {
    return parseFloat(b[0]) - parseFloat(a[0]);
  });

  const CustomMagnet = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V8"/><path d="M5 8V4"/><path d="M19 8V4"/><path d="M2.5 8H7.5"/><path d="M16.5 8H21.5"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 pb-20 animate-in fade-in duration-300">
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-800 transition-colors">
          <ArrowLeft size={20} /> Back to Releases
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-10">
          <div className="shrink-0 w-48 mx-auto sm:mx-0">
            <img src={poster} alt={animeData.title} className="w-full h-auto aspect-[2/3] object-cover rounded-2xl shadow-lg border border-gray-200" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 text-center sm:text-left">{animeData.title}</h1>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-4">
              {details.score && details.score !== "N/A" && (
                <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200">
                  <Star size={16} fill="currentColor" /> {details.score}
                </span>
              )}
              <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-bold border border-purple-100">
                {details.status || "Ongoing"}
              </span>
              {details.year && details.year !== "Unknown" && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold border border-gray-200">
                  {details.year}
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              {details.genres && details.genres.map(genre => (
                <span key={genre} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg shadow-sm">
                  {genre}
                </span>
              ))}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed max-h-32 overflow-y-auto pr-2 no-scrollbar border-l-4 border-purple-200 pl-4">
              {details.synopsis || "Synopsis data is currently being synced from the API. Check back after the next database refresh."}
            </p>
          </div>
        </div>

        {/* Episodes List */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PlayCircle className="text-purple-600" /> Complete Release History
        </h2>

        <div className="flex flex-col gap-4">
          {sortedEpisodes.map(([epNum, epData]) => (
            <div key={epNum} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 border border-gray-200 h-12 w-12 rounded-xl flex items-center justify-center shrink-0">
                  <span className="font-extrabold text-gray-800">{epNum}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Episode {epNum}</p>
                  <p className="text-xs text-gray-400">{new Date(epData.released_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {epData.releases.map((r, i) => (
                  <div key={i} className="flex items-center justify-between sm:justify-end gap-3 bg-[#F8F9FB] p-2 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                         {r.resolution}
                       </span>
                       <span className="text-xs font-bold text-gray-600">{r.group}</span>
                       <span className="text-xs text-gray-400 font-medium">({r.size})</span>
                     </div>
                     <a href={r.magnet} className="p-1.5 text-purple-600 hover:text-white transition-colors bg-white hover:bg-purple-600 rounded-md shadow-sm border border-gray-200 hover:border-purple-600">
                       <CustomMagnet />
                     </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// Updated ReleaseCard to make it clickable
function ReleaseCard({ item, onClick }) {
  const encodedTitle = encodeURIComponent(item.clean_title.trim());
  const fallbackThumb = `https://ui-avatars.com/api/?name=${encodedTitle}&background=F3F4F6&color=7C3AED&size=256&font-size=0.4&bold=true`;

  const CustomMagnet = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V8"/><path d="M5 8V4"/><path d="M19 8V4"/><path d="M2.5 8H7.5"/><path d="M16.5 8H21.5"/>
    </svg>
  );

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex p-3 gap-3 sm:gap-4 cursor-pointer hover:border-purple-200 relative overflow-hidden"
    >
      <div className="absolute right-[-20px] top-[-20px] w-16 h-16 bg-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200 w-24 sm:w-40 aspect-video sm:h-[90px]">
        <img 
          src={item.poster || fallbackThumb} 
          alt={item.clean_title} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate mb-1.5" title={item.clean_title}>{item.clean_title}</h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#F3F4F6] text-gray-600 text-xs font-semibold rounded-md border border-gray-200">
              EP {item.episode}
            </span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100">
              {item.resolution}
            </span>
            <span className="px-2 py-0.5 bg-white text-gray-500 text-xs font-semibold rounded-md border border-gray-200">
              {item.size}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mt-1 sm:mt-2">
          <div className="flex items-center text-xs sm:text-sm mb-1">
            <span className={`font-bold ${item.group === 'SubsPlease' ? 'text-purple-600' : 'text-blue-600'}`}>
              {item.group}
            </span>
            <span className="text-gray-300 mx-1.5">•</span>
            <div className="flex items-center text-gray-500 font-semibold gap-1">
              <ArrowUp size={14} className="text-green-500 stroke-[3]" />
              {item.seeders ? item.seeders.toLocaleString() : "0"}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a 
              href={item.magnet} 
              onClick={(e) => e.stopPropagation()} 
              className="p-2 text-purple-600 hover:text-white transition-colors bg-purple-50 hover:bg-purple-600 rounded-lg shadow-sm"
            >
              <CustomMagnet />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
