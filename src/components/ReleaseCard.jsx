import React from 'react';
import { ArrowUp } from 'lucide-react';

const CustomMagnet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V8"/><path d="M5 8V4"/><path d="M19 8V4"/><path d="M2.5 8H7.5"/><path d="M16.5 8H21.5"/>
  </svg>
);

export default function ReleaseCard({ item, onClick, viewMode }) {
  const isList = viewMode === 'list';
  const encodedTitle = encodeURIComponent(item.clean_title.trim());
  const fallbackThumb = `https://ui-avatars.com/api/?name=${encodedTitle}&background=F3F4F6&color=7C3AED&size=256&font-size=0.4&bold=true`;

  return (
    <div onClick={onClick} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-purple-200 relative overflow-hidden ${isList ? 'flex p-3 gap-3 sm:gap-4' : 'flex flex-col p-4 gap-4'}`}>
      <div className="absolute right-[-20px] top-[-20px] w-16 h-16 bg-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200 ${isList ? 'w-24 sm:w-40 aspect-video sm:h-[90px]' : 'w-full aspect-video'}`}>
        <img src={item.poster || fallbackThumb} alt={item.clean_title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      </div>
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate mb-1.5" title={item.clean_title}>{item.clean_title}</h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#F3F4F6] text-gray-600 text-xs font-semibold rounded-md border border-gray-200">EP {item.episode}</span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100">{item.resolution}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-1 sm:mt-2">
          <div className="flex items-center text-xs sm:text-sm mb-1">
            <span className={`font-bold ${item.group === 'SubsPlease' ? 'text-purple-600' : 'text-blue-600'}`}>{item.group}</span>
            <span className="text-gray-300 mx-1.5">•</span>
            <div className="flex items-center text-gray-500 font-semibold gap-1">
              <ArrowUp size={14} className="text-green-500 stroke-[3]" />{item.seeders ? item.seeders.toLocaleString() : "0"}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <a href={item.magnet} onClick={(e) => e.stopPropagation()} className="p-2 text-purple-600 hover:text-white transition-colors bg-purple-50 hover:bg-purple-600 rounded-lg shadow-sm">
              <CustomMagnet />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
