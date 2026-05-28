import React, { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, Clock, Star, ChevronDown } from 'lucide-react';

export default function Schedule({ onOpenAnime }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  const daysOrder = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }) + 's';

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/schedules');
        if (!res.ok) throw new Error("Failed to fetch schedule from API");
        const data = await res.json();
        
        const grouped = {};
        daysOrder.forEach(d => grouped[d] = []);
        
        data.data.forEach(anime => {
          // THE FIX: Only show mainstream anime (Over 15k members) to filter out obscure kids' shows
          if (anime.members < 15000) return;

          if (anime.broadcast && typeof anime.broadcast.day === 'string') {
            let day = anime.broadcast.day.trim();
            if (!day.endsWith('s')) day += 's';
            day = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            
            if (grouped[day]) {
              grouped[day].push(anime);
            }
          }
        });
        setSchedule(grouped);
      } catch (err) {
        console.error("Failed to sync schedule:", err);
      } finally {
        setLoading(false);
        setExpandedDay(todayStr);
      }
    };
    fetchSchedule();
  }, [todayStr]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <p>Syncing live schedule...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 pb-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
            <CalendarIcon size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Schedule</h1>
        </div>
        <p className="text-gray-500 ml-[58px]">
          The official broadcast schedule, automatically synced and organized.
        </p>
      </div>
      
      <div className="flex flex-col gap-5">
        {daysOrder.map((day) => {
          const dayAnime = schedule[day] || [];
          const isToday = todayStr === day;
          const isExpanded = expandedDay === day;
          
          const bannerImage = dayAnime[0]?.images?.webp?.large_image_url || dayAnime[0]?.images?.jpg?.large_image_url;

          return (
            <div key={day} className="flex flex-col">
              <button 
                onClick={() => setExpandedDay(isExpanded ? null : day)}
                className={`relative w-full h-20 sm:h-24 flex items-center justify-between px-6 rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm cursor-pointer group ${
                  isExpanded ? 'border-purple-300 ring-4 ring-purple-50' : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                {bannerImage && (
                  <div className="absolute inset-0 z-0">
                    <img src={bannerImage} alt="Banner" className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                )}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-white/40" />
                
                <div className="relative z-10 flex items-center gap-4">
                  <h2 className={`text-2xl sm:text-3xl font-black tracking-tight uppercase ${isExpanded ? 'text-purple-600' : 'text-gray-900'}`}>
                    {day.replace('s', '')}
                  </h2>
                  {isToday && (
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
                      Today
                    </span>
                  )}
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <span className="hidden sm:block text-xs font-bold text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    {dayAnime.length} Shows
                  </span>
                  <div className={`text-gray-400 bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-gray-200 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-purple-600 border-purple-200' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </button>

              <div 
                className={`grid transition-all duration-500 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-3 px-1 sm:px-2 pb-2">
                    {dayAnime.length === 0 ? (
                       <p className="text-gray-400 text-sm font-semibold p-4 text-center border-2 border-dashed border-gray-100 rounded-xl">No major releases scheduled for today.</p>
                    ) : (
                      dayAnime.map(anime => (
                        <AnimeScheduleCard 
                          key={anime.mal_id} 
                          anime={anime} 
                          onOpenAnime={onOpenAnime} 
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimeScheduleCard({ anime, onOpenAnime }) {
  const title = anime.title_english || anime.title;
  const image = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
  const score = anime.score || "N/A";
  const time = anime.broadcast?.time || "TBA";
  
  const handleOpen = () => {
    const normalizedId = anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    onOpenAnime(normalizedId);
  };

  return (
    <div 
      onClick={handleOpen}
      className="group flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 cursor-pointer transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute right-[-20px] top-[-20px] w-16 h-16 bg-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative w-24 sm:w-32 shrink-0 rounded-lg overflow-hidden bg-gray-100 aspect-video border border-gray-200">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0 z-10">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border border-purple-100">
            <Clock size={12} /> {time} JST
          </span>
          
          {score !== "N/A" && (
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border border-yellow-200">
              <Star size={12} fill="currentColor" /> {score}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
