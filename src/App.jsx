import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Menu, Download, Monitor, SlidersHorizontal, List, LayoutGrid, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ReleaseCard from './components/ReleaseCard';
import AnimeViewer from './components/AnimeViewer';

const API_URL = "https://simplysmart.github.io/Ultra/latest/feed.json";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); 
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);
  const [filters, setFilters] = useState({ resolution: '1080p' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

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

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.animeId) setSelectedAnimeId(event.state.animeId);
      else setSelectedAnimeId(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAnime = (aId) => {
    window.history.pushState({ animeId: aId }, '', '');
    setSelectedAnimeId(aId);
  };

  const closeAnime = () => window.history.back();

  if (selectedAnimeId) {
    return <AnimeViewer animeId={selectedAnimeId} onBack={closeAnime} />;
  }

  // 1. Apply Filters
  const filteredItems = items.filter(item => {
    if (filters.resolution !== 'All Res' && item.resolution !== filters.resolution) return false;
    return true;
  });

  // 2. Apply Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // 3. Group the current page items
  const groupedItems = currentItems.reduce((groups, item) => {
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
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans pb-10">
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
            <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl"><Download size={28} strokeWidth={2.5} /></div>
            <h1 className="text-3xl font-bold text-gray-900">Releases</h1>
          </div>
          <p className="text-gray-500 ml-[58px]">Latest anime episode releases from your favorite fansub groups.</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[160px]">
            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filters.resolution}
              onChange={(e) => { setFilters({ resolution: e.target.value }); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 font-medium text-gray-700"
            >
              <option>All Res</option><option>1080p</option><option>720p</option>
            </select>
          </div>
          <button className="bg-purple-50 text-purple-600 p-2.5 rounded-xl border border-purple-100 hover:bg-purple-100 shrink-0">
            <SlidersHorizontal size={22} />
          </button>
        </div>

        <div className="flex items-center justify-end bg-white border border-gray-100 rounded-xl p-1 mb-8 shadow-sm">
          <div className="flex gap-1 px-2">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}>
              <List size={20} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader2 className="animate-spin text-purple-500" size={32} />
            <p>Syncing release feed...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p>No releases found.</p></div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedItems).map(([dateLabel, groupItems]) => (
              <div key={dateLabel}>
                <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-4 ml-1">{dateLabel}</h3>
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {groupItems.map(item => (
                    <ReleaseCard 
                      key={item.id} 
                      item={item} 
                      viewMode={viewMode}
                      onClick={() => openAnime(item.anime_id || item.id.substring(0, item.id.lastIndexOf('-')))}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-10">
                <button 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm"
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <span className="text-gray-500 font-bold text-sm">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
