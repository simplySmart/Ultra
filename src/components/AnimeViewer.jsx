import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Star, PlayCircle } from 'lucide-react';

const DETAILS_API_URL = "https://simplysmart.github.io/Ultra/anime/";

const CustomMagnet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V8"/><path d="M5 8V4"/><path d="M19 8V4"/><path d="M2.5 8H7.5"/><path d="M16.5 8H21.5"/>
  </svg>
);

export default function AnimeViewer({ animeId, onBack }) {
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
  const sortedEpisodes = Object.entries(animeData.episodes).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 pb-20 animate-in fade-in duration-300">
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-800 transition-colors">
          <ArrowLeft size={20} /> Back to Releases
        </button>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                       <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">{r.resolution}</span>
                       <span className="text-xs font-bold text-gray-600">{r.group}</span>
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
