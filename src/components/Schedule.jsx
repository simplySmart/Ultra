import React, { useState, useEffect, useRef } from 'react';

export default function Schedule({ onOpenAnime }) {
  const [dates, setDates] = useState([]);
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cache to store data by weekday to prevent duplicate API calls
  const cache = useRef({});
  const dateScrollerRef = useRef(null);

  const localTimeZone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName')?.value || 'LOCAL TIME';

  // 1. Generate Full Current Month Dynamically
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const generatedDates = [];
    let todayIndex = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isToday = i === today.getDate();
      
      if (isToday) todayIndex = i - 1;

      generatedDates.push({
        apiDay: d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        dateNum: i,
        monthStr: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: isToday
      });
    }
    
    setDates(generatedDates);
    setActiveDateIndex(todayIndex); // Auto-open current day
  }, []);

  // 2. Auto-Center the Active Date Tab
  useEffect(() => {
    if (dateScrollerRef.current && dates.length > 0) {
      const activeTab = dateScrollerRef.current.children[activeDateIndex];
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeDateIndex, dates]);

  // 3. Fetch Data with Day-Based Caching & Safe Pagination
  useEffect(() => {
    if (dates.length === 0) return;

    let isMounted = true;
    const fetchSchedule = async () => {
      const targetDay = dates[activeDateIndex].apiDay;

      if (cache.current[targetDay]) {
        setScheduleData(cache.current[targetDay]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setScheduleData([]);

      try {
        let page = 1;
        let hasNextPage = true;
        let allFetchedAnime = [];

        while (hasNextPage) {
          const res = await fetch(`https://api.jikan.moe/v4/schedules?filter=${targetDay}&page=${page}`);
          if (!res.ok) throw new Error("Failed to fetch");
          
          const json = await res.json();
          if (json && json.data) {
            allFetchedAnime.push(...json.data);
          }

          hasNextPage = json.pagination?.has_next_page || false;
          if (hasNextPage) {
            page++;
            await new Promise(r => setTimeout(r, 333)); 
          }
        }

        if (!isMounted) return;

        const uniqueAnimeMap = new Map();
        allFetchedAnime.forEach(anime => uniqueAnimeMap.set(anime.mal_id, anime));
        const uniqueAnime = Array.from(uniqueAnimeMap.values());

        uniqueAnime.sort((a, b) => (a.broadcast?.time || "23:59").localeCompare(b.broadcast?.time || "23:59"));

        cache.current[targetDay] = uniqueAnime;
        setScheduleData(uniqueAnime);
      } catch (error) {
        console.error("Schedule fetch error:", error);
        if (isMounted) setScheduleData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSchedule();
    return () => { isMounted = false; };
  }, [activeDateIndex, dates]);

  // 4. Robust JST to Local Time Conversion
  const convertJSTtoLocal = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return "TBA";
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return "TBA";
    
    const date = new Date();
    date.setUTCHours(h - 9, m, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // 5. Mathematical Estimator for Episode Number
  const getEstimatedEpisode = (airedFrom) => {
    if (!airedFrom) return null;
    const start = new Date(airedFrom);
    const today = new Date();
    if (start > today) return "Ep 1";
    const diffWeeks = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 7));
    return `Ep ${diffWeeks + 1}`;
  };

  // 6. Calculate "Up Next" Anime based on exact current time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let nextAnimeId = null;

  if (dates[activeDateIndex]?.isToday && scheduleData.length > 0) {
    const upcoming = scheduleData.find(anime => {
      const timeStr = convertJSTtoLocal(anime.broadcast?.time);
      if (timeStr === "TBA") return false;
      const [h, m] = timeStr.split(':').map(Number);
      return (h * 60 + m) >= currentMinutes;
    });
    if (upcoming) nextAnimeId = upcoming.mal_id;
  }

  // 7. Auto-Scroll down to the "Up Next" Anime
  useEffect(() => {
    if (!loading && dates[activeDateIndex]?.isToday && nextAnimeId) {
      const timer = setTimeout(() => {
        const upcomingEl = document.getElementById('upcoming-anime');
        if (upcomingEl) {
          upcomingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, activeDateIndex, dates, nextAnimeId]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Schedule</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-6">
          ALL TIMES AUTO-CONVERTED TO {localTimeZone.toUpperCase()}
        </p>
      </div>

      {/* Horizontal Date Scroller */}
      <div 
        ref={dateScrollerRef}
        className="flex items-center gap-3 overflow-x-auto pb-6 pt-2 snap-x px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((dayObj, idx) => {
          const isActive = activeDateIndex === idx;
          return (
            <button 
              key={idx} 
              onClick={() => setActiveDateIndex(idx)} 
              className={`shrink-0 snap-center w-[72px] h-[96px] flex flex-col items-center justify-center rounded-[24px] border transition-colors duration-300 ${
                isActive 
                  ? 'bg-black text-white border-black shadow-lg' 
                  : 'bg-white text-gray-500 border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`text-[11px] font-bold mb-1 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {dayObj.shortDay}
              </span>
              <span className={`text-2xl font-black leading-none ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {dayObj.dateNum}
              </span>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {dayObj.monthStr}
              </span>
            </button>
          )
        })}
      </div>

      {/* Current Date Label */}
      {dates.length > 0 && (
        <h3 className="text-base font-medium text-gray-900 mb-5">
          {dates[activeDateIndex].fullLabel}
        </h3>
      )}

      {/* WIDER CARDS CONTAINER: max-w-4xl instead of max-w-2xl */}
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm text-gray-400 font-medium text-sm">
            No releases scheduled for this day.
          </div>
        ) : scheduleData.map((anime) => {
          const localTime = convertJSTtoLocal(anime.broadcast?.time);
          const isNext = anime.mal_id === nextAnimeId;
          const estimatedEp = getEstimatedEpisode(anime.aired?.from);

          return (
            <div 
              key={anime.mal_id} 
              id={isNext ? 'upcoming-anime' : undefined}
              onClick={() => onOpenAnime(anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
              className={`flex items-center bg-white border p-2 pr-4 sm:pr-6 rounded-[1.75rem] cursor-pointer transition-all duration-500 group ${
                isNext ? 'border-purple-300 ring-4 ring-purple-50 shadow-md transform scale-[1.02]' : 'border-gray-200 hover:shadow-md hover:border-gray-300'
              }`}
            >
              {/* Image */}
              <div className="relative w-28 sm:w-36 aspect-[16/9] overflow-hidden rounded-[1.25rem] shrink-0 bg-gray-100">
                <img 
                  src={anime.images?.webp?.large_image_url || anime.images?.jpg?.image_url} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={anime.title} 
                  loading="lazy"
                />
              </div>
              
              {/* Text Content */}
              <div className="pl-4 flex flex-col flex-1 min-w-0 justify-center">
                <h4 className={`text-[15px] sm:text-base font-bold truncate mb-1 ${isNext ? 'text-purple-700' : 'text-gray-900'}`}>
                  {anime.title_english || anime.title}
                </h4>
                
                {/* Unchanged Base Structure with New Ep Badge Injected */}
                <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                  {estimatedEp && (
                    <span className="shrink-0 text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                      {estimatedEp}
                    </span>
                  )}
                  {anime.type && (
                    <span className="shrink-0 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                      {anime.type}
                    </span>
                  )}
                  {anime.genres?.[0] && (
                    <span className="truncate text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                      {anime.genres[0].name}
                    </span>
                  )}
                </div>
              </div>

              {/* Broadcast Time & Up Next Badge */}
              <div className="shrink-0 pl-2 flex flex-col items-end">
                {isNext && (
                  <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md mb-1 animate-pulse">
                    UP NEXT
                  </span>
                )}
                <span className={`text-sm font-bold ${isNext ? 'text-purple-700' : 'text-[#e50914]'}`}>
                  {localTime}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
