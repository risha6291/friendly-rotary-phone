import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, Clock, Film } from 'lucide-react';
import { Movie } from '../types';

interface BannerProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  currentIndex?: number;
  totalBanners?: number;
  onDotClick?: (index: number) => void;
}

const getBadgeStyle = (badge: string) => {
  const upperBadge = badge.toUpperCase();
  
  if (upperBadge.includes('TREND')) {
    return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-[0_0_15px_rgba(255,215,0,0.6)]';
  } else if (upperBadge.includes('NEW')) {
    return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]';
  } else if (upperBadge.includes('HOT') || upperBadge.includes('POPULAR')) {
    return 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]';
  } else if (upperBadge.includes('EXCLUSIVE')) {
    return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]';
  } else if (upperBadge.includes('1080') || upperBadge.includes('4K') || upperBadge.includes('HD')) {
    return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]';
  }
  
  return 'bg-white/15 backdrop-blur-xl text-white/90 border border-white/20';
};

const Banner: React.FC<BannerProps> = ({ 
  movie, 
  onClick, 
  currentIndex = 0, 
  totalBanners = 1,
  onDotClick 
}) => {
  const badges = [];
  
  if (movie.customBadges && movie.customBadges.length > 0) {
    badges.push(...movie.customBadges);
  }
  
  if (movie.category && !badges.includes(movie.category)) {
    badges.push(movie.category);
  }
  
  if (movie.videoQuality && !badges.some(b => b.includes('1080') || b.includes('4K') || b.includes('HD'))) {
    badges.push(movie.videoQuality);
  }

  return (
    <div
      onClick={() => onClick(movie)}
      className="relative w-full overflow-hidden mb-6 group select-none cursor-pointer"
      style={{ aspectRatio: '2/3', maxHeight: '88vh' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={movie.thumbnail}
              alt={movie.title}
              className="w-full h-full object-cover pointer-events-none"
              style={{ 
                objectPosition: 'center top', 
                imageRendering: 'high-quality',
                filter: 'contrast(1.08) saturate(1.15) brightness(0.95)'
              }}
            />
            {/* Enhanced gradients */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-10" />
            <div className="absolute bottom-0 inset-x-0 h-[70%] bg-gradient-to-t from-black via-black/98 to-transparent z-10" />
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black/60 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-black/40 to-transparent z-10" />
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-10 z-20">
            <div className="max-w-xl">
              
              {/* Floating Premium Badges */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-3 flex-wrap"
              >
                {badges.slice(0, 4).map((badge, index) => (
                  <motion.span 
                    key={index}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                    className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${getBadgeStyle(badge)}`}
                  >
                    {badge}
                  </motion.span>
                ))}
              </motion.div>
              
              {/* PREMIUM TITLE - Enhanced Visibility */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-[2.5rem] md:text-5xl font-black leading-[0.9] mb-3 tracking-tight"
                style={{
                  fontFamily: "'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
                  background: 'linear-gradient(to bottom, #FFFFFF 0%, #F5F5F5 30%, #FFD700 60%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) drop-shadow(0 4px 20px rgba(0,0,0,0.95)) drop-shadow(0 0 30px rgba(0,0,0,0.7))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}
              >
                {movie.title}
              </motion.h1>
              
              {/* Metadata Row */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2.5 mb-4 text-[11px] font-bold text-gray-200 flex-wrap"
              >
                {movie.rating && (
                  <div className="flex items-center gap-1">
                    <Star size={11} fill="#FFD700" className="text-gold" />
                    <span className="text-white">{movie.rating}</span>
                  </div>
                )}
                
                {movie.year && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                    <span>{movie.year}</span>
                  </>
                )}

                {/* Episode Range for Series */}
                {movie.episodeRange && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                    <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                      <Film size={10} className="text-blue-300" />
                      <span className="text-blue-200 font-extrabold text-[10px]">{movie.episodeRange}</span>
                    </div>
                  </>
                )}
                
                {movie.duration && !movie.episodeRange && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-gray-400" />
                      <span>{movie.duration}</span>
                    </div>
                  </>
                )}
              </motion.div>
              
              {/* Description */}
              {movie.description && (
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-gray-300 text-[11px] line-clamp-2 mb-5 font-medium max-w-sm leading-relaxed"
                >
                  {movie.description}
                </motion.p>
              )}
              
              {/* Premium Buttons */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3"
              >
                <button 
                  className="group/btn relative overflow-hidden bg-white hover:bg-yellow-400 text-black px-8 py-3.5 rounded-xl font-black text-sm flex items-center gap-2.5 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.5)] active:scale-95 z-30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                  <Play size={18} fill="black" className="relative z-10" />
                  <span className="relative z-10 tracking-wide">PLAY NOW</span>
                </button>
                
                <button 
                  className="relative bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                >
                  <Info size={14} />
                  <span>More Info</span>
                </button>
              </motion.div>
              
            </div>
          </div>
          
          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] z-[5]" />
          
          {/* Navigation Dots */}
          {totalBanners > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
              {[...Array(totalBanners)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDotClick?.(idx);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentIndex 
                      ? 'bg-white w-6 h-1.5 shadow-[0_0_12px_rgba(255,255,255,0.8)]' 
                      : 'bg-white/30 w-1.5 h-1.5 hover:bg-white/50'
                  }`}
                  aria-label={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          )}
          
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Banner;
