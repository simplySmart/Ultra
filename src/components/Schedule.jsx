import React, { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

export default function Schedule({ onOpenAnime }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Fetch current airing season schedule
        const res = await fetch('https://api.jikan.moe/v4/schedules');
        const data = await res.json();
        
        const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
        const grouped = {};
        days.forEach(d => grouped[d] = []);
        
        data.data.forEach(anime => {
          if (anime.broadcast && anime.broadcast.day) {
            const day = anime.broadcast.day;
            if (grouped[day]) grouped[day].push(anime);
          }
        });
        setSchedule(grouped);
      } catch (err) {
        console.error("Failed to sync schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return {
      date: i + 1,
      isToday: i + 1 === today.getDate(),
      weekday: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][date.getDay()]
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <p>Syncing monthly schedule...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
            <CalendarIcon size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        </div>
        <p className="text-gray-500 ml-[58px]">
          Currently airing releases for {today.toLocaleString('default', { month: 'long', year: 'numeric' })}.
        </p>
      </div>
      
      <div className="space-y-6">
        {dates.map((dayObj) => {
          const dayAnime = schedule[dayObj.weekday] || [];
          if (dayAnime.length === 0) return null;

          return (
            <div key={dayObj.date} className={`bg-white rounded-2xl border ${dayObj.isToday ? 'border-purple-300 shadow-md ring-4 ring-purple-50' : 'border-gray-100 shadow-sm'} p-5`}>
              <div className="flex items-center gap-4 mb-5 border-b border-gray-50 pb-4">
                <div className={`${dayObj.isToday ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'} h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm`}>
                  <span className="text-xs font-bold uppercase tracking-wider">{today.toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xl font-extrabold leading-none mt-0.5">{dayObj.date}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{dayObj.weekday.replace('s', '')}</h3>
                  <p className={`text-sm font-medium ${dayObj.isToday ? 'text-purple-600' : 'text-gray-400'}`}>
                    {dayObj.isToday ? 'Airing Today' : `${dayAnime.length} releases`}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {dayAnime.map(anime => (
                  <div 
                    key={anime.mal_id} 
                    onClick={() => {
                      // Normalize the Jikan title to seamlessly match your backend JSON IDs
                      const normalizedId = anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      onOpenAnime(normalizedId);
                    }}
                    className="group cursor-pointer flex flex-col gap-2"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img 
                        src={anime.images?.jpg?.image_url} 
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors" title={anime.title}>
                      {anime.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
