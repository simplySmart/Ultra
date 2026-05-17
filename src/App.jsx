import React, { useState, useEffect } from 'react';
import { 
  Search, Bookmark, Menu, Download, 
  Calendar, Users, Monitor, SlidersHorizontal, 
  Clock, TrendingUp, ArrowUpDown, List, 
  LayoutGrid, MoreVertical, ArrowUp, Image as ImageIcon, Loader2
} from 'lucide-react';

const API_URL = "https://simplysmart.github.io/Ultra/latest/feed.json";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  const [filters, setFilters] = useState({
    season: 'All Seasons',
    group: 'All Groups', 
    resolution: '1080p', 
    sort: 'Latest'
  });

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Network response was not ok");
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const groupedItems = items.reduce((groups, item) => {
    const date = new Date(item.pub_date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString();
    
    let key = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (isToday) key = "Today";
    if (isYesterday) key = "Yesterday";

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
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-700"
            >
              <option>All Seasons</option>
              <option>Summer 2026</option>
            </select>
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filters.group}
              onChange={(e) => handleFilterChange('group', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-700"
            >
              <option>All Groups</option>
              <option>SubsPlease</option>
              <option>Erai-raws</option>
            </select>
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filters.resolution}
              onChange={(e) => handleFilterChange('resolution', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all font-medium text-gray-700"
            >
              <option>All Res</option>
              <option>1080p</option>
              <option>720p</option>
            </select>
          </div>
          <button className="bg-purple-50 text-purple-600 p-2.5 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors shrink-0">
            <SlidersHorizontal size={22} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-1 mb-8 shadow-sm">
          <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
            {['Latest', 'Most Seeded', 'A - Z'].map(sort => (
              <button 
                key={sort}
                onClick={() => handleFilterChange('sort', sort)}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  filters.sort === sort ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {sort === 'Latest' && <Clock size={16} />}
                {sort === 'Most Seeded' && <TrendingUp size={16} />}
                {sort === 'A - Z' && <ArrowUpDown size={16} />}
                {sort}
              </button>
            ))}
          </div>
          <div className="flex gap-1 px-2 border-l border-gray-100">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader2 className="animate-spin text-purple-500" size={32} />
            <p>Syncing release feed...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No releases found. Run the GitHub Action manually to sync the updated titles.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedItems).map(([dateLabel, groupItems]) => (
              <div key={dateLabel}>
                <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-4 ml-1">{dateLabel}</h3>
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {groupItems.map(item => (
                    <ReleaseCard key={item.id} item={item} viewMode={viewMode} />
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

function ReleaseCard({ item, viewMode }) {
  const isList = viewMode === 'list';
  
  // Clean fallback title matching for the dynamic thumbnail lookup API
  const encodedTitle = encodeURIComponent(item.clean_title.trim());
  const fallbackThumb = `https://images.weserv.nl/?url=https://avatar.iran.liara.run/username?username=${encodedTitle}&bg=7C3AED&color=ffffff`;

  const CustomMagnet = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V8"/>
      <path d="M5 8V4"/><path d="M19 8V4"/><path d="M2.5 8H7.5"/><path d="M16.5 8H21.5"/>
    </svg>
  );

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group ${isList ? 'flex p-3 gap-3 sm:gap-4' : 'flex flex-col p-4 gap-4'}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200 ${isList ? 'w-24 sm:w-40 aspect-video sm:h-[90px]' : 'w-full aspect-video'}`}>
        <img 
          src={fallbackThumb} 
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
            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg">
              <Download size={18} />
            </button>
            <a href={item.magnet} className="p-2 text-purple-600 hover:text-white transition-colors bg-purple-50 hover:bg-purple-600 rounded-lg shadow-sm">
              <CustomMagnet />
            </a>
            <button className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
