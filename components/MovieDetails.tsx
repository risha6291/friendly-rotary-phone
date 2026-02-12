import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Star, X, Download, Send,
  Clock, Database, Volume2, MessageSquare, Tv, Lock, Calendar,
  ChevronRight, CheckCircle, Eye
} from 'lucide-react';
import { Movie, SeasonInfo } from '../types';

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
  botUsername: string;
  channelLink: string;
}

// iPhone-style floating metadata card
const MetaCard: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-lg">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold text-white truncate">{value}</div>
    </div>
  </div>
);

// Screenshot viewer
const ScreenshotViewer: React.FC<{ screenshots: string[]; initialIndex: number; onClose: () => void }> = ({ screenshots, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xl">
        <X size={20} className="text-white" />
      </button>
      <div className="text-xs text-gray-400 mb-3">{current + 1} / {screenshots.length}</div>
      <img
        src={screenshots[current]}
        alt={`Screenshot ${current + 1}`}
        className="max-w-full max-h-[80vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex gap-2 mt-4">
        {screenshots.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
            className={`h-1.5 rounded-full transition-all ${idx === current ? 'bg-gold w-6' : 'bg-white/30 w-1.5'}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose, botUsername, channelLink }) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'info'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleWatch = (code: string) => {
    const url = `https://t.me/${botUsername}?start=${code}`;
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownload = (downloadCode?: string, downloadLink?: string, fallbackCode?: string) => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
    } else if (downloadCode) {
      const url = `https://t.me/${botUsername}?start=${downloadCode}`;
      if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } else if (fallbackCode) {
      handleWatch(fallbackCode);
    }
  };

  const isSeries = movie.category === 'Series' || movie.category === 'Korean Drama' || (movie.episodes && movie.episodes.length > 0);

  const episodesBySeason = useMemo(() => {
    if (!movie.episodes) return {};
    const groups: Record<number, typeof movie.episodes> = {};
    movie.episodes.forEach(ep => {
      const s = ep.season || 1;
      if (!groups[s]) groups[s] = [];
      groups[s].push(ep);
    });
    Object.keys(groups).forEach(key => {
      groups[+key].sort((a, b) => a.number - b.number);
    });
    return groups;
  }, [movie.episodes]);

  const seasonNumbers = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);
  const currentSeasonEpisodes = episodesBySeason[selectedSeason] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
      >
        <X className="text-white" size={20} />
      </button>

      {/* Hero Banner */}
      <div className="relative w-full h-[45vh] overflow-hidden">
        <img
          src={movie.detailBanner || movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Custom Badges - Top Left */}
        {movie.customBadges && movie.customBadges.length > 0 && (
          <div className="absolute top-6 left-4 flex gap-2">
            {movie.customBadges.slice(0, 3).map((badge, idx) => {
              let badgeClass = "bg-white/20 text-white";
              if (badge.toLowerCase().includes('exclusive')) badgeClass = "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
              else if (badge.toLowerCase().includes('hd')) badgeClass = "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
              else if (badge.toLowerCase().includes('new')) badgeClass = "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
              
              return (
                <span key={idx} className={`${badgeClass} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide backdrop-blur-xl border border-white/20`}>
                  {badge}
                </span>
              );
            })}
          </div>
        )}

        {/* Title at Bottom */}
        <div className="absolute bottom-6 left-4 right-4">
          <h1 className="text-3xl font-black text-white mb-2 leading-tight drop-shadow-2xl"
              style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}>
            {movie.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24 -mt-6 relative z-10">
        
        {/* iPhone-style Metadata Cards - Only essential info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {movie.duration && (
            <MetaCard
              icon={<Clock size={16} className="text-blue-400" />}
              value={movie.duration}
              label="Runtime"
            />
          )}
          {movie.videoQuality && (
            <MetaCard
              icon={<Tv size={16} className="text-purple-400" />}
              value={movie.videoQuality}
              label="Quality"
            />
          )}
          {movie.audioLanguage && (
            <MetaCard
              icon={<Volume2 size={16} className="text-green-400" />}
              value={movie.audioLanguage}
              label="Audio"
            />
          )}
          <MetaCard
            icon={<Star size={16} className="text-yellow-400 fill-yellow-400" />}
            value={`${movie.rating}/10`}
            label="Rating"
          />
        </div>

        {/* Rating, Views, Verified Row */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold">{movie.rating}</span>
          </div>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1.5">
            <Eye size={14} className="text-gray-400" />
            <span className="text-gray-300">{movie.views || '0'} Views</span>
          </div>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-green-400 font-semibold">Verified</span>
          </div>
        </div>

        {/* Tabs */}
        {isSeries && (
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'episodes' ? 'text-white' : 'text-gray-500'
              }`}
            >
              EPISODES
              {activeTab === 'episodes' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'info' ? 'text-white' : 'text-gray-500'
              }`}
            >
              ABOUT
              {activeTab === 'info' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
          </div>
        )}

        {/* Episodes Tab */}
        {activeTab === 'episodes' && isSeries && (
          <div>
            {/* Season Selector */}
            {seasonNumbers.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                {seasonNumbers.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      s === selectedSeason
                        ? 'bg-gold text-black'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}

            {/* Episode List */}
            <div className="space-y-3">
              {currentSeasonEpisodes.map(ep => {
                const isLocked = ep.isComingSoon;
                return (
                  <div
                    key={ep.id}
                    className={`rounded-2xl overflow-hidden border border-white/10 ${
                      isLocked ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Episode Thumbnail */}
                    <div className="relative aspect-video bg-gray-900">
                      <img
                        src={ep.thumbnail || movie.thumbnail}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="text-white mx-auto mb-2" size={24} />
                            <p className="text-white text-xs">Coming Soon</p>
                            {ep.releaseDate && (
                              <p className="text-gray-400 text-[10px] mt-1">{ep.releaseDate}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Episode Info */}
                    <div className="p-4 bg-white/5 backdrop-blur-xl">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-sm mb-1 truncate">
                            Episode {ep.number}: {ep.title}
                          </h3>
                          {!isLocked && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                              {ep.duration && (
                                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5">
                                  <Clock size={9} className="text-blue-400" />
                                  <span className="font-mono font-semibold">{ep.duration}</span>
                                </div>
                              )}
                              {ep.fileSize && <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">{ep.fileSize}</span>}
                              {ep.quality && <span className="bg-blue-500/10 px-2 py-0.5 rounded text-blue-400 border border-blue-500/20">{ep.quality}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLocked && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleWatch(ep.telegramCode)}
                            className="flex-1 bg-white text-black font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                          >
                            <Play size={16} fill="black" />
                            <span className="text-sm">WATCH</span>
                          </button>
                          {ep.downloadCode && (
                            <button
                              onClick={() => handleDownload(ep.downloadCode)}
                              className="bg-white/10 backdrop-blur-xl text-white font-bold p-2.5 rounded-xl border border-white/20 active:scale-95 transition-transform"
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Description */}
            {movie.description && (
              <div>
                <p className="text-gray-300 text-sm leading-relaxed">{movie.description}</p>
              </div>
            )}

            {/* About Grid - Clean & Simple */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Rating</div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">{movie.rating}/10</span>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Genre</div>
                <div className="text-white font-bold text-sm">{movie.category}</div>
              </div>

              {movie.videoQuality && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Quality</div>
                  <div className="text-white font-bold text-sm">{movie.videoQuality}</div>
                </div>
              )}

              {movie.year && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Year</div>
                  <div className="text-white font-bold text-sm">{movie.year}</div>
                </div>
              )}

              {movie.duration && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Duration</div>
                  <div className="text-white font-bold text-sm">{movie.duration}</div>
                </div>
              )}

              {movie.fileSize && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">File Size</div>
                  <div className="text-white font-bold text-sm">{movie.fileSize}</div>
                </div>
              )}

              {movie.audioLanguage && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 col-span-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Audio</div>
                  <div className="text-white font-bold text-sm">{movie.audioLanguage}</div>
                </div>
              )}

              {movie.subtitles && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 col-span-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Subtitles</div>
                  <div className="text-white font-bold text-sm">{movie.subtitles}</div>
                </div>
              )}
            </div>

            {/* Screenshots Gallery */}
            {movie.screenshots && movie.screenshots.length > 0 && (
              <div>
                <h3 className="text-white font-bold mb-3">Screenshots</h3>
                <div className="grid grid-cols-2 gap-2">
                  {movie.screenshots.map((screenshot, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setViewerIndex(idx);
                        setViewerOpen(true);
                      }}
                      className="aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-gold transition-all"
                    >
                      <img
                        src={screenshot}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join Channel Button */}
            <button
              onClick={() => window.open(channelLink, '_blank')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Send size={18} />
              <span>Join Telegram Channel</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Single Movie Watch/Download */}
        {!isSeries && (
          <div className="space-y-4 mt-6">
            <div className="flex gap-3">
              <button
                onClick={() => handleWatch(movie.telegramCode)}
                className="flex-1 bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl"
              >
                <Play size={20} fill="black" />
                <span>WATCH NOW</span>
              </button>
              {movie.downloadCode && (
                <button
                  onClick={() => handleDownload(movie.downloadCode)}
                  className="bg-white/10 backdrop-blur-xl text-white font-bold p-4 rounded-2xl border border-white/20 active:scale-95 transition-transform"
                >
                  <Download size={20} />
                </button>
              )}
            </div>

            {/* Join Channel */}
            <button
              onClick={() => window.open(channelLink, '_blank')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <Send size={18} />
              <span>Join Telegram Channel</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Screenshot Viewer */}
      <AnimatePresence>
        {viewerOpen && movie.screenshots && (
          <ScreenshotViewer
            screenshots={movie.screenshots}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MovieDetails;
