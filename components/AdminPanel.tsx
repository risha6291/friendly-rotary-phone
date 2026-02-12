import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, LogOut, Trash2, Edit, Plus, Save, 
  Film, Award, Layout, Image as ImageIcon, Settings as SettingsIcon,
  Star, List, TrendingUp, Bell
} from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, 
  query, orderBy, setDoc, getDoc, writeBatch, limit
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Movie, Episode, AppSettings, StoryItem, BannerItem, SeasonInfo } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('content');
  const [user, setUser] = useState<User | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Lists
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);

  // Upload Form
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('Exclusive');
  const [year, setYear] = useState('2024');
  const [rating, setRating] = useState('9.0');
  const [views, setViews] = useState(''); // ✅ Custom views
  const [description, setDescription] = useState('');
  const [movieCode, setMovieCode] = useState('');
  const [movieDownloadCode, setMovieDownloadCode] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  // ✅ NEW: Premium Image Features
  const [detailBanner, setDetailBanner] = useState(''); // Separate detail page banner
  const [screenshots, setScreenshots] = useState<string[]>([]); // Array of screenshot URLs
  const [screenshotInput, setScreenshotInput] = useState(''); // Input for adding screenshots
  
  // ✅ Detailed Metadata Fields
  const [fileSize, setFileSize] = useState(''); // e.g., "2.5GB"
  const [duration, setDuration] = useState(''); // e.g., "2h 15m"
  const [audioLanguage, setAudioLanguage] = useState(''); // e.g., "Hindi Dual Audio + English DD+5.1"
  const [subtitles, setSubtitles] = useState(''); // e.g., "English, Hindi, Arabic"
  const [videoQuality, setVideoQuality] = useState(''); // e.g., "4K HDR"
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');

  // Episode Form
  const [epTitle, setEpTitle] = useState('');
  const [epSeason, setEpSeason] = useState('1');
  const [epNumber, setEpNumber] = useState('1');
  const [epCode, setEpCode] = useState('');
  const [epDownloadCode, setEpDownloadCode] = useState('');
  
  // ✅ Episode Premium Features
  const [epThumbnail, setEpThumbnail] = useState(''); // Episode specific thumbnail
  const [epIsComingSoon, setEpIsComingSoon] = useState(false); // Coming soon lock
  
  // ✅ Episode Metadata
  const [epFileSize, setEpFileSize] = useState('');
  const [epAudioLanguage, setEpAudioLanguage] = useState('');
  const [epSubtitles, setEpSubtitles] = useState('');
  const [epQuality, setEpQuality] = useState('');
  const [epIsUpcoming, setEpIsUpcoming] = useState(false);
  const [epReleaseDate, setEpReleaseDate] = useState('');

  // ✅ Episode inline editing
  const [editingEpId, setEditingEpId] = useState<string | null>(null);
  const [editEpTitle, setEditEpTitle] = useState('');
  const [editEpCode, setEditEpCode] = useState('');
  const [editEpDownloadCode, setEditEpDownloadCode] = useState('');

  // ✅ Season Lock Management
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [seasonLockInput, setSeasonLockInput] = useState(''); // season number input
  const [seasonLockReleaseDate, setSeasonLockReleaseDate] = useState('');
  const [seasonLockTitle, setSeasonLockTitle] = useState('');

  // ✅ Content search
  const [searchQuery, setSearchQuery] = useState('');

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Settings
  const [botUsername, setBotUsername] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [noticeChannelLink, setNoticeChannelLink] = useState(''); // ✅ Notice REQ আলাদা channel
  const [noticeText, setNoticeText] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(true);
  const [categories, setCategories] = useState<string[]>(['Exclusive', 'Korean Drama', 'Series']);

  // Top 10 State
  const [top10Movies, setTop10Movies] = useState<Movie[]>([]);
  
  // Story Badge State (for adding badge when adding story)
  const [storyBadgeInput, setStoryBadgeInput] = useState('');
  const [editingStoryBadge, setEditingStoryBadge] = useState<string | null>(null);
  const [editingStoryBadgeValue, setEditingStoryBadgeValue] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ========== FETCH DATA ==========
  const fetchMovies = async () => {
    try {
      // ✅ createdAt ছাড়া docs-ও আনার জন্য orderBy বাদ দিয়ে সব fetch
      const snapshot = await getDocs(collection(db, "movies"));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Movie[];
      // Sort locally: createdAt আছে সেগুলো আগে, না থাকলে শেষে
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setMovieList(list);
      
      // Filter Top 10
      const top10 = list.filter(m => m.isTop10).sort((a, b) => 
        (a.top10Position || 10) - (b.top10Position || 10)
      );
      setTop10Movies(top10);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchBanners = async () => {
    try {
      const q = query(collection(db, "banners"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BannerItem[]);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchStories = async () => {
    try {
      const q = query(collection(db, "stories"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoryItem[]);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotUsername(data.botUsername || '');
        setChannelLink(data.channelLink || '');
        setNoticeChannelLink(data.noticeChannelLink || '');
        setNoticeText(data.noticeText || '');
        setNoticeEnabled(data.noticeEnabled !== false);
        setCategories(data.categories || ['Exclusive', 'Korean Drama', 'Series']);
      }
    } catch (e) {
      console.error("Error:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMovies();
      if (activeTab === 'banners') fetchBanners();
      if (activeTab === 'stories') fetchStories();
      if (activeTab === 'settings') fetchSettings();
    }
  }, [user, activeTab]);

  // ========== LOGIN ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showSuccess('✅ Login Successful!');
    } catch (err: any) {
      alert('❌ Invalid credentials');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  // ========== CONTENT MANAGEMENT ==========
  const addEpisode = () => {
    if (!epTitle || (!epCode && !epIsUpcoming)) {
      alert('⚠️ Episode Title and Watch Code required (unless upcoming)!');
      return;
    }

    const newEp: Episode = {
      id: `ep_${Date.now()}`,
      season: parseInt(epSeason) || 1,
      number: parseInt(epNumber) || 1,
      title: epTitle,
      duration: '45m',
      telegramCode: epCode || 'TBA',
      ...(epDownloadCode && { downloadCode: epDownloadCode }),
      
      // ✅ Premium Features
      ...(epThumbnail && { thumbnail: epThumbnail }),
      ...(epIsComingSoon && { isComingSoon: epIsComingSoon }),
      
      // ✅ Metadata
      ...(epFileSize && { fileSize: epFileSize }),
      ...(epAudioLanguage && { audioLanguage: epAudioLanguage }),
      ...(epSubtitles && { subtitles: epSubtitles }),
      ...(epQuality && { quality: epQuality }),
      ...(epIsUpcoming && { isUpcoming: epIsUpcoming }),
      ...(epReleaseDate && { releaseDate: epReleaseDate }),
    };

    setEpisodes([...episodes, newEp]);
    setEpTitle('');
    setEpNumber(String(parseInt(epNumber) + 1));
    setEpCode('');
    setEpDownloadCode('');
    setEpThumbnail('');
    setEpIsComingSoon(false);
    setEpFileSize('');
    setEpAudioLanguage('');
    setEpSubtitles('');
    setEpQuality('');
    setEpIsUpcoming(false);
    setEpReleaseDate('');
    showSuccess(`✅ Episode ${newEp.number} added!`);
  };

  const handlePublish = async () => {
    if (!title || !thumbnail) {
      alert('⚠️ Title and Thumbnail required!');
      return;
    }

    if (contentType === 'movie' && !movieCode) {
      alert('⚠️ Movie Code required!');
      return;
    }

    if (contentType === 'series' && episodes.length === 0) {
      alert('⚠️ Add at least one episode!');
      return;
    }

    setLoading(true);
    try {
      const movieData: any = {
        title,
        thumbnail,
        category,
        rating: parseFloat(rating) || 9.0,
        views: views || '0',  // ✅ custom views, default 0
        year,
        description,
        isExclusive: isExclusive, // ✅ Exclusive badge flag
        createdAt: serverTimestamp(),
        
        // ✅ Premium Image Features (optional)
        ...(detailBanner && { detailBanner }),
        ...(screenshots.length > 0 && { screenshots }),
        
        // ✅ Metadata fields (optional)
        ...(fileSize && { fileSize }),
        ...(duration && { duration }),
        ...(audioLanguage && { audioLanguage }),
        ...(subtitles && { subtitles }),
        ...(videoQuality && { videoQuality }),
        ...(isUpcoming && { isUpcoming }),
        ...(releaseDate && { releaseDate }),
      };

      if (contentType === 'movie') {
        movieData.telegramCode = movieCode;
        if (movieDownloadCode) movieData.downloadCode = movieDownloadCode; // ✅ আলাদা download code
      } else {
        movieData.episodes = episodes.sort((a, b) => {
          if (a.season !== b.season) return a.season - b.season;
          return a.number - b.number;
        });
        // ✅ Include season lock info
        if (seasons.length > 0) {
          movieData.seasons = seasons;
        }
      }

      if (isEditing && editId) {
        await updateDoc(doc(db, 'movies', editId), movieData);
        showSuccess('✅ Updated!');
      } else {
        await addDoc(collection(db, 'movies'), movieData);
        showSuccess('✅ Published!');
      }

      resetForm();
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleEdit = (movie: Movie) => {
    setTitle(movie.title);
    setThumbnail(movie.thumbnail);
    setCategory(movie.category);
    setYear(movie.year || '2024');
    setRating(movie.rating?.toString() || '9.0');
    setViews(movie.views || '');  // ✅ custom views
    setDescription(movie.description || '');
    
    // ✅ Load Premium Image Fields
    setDetailBanner(movie.detailBanner || '');
    setScreenshots(movie.screenshots || []);
    
    // ✅ Load Metadata
    setFileSize(movie.fileSize || '');
    setDuration(movie.duration || '');
    setAudioLanguage(movie.audioLanguage || '');
    setSubtitles(movie.subtitles || '');
    setVideoQuality(movie.videoQuality || '');
    setIsUpcoming(movie.isUpcoming || false);
    setReleaseDate(movie.releaseDate || '');

    if (movie.episodes && movie.episodes.length > 0) {
      setContentType('series');
      setEpisodes(movie.episodes);
      setMovieCode('');
      setMovieDownloadCode('');
    } else {
      setContentType('movie');
      setMovieCode(movie.telegramCode || '');
      setMovieDownloadCode(movie.downloadCode || '');
      setEpisodes([]);
    }
    setIsExclusive(movie.isExclusive || false);
    setEditingEpId(null); // ✅ reset episode edit
    setSeasons(movie.seasons || []); // ✅ load season locks
    setIsEditing(true);
    setEditId(movie.id);
    setActiveTab('upload');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই content টি delete করবেন?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'movies', id));
      showSuccess('✅ Deleted!');
      fetchMovies();
    } catch (err: any) {
      console.error('Delete error:', err);
      const code = err?.code || '';
      let msg = '❌ Delete failed!\n\n';
      if (code === 'permission-denied') {
        msg += '🔒 PERMISSION DENIED!\n\nFirestore Rules block করছে।\nSettings → "Firestore Fix" দেখুন।';
      } else if (code === 'unauthenticated') {
        msg += '🔑 Login করা নেই বা session expired।\nAdmin প্যানেল বন্ধ করে আবার login করুন।';
      } else {
        msg += `Error: ${err.message}`;
      }
      alert(msg);
    }
    setLoading(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm(`⚠️ সব ${movieList.length}টি content DELETE করবেন?\n\nএটি undone করা যাবে না!`)) return;
    if (!confirm('আবার confirm করুন — সব content সত্যিই delete হবে?')) return;
    
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const movie of movieList) {
      try {
        await deleteDoc(doc(db, 'movies', movie.id));
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error('Bulk delete error for', movie.id, err);
      }
    }
    
    if (failCount > 0) {
      alert(`⚠️ ${successCount} deleted, ${failCount} failed.\n\nPermission error হলে Settings → Firestore Fix দেখুন।`);
    } else {
      showSuccess(`✅ সব ${successCount}টি content deleted!`);
    }
    fetchMovies();
    setLoading(false);
  };

  const testFirestoreConnection = async () => {
    setLoading(true);
    try {
      // Try to read
      const testQ = query(collection(db, 'movies'), limit(1));
      const snap = await getDocs(testQ);
      
      // Try to write a test doc
      const testRef = await addDoc(collection(db, '_test_'), { t: Date.now() });
      await deleteDoc(testRef);
      
      alert(`✅ Firestore সংযোগ ঠিক আছে!\n\n📊 Movies found: ${movieList.length}\n✍️ Write permission: OK\n🗑️ Delete permission: OK`);
    } catch (err: any) {
      const code = err?.code || '';
      let msg = '❌ Firestore Problem!\n\n';
      if (code === 'permission-denied') {
        msg += '🔒 Rules blocked করছে!\n\nFirebase Console → Firestore → Rules এ যান এবং নিচের rules দিন:\n\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}';
      } else {
        msg += err.message;
      }
      alert(msg);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setThumbnail('');
    setCategory('Exclusive');
    setYear('2024');
    setRating('9.0');
    setViews('');
    setDescription('');
    setMovieCode('');
    setMovieDownloadCode('');
    setIsExclusive(false);
    setEpisodes([]);
    setContentType('movie');
    setIsEditing(false);
    setEditId(null);
    setEditingEpId(null);
    
    // ✅ Reset premium image fields
    setDetailBanner('');
    setScreenshots([]);
    setScreenshotInput('');
    
    // ✅ Reset metadata fields
    setFileSize('');
    setDuration('');
    setAudioLanguage('');
    setSubtitles('');
    setVideoQuality('');
    setIsUpcoming(false);
    setReleaseDate('');
    
    // ✅ Reset season locks
    setSeasons([]);
    setSeasonLockInput('');
    setSeasonLockReleaseDate('');
    setSeasonLockTitle('');
  };

  // ========== TOP 10 MANAGEMENT ==========
  const toggleTop10 = async (movieId: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        // Add to Top 10
        const nextPosition = top10Movies.length + 1;
        if (nextPosition > 10) {
          alert('⚠️ Top 10 is full! Remove one first.');
          return;
        }
        await updateDoc(doc(db, 'movies', movieId), {
          isTop10: true,
          top10Position: nextPosition
        });
        showSuccess('✅ Added to Top 10!');
      } else {
        // Remove from Top 10
        await updateDoc(doc(db, 'movies', movieId), {
          isTop10: false,
          top10Position: null
        });
        showSuccess('✅ Removed from Top 10!');
      }
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  const updateTop10Position = async (movieId: string, newPosition: number) => {
    if (newPosition < 1 || newPosition > 10) {
      alert('⚠️ Position must be 1-10!');
      return;
    }

    try {
      await updateDoc(doc(db, 'movies', movieId), {
        top10Position: newPosition
      });
      showSuccess('✅ Position updated!');
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ========== BANNER MANAGEMENT ==========
  const handleAddBanner = async (movieId: string) => {
    const movie = movieList.find(m => m.id === movieId);
    if (!movie) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'banners'), {
        title: movie.title,
        image: movie.thumbnail,
        movieId: movie.id,
        order: banners.length + 1,
        isActive: true,
        createdAt: serverTimestamp()
      });
      showSuccess('✅ Banner added!');
      fetchBanners();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      showSuccess('✅ Deleted!');
      fetchBanners();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ========== STORY MANAGEMENT ==========
  const handleAddStory = async (movieId: string, badge?: string) => {
    const movie = movieList.find(m => m.id === movieId);
    if (!movie) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'stories'), {
        image: movie.thumbnail,
        movieId: movie.id,
        order: stories.length + 1,
        createdAt: serverTimestamp(),
        ...(badge && badge.trim() !== '' && { storyBadge: badge.trim() })
      });
      showSuccess('✅ Story added!');
      setStoryBadgeInput('');
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdateStoryBadge = async (storyId: string, badge: string) => {
    try {
      await updateDoc(doc(db, 'stories', storyId), { storyBadge: badge });
      showSuccess('✅ Badge updated!');
      setEditingStoryBadge(null);
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Delete story?')) return;
    try {
      await deleteDoc(doc(db, 'stories', id));
      showSuccess('✅ Deleted!');
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ========== SETTINGS ==========
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        botUsername,
        channelLink,
        noticeChannelLink,
        noticeText,
        noticeEnabled,
        categories
      });
      showSuccess('✅ Settings saved!');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  // ========== LOGIN UI ==========
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🔐 Admin Login</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========== MAIN ADMIN UI ==========
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🎬 CINEFLIX Admin</h1>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-gray-400 hover:text-white flex items-center gap-2">
              <LogOut size={18} />
              Logout
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 flex gap-2 overflow-x-auto">
        {[
          { id: 'upload', icon: Upload, label: 'Upload' },
          { id: 'content', icon: Film, label: 'Content' },
          { id: 'top10', icon: Award, label: 'Top 10' },
          { id: 'banners', icon: Layout, label: 'Banners' },
          { id: 'stories', icon: ImageIcon, label: 'Stories' },
          { id: 'settings', icon: SettingsIcon, label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? '✏️ Edit Content' : '➕ Upload New Content'}
              </h2>

              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setContentType('movie'); setEpisodes([]); }}
                  className={`p-6 rounded-xl border-2 transition ${
                    contentType === 'movie'
                      ? 'border-red-600 bg-red-600/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <Film className="mx-auto mb-2" size={32} />
                  <div className="font-bold text-white">Single Movie</div>
                </button>
                <button
                  onClick={() => { setContentType('series'); setMovieCode(''); }}
                  className={`p-6 rounded-xl border-2 transition ${
                    contentType === 'series'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <List className="mx-auto mb-2" size={32} />
                  <div className="font-bold text-white">Series</div>
                </button>
              </div>

              {/* Form */}
              <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title *"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="Thumbnail URL * (Poster: 2:3 ratio, e.g. 400×600)"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
                {thumbnail && (
                  <img src={thumbnail} alt="Preview" className="h-32 rounded-lg object-cover" />
                )}

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year (2024)"
                    className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="Rating (9.0)"
                    className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                {/* ✅ Views field */}
                <input
                  type="text"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  placeholder="👁️ Views (যেমন: 1.2M, 500K, 25K) — খালি রাখলে 0"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />

                {/* ✅ Exclusive Badge Toggle */}
                <div
                  onClick={() => setIsExclusive(!isExclusive)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isExclusive
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 bg-gray-900'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white text-sm">⭐ EXCLUSIVE Badge</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      চালু করলে thumbnail এ EXCL badge দেখাবে। Category পরিবর্তন হবে না।
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${isExclusive ? 'bg-yellow-500' : 'bg-gray-700'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isExclusive ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />

                {/* ✅ PREMIUM IMAGE FEATURES (OPTIONAL) */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
                    <ImageIcon size={16} />
                    <span>🎨 Premium Images (Optional)</span>
                  </div>
                  
                  <input
                    type="text"
                    value={detailBanner}
                    onChange={(e) => setDetailBanner(e.target.value)}
                    placeholder="Detail Banner URL — 16:9 ratio (1920×1080 or 1280×720) recommended"
                    className="w-full px-4 py-2 bg-gray-900/80 border border-purple-500/20 rounded-lg text-white text-sm"
                  />
                  {detailBanner && (
                    <img src={detailBanner} alt="Detail Banner Preview" className="h-24 w-full rounded-lg object-cover" />
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={screenshotInput}
                        onChange={(e) => setScreenshotInput(e.target.value)}
                        placeholder="Screenshot URL — 16:9 ratio (1280×720) recommended"
                        className="flex-1 px-4 py-2 bg-gray-900/80 border border-purple-500/20 rounded-lg text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (screenshotInput && screenshots.length < 8) {
                            setScreenshots([...screenshots, screenshotInput]);
                            setScreenshotInput('');
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {screenshots.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {screenshots.map((ss, idx) => (
                          <div key={idx} className="relative group">
                            <img src={ss} alt={`Screenshot ${idx + 1}`} className="h-16 w-full object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setScreenshots(screenshots.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ ENHANCED METADATA (OPTIONAL) */}
                <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-sm mb-2">
                    <SettingsIcon size={16} />
                    <span>📊 Enhanced Metadata (Optional)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      placeholder="File Size (e.g., 2.5GB)"
                      className="px-4 py-2 bg-gray-900/80 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration (e.g., 2h 15m)"
                      className="px-4 py-2 bg-gray-900/80 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={audioLanguage}
                    onChange={(e) => setAudioLanguage(e.target.value)}
                    placeholder="Audio (e.g., Hindi Dual Audio + English DD+5.1)"
                    className="w-full px-4 py-2 bg-gray-900/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                  
                  <input
                    type="text"
                    value={subtitles}
                    onChange={(e) => setSubtitles(e.target.value)}
                    placeholder="Subtitles (e.g., English, Hindi, Arabic)"
                    className="w-full px-4 py-2 bg-gray-900/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                  
                  <input
                    type="text"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                    placeholder="Video Quality (e.g., 4K HDR, 1080p BluRay)"
                    className="w-full px-4 py-2 bg-gray-900/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                </div>

                {contentType === 'movie' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={movieCode}
                      onChange={(e) => setMovieCode(e.target.value)}
                      placeholder="🎬 Watch/Stream Code (Telegram Video ID) *"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={movieDownloadCode}
                        onChange={(e) => setMovieDownloadCode(e.target.value)}
                        placeholder="⬇️ Download Code (আলাদা রাখতে চাইলে দিন, না দিলে Watch Code ব্যবহার হবে)"
                        className="w-full px-4 py-3 bg-gray-900 border border-green-700/50 rounded-lg text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 font-bold">Optional</span>
                    </div>
                    <p className="text-xs text-gray-500 px-1">
                      💡 Watch Code = Bot এ stream হবে। Download Code = আলাদা file/bot থেকে download হবে।
                    </p>
                  </div>
                )}

                {contentType === 'series' && (
                  <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                    <div className="font-bold text-white mb-2">Add Episodes</div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        value={epSeason}
                        onChange={(e) => setEpSeason(e.target.value)}
                        placeholder="Season"
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      />
                      <input
                        type="number"
                        value={epNumber}
                        onChange={(e) => setEpNumber(e.target.value)}
                        placeholder="Ep #"
                        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      />
                      <input
                        type="text"
                        value={epTitle}
                        onChange={(e) => setEpTitle(e.target.value)}
                        placeholder="Title"
                        className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={epCode}
                      onChange={(e) => setEpCode(e.target.value)}
                      placeholder="🎬 Watch Code (Telegram Video ID) *"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    />
                    <input
                      type="text"
                      value={epDownloadCode}
                      onChange={(e) => setEpDownloadCode(e.target.value)}
                      placeholder="⬇️ Download Code (আলাদা থাকলে দিন - Optional)"
                      className="w-full px-3 py-2 bg-gray-800 border border-green-700/40 rounded text-white text-sm"
                    />
                    
                    {/* ✅ Episode Premium Features */}
                    <div className="border-t border-gray-700 pt-3 mt-2 space-y-2">
                      <div className="text-xs text-purple-300 font-semibold">🎨 Premium (Optional)</div>
                      
                      <input
                        type="text"
                        value={epThumbnail}
                        onChange={(e) => setEpThumbnail(e.target.value)}
                        placeholder="Episode Thumbnail — 16:9 ratio (1280×720) recommended"
                        className="w-full px-3 py-2 bg-gray-800 border border-purple-500/30 rounded text-white text-sm"
                      />
                      {epThumbnail && (
                        <img src={epThumbnail} alt="Episode Preview" className="h-16 w-28 object-cover rounded" />
                      )}
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="epComingSoon"
                          checked={epIsComingSoon}
                          onChange={(e) => setEpIsComingSoon(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="epComingSoon" className="text-xs text-yellow-300 cursor-pointer">
                          🔒 Coming Soon (Lock করতে চাইলে)
                        </label>
                      </div>
                      
                      {epIsComingSoon && (
                        <input
                          type="text"
                          value={epReleaseDate}
                          onChange={(e) => setEpReleaseDate(e.target.value)}
                          placeholder="Release Date (e.g., Feb 20, 2026)"
                          className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-white text-sm"
                        />
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={epFileSize}
                          onChange={(e) => setEpFileSize(e.target.value)}
                          placeholder="Size (450MB)"
                          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                        />
                        <input
                          type="text"
                          value={epQuality}
                          onChange={(e) => setEpQuality(e.target.value)}
                          placeholder="Quality (1080p)"
                          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={addEpisode}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                    >
                      <Plus size={18} className="inline mr-2" />
                      Add Episode
                    </button>

                    {/* ✅ NEW: Season Lock Management */}
                    <div className="border-t border-gray-700 pt-4 mt-2">
                      <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm mb-3">
                        <span>🔒</span>
                        <span>Season Lock / Coming Soon</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        পুরো সিজন lock করতে পারবেন — Coming Soon দেখাবে, ভিতরে এপিসোড দেখাবে না।
                      </p>
                      
                      {/* Add season lock form */}
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={seasonLockInput}
                            onChange={(e) => setSeasonLockInput(e.target.value)}
                            placeholder="Season #"
                            min="1"
                            className="px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-white text-sm"
                          />
                          <input
                            type="text"
                            value={seasonLockTitle}
                            onChange={(e) => setSeasonLockTitle(e.target.value)}
                            placeholder="Title (e.g. Part 2)"
                            className="col-span-2 px-3 py-2 bg-gray-800 border border-yellow-500/30 rounded text-white text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={seasonLockReleaseDate}
                          onChange={(e) => setSeasonLockReleaseDate(e.target.value)}
                          placeholder="Release Date (e.g. March 2026) - Optional"
                          className="w-full px-3 py-2 bg-gray-800 border border-yellow-500/20 rounded text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseInt(seasonLockInput);
                            if (!num || num < 1) { alert('Season number দিন!'); return; }
                            const exists = seasons.find(s => s.season === num);
                            if (exists) { alert('এই season ইতিমধ্যে আছে!'); return; }
                            setSeasons([...seasons, {
                              season: num,
                              isLocked: true,
                              isComingSoon: true,
                              ...(seasonLockReleaseDate && { releaseDate: seasonLockReleaseDate }),
                              ...(seasonLockTitle && { title: seasonLockTitle }),
                            }]);
                            setSeasonLockInput('');
                            setSeasonLockReleaseDate('');
                            setSeasonLockTitle('');
                          }}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded text-sm"
                        >
                          + Lock Season
                        </button>
                      </div>
                      
                      {/* Locked seasons list */}
                      {seasons.length > 0 && (
                        <div className="space-y-1.5">
                          {seasons.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                              <div>
                                <span className="text-yellow-300 text-xs font-bold">
                                  🔒 {s.title || `Season ${s.season}`}
                                </span>
                                {s.releaseDate && (
                                  <span className="text-gray-400 text-[10px] ml-2">• {s.releaseDate}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setSeasons(seasons.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {episodes.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm text-gray-400">Episodes ({episodes.length})</div>
                        {episodes.map(ep => (
                          <div key={ep.id} className="bg-gray-800 rounded p-2 flex items-center gap-2 text-sm">
                            {ep.thumbnail && (
                              <img src={ep.thumbnail} alt="" className="w-12 h-8 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white truncate">S{ep.season}E{ep.number}: {ep.title}</span>
                                {ep.downloadCode && (
                                  <span className="text-xs text-green-400 shrink-0">⬇</span>
                                )}
                                {ep.isComingSoon && (
                                  <span className="text-xs text-yellow-400 shrink-0">🔒</span>
                                )}
                              </div>
                              {(ep.fileSize || ep.quality) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {ep.fileSize && <span>{ep.fileSize}</span>}
                                  {ep.fileSize && ep.quality && <span> • </span>}
                                  {ep.quality && <span>{ep.quality}</span>}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setEpisodes(episodes.filter(e => e.id !== ep.id))}
                              className="text-red-500 hover:text-red-400 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Save size={20} className="inline mr-2" />
                  {loading ? 'Processing...' : isEditing ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === 'content' && (() => {
            const filteredList = searchQuery.trim()
              ? movieList.filter(m =>
                  m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : movieList;

            return (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-white">📚 All Content ({movieList.length})</h2>
                {movieList.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 border border-red-600 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete All ({movieList.length})
                  </button>
                )}
              </div>

              {/* ✅ Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 সিরিজ বা মুভির নাম লিখুন..."
                  className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-red-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
                  >×</button>
                )}
              </div>

              {filteredList.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">কোনো content পাওয়া যায়নি</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.map(movie => (
                  <div key={movie.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex gap-4">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-20 h-30 object-cover rounded shrink-0"
                        style={{height: '120px'}}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold mb-1 truncate">{movie.title}</h3>
                        <div className="flex flex-wrap gap-1 text-xs mb-2">
                          <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-300">{movie.category}</span>
                          <span className="px-2 py-0.5 bg-yellow-600 rounded text-white">⭐ {movie.rating}</span>
                          {movie.episodes && <span className="px-2 py-0.5 bg-blue-600 rounded text-white">{movie.episodes.length} Eps</span>}
                          {movie.isTop10 && <span className="px-2 py-0.5 bg-red-600 rounded text-white">Top10</span>}
                          {movie.downloadCode && <span className="px-2 py-0.5 bg-green-700 rounded text-white">⬇DL</span>}
                          {movie.views && <span className="px-2 py-0.5 bg-gray-600 rounded text-gray-300">👁 {movie.views}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                          >
                            <Edit size={12} className="inline mr-1" />Edit
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                          >
                            <Trash2 size={12} className="inline mr-1" />Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ✅ Episode inline edit - সিরিজ হলে এপিসোড দেখাবে */}
                    {movie.episodes && movie.episodes.length > 0 && (
                      <div className="mt-3 border-t border-gray-700 pt-3">
                        <div className="text-xs text-gray-400 mb-2 font-bold">📋 Episodes (ক্লিক করে edit করুন)</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {movie.episodes.map(ep => (
                            <div key={ep.id}>
                              {editingEpId === ep.id ? (
                                // ✅ Edit mode
                                <div className="bg-gray-900 rounded p-2 space-y-2">
                                  <div className="text-xs text-yellow-400 font-bold">S{ep.season}E{ep.number}: Edit করছেন</div>
                                  <input
                                    type="text"
                                    value={editEpTitle}
                                    onChange={e => setEditEpTitle(e.target.value)}
                                    placeholder="Episode Title"
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editEpCode}
                                    onChange={e => setEditEpCode(e.target.value)}
                                    placeholder="🎬 Watch Code"
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editEpDownloadCode}
                                    onChange={e => setEditEpDownloadCode(e.target.value)}
                                    placeholder="⬇️ Download Code (Optional)"
                                    className="w-full px-2 py-1.5 bg-gray-800 border border-green-700/40 rounded text-white text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        // Save episode edit
                                        const updatedEps = movie.episodes!.map(e =>
                                          e.id === ep.id
                                            ? { ...e, title: editEpTitle, telegramCode: editEpCode, ...(editEpDownloadCode ? { downloadCode: editEpDownloadCode } : { downloadCode: undefined }) }
                                            : e
                                        );
                                        try {
                                          await updateDoc(doc(db, 'movies', movie.id), { episodes: updatedEps });
                                          showSuccess('✅ Episode updated!');
                                          setEditingEpId(null);
                                          fetchMovies();
                                        } catch(e) { alert('❌ Error saving'); }
                                      }}
                                      className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-bold"
                                    >
                                      <Save size={12} className="inline mr-1" />Save
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Delete this episode?')) return;
                                        // Delete episode
                                        const updatedEps = movie.episodes!.filter(e => e.id !== ep.id);
                                        try {
                                          await updateDoc(doc(db, 'movies', movie.id), { episodes: updatedEps });
                                          showSuccess('✅ Episode deleted!');
                                          setEditingEpId(null);
                                          fetchMovies();
                                        } catch(e) { alert('❌ Error deleting'); }
                                      }}
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs font-bold"
                                      title="Delete Episode"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingEpId(null)}
                                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
                                    >Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                // Normal view
                                <div
                                  className="flex items-center justify-between bg-gray-900/60 rounded px-2 py-1.5 cursor-pointer hover:bg-gray-900 group"
                                  onClick={() => {
                                    setEditingEpId(ep.id);
                                    setEditEpTitle(ep.title);
                                    setEditEpCode(ep.telegramCode);
                                    setEditEpDownloadCode(ep.downloadCode || '');
                                  }}
                                >
                                  <span className="text-xs text-gray-300">
                                    S{ep.season}E{ep.number}: {ep.title}
                                    {ep.downloadCode && <span className="ml-1 text-green-400">⬇</span>}
                                  </span>
                                  <span className="text-[10px] text-gray-500 group-hover:text-yellow-400">✏️ Edit</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          {/* TOP 10 TAB */}
          {activeTab === 'top10' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">🏆 Top 10 Management</h2>

              {/* Current Top 10 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Top 10 ({top10Movies.length}/10)</h3>
                <div className="space-y-3">
                  {top10Movies.map(movie => (
                    <div key={movie.id} className="bg-gradient-to-r from-yellow-900/30 to-gray-800 rounded-lg p-4 border border-yellow-700/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          #{movie.top10Position}
                        </div>
                        <img src={movie.thumbnail} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{movie.title}</h4>
                          <p className="text-gray-400 text-sm">{movie.category} • {movie.year}</p>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              defaultValue={movie.top10Position}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) updateTop10Position(movie.id, val);
                              }}
                              className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                            />
                            <button
                              onClick={() => toggleTop10(movie.id, true)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to Top 10 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Add to Top 10</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {movieList.filter(m => !m.isTop10).map(movie => (
                    <div key={movie.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                      <img src={movie.thumbnail} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                        <p className="text-gray-400 text-xs">{movie.category}</p>
                      </div>
                      <button
                        onClick={() => toggleTop10(movie.id, false)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BANNERS TAB */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">🖼️ Banner Management</h2>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Banners ({banners.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map(banner => (
                    <div key={banner.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      <img src={banner.image} alt={banner.title} className="w-full h-40 object-cover" />
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{banner.title}</h4>
                          <p className="text-gray-400 text-sm">Order: #{banner.order}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded text-white"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Add Banner (Select from your content)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {movieList.map(movie => (
                    <div key={movie.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                      <img src={movie.thumbnail} alt={movie.title} className="w-20 h-28 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{movie.title}</h4>
                        <p className="text-gray-400 text-sm">{movie.category}</p>
                      </div>
                      <button
                        onClick={() => handleAddBanner(movie.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STORIES TAB */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">📸 Instagram Stories</h2>

              {/* Current Stories */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Stories ({stories.length})</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {stories.map(story => {
                    const storyMovie = movieList.find(m => m.id === story.movieId);
                    return (
                      <div key={story.id} className="flex-shrink-0 text-center relative w-24">
                        <div className="relative inline-block">
                          <img 
                            src={story.image} 
                            alt="Story" 
                            className="w-20 h-20 rounded-full object-cover border-4 border-pink-500"
                          />
                          {/* Show current badge */}
                          {(story as any).storyBadge && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full border border-yellow-700 whitespace-nowrap">
                              {(story as any).storyBadge}
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 z-10"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 truncate">{storyMovie?.title || 'Story'}</p>
                        
                        {/* Badge edit inline */}
                        {editingStoryBadge === story.id ? (
                          <div className="mt-1 flex flex-col gap-1">
                            <input
                              type="text"
                              value={editingStoryBadgeValue}
                              onChange={e => setEditingStoryBadgeValue(e.target.value)}
                              placeholder="#1 / NEW"
                              className="w-full px-1.5 py-1 bg-gray-800 border border-yellow-600 rounded text-white text-[9px]"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateStoryBadge(story.id, editingStoryBadgeValue)} className="flex-1 bg-yellow-500 text-black text-[9px] font-bold py-0.5 rounded">Save</button>
                              <button onClick={() => setEditingStoryBadge(null)} className="flex-1 bg-gray-700 text-white text-[9px] py-0.5 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingStoryBadge(story.id); setEditingStoryBadgeValue((story as any).storyBadge || ''); }}
                            className="mt-1 w-full text-[9px] bg-gray-800 border border-gray-600 text-yellow-400 py-0.5 rounded hover:bg-gray-700"
                          >
                            {(story as any).storyBadge ? '✏️ Badge' : '+ Badge'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Badge Preset Quick-Select Info */}
              <div className="bg-gray-800/60 border border-yellow-600/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm font-bold mb-2">🏷️ Badge Guide</p>
                <p className="text-gray-400 text-xs mb-3">Each story can have one badge shown below the ring. Available options:</p>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'HOT', '#1', '#2', '#3', '#4', '#5', 'TOP', 'LIVE'].map(b => (
                    <span key={b} className="bg-gray-700 border border-yellow-500/40 text-yellow-400 text-[10px] font-black px-2.5 py-1 rounded-full cursor-default">{b}</span>
                  ))}
                </div>
              </div>

              {/* Add Story Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Add Story (Select from content)</h3>
                
                {/* Badge input for new story */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">🏷️ Badge for new story (optional)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {['NEW', 'HOT', '#1', '#2', '#3', 'TOP', 'LIVE'].map(b => (
                      <button
                        key={b}
                        onClick={() => setStoryBadgeInput(b)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${storyBadgeInput === b ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-yellow-500'}`}
                      >
                        {b}
                      </button>
                    ))}
                    <button
                      onClick={() => setStoryBadgeInput('')}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700"
                    >
                      No Badge
                    </button>
                  </div>
                  <input
                    type="text"
                    value={storyBadgeInput}
                    onChange={e => setStoryBadgeInput(e.target.value)}
                    placeholder="Or type custom badge..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {movieList.map(movie => (
                    <div key={movie.id} className="bg-gray-800 rounded-lg p-3 text-center">
                      <img src={movie.thumbnail} alt={movie.title} className="w-full h-40 object-cover rounded mb-2" />
                      <h4 className="text-white text-sm font-medium truncate mb-2">{movie.title}</h4>
                      <button
                        onClick={() => handleAddStory(movie.id, storyBadgeInput)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-white text-sm font-medium"
                      >
                        {storyBadgeInput ? `Add + "${storyBadgeInput}"` : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">⚙️ App Settings</h2>
              
              <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">🤖 Bot Username</label>
                  <p className="text-xs text-gray-500 mb-2">Watch/Download এ যে bot ব্যবহার হবে (@ ছাড়া)</p>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="YourBot"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">📢 Telegram Channel Link</label>
                  <p className="text-xs text-gray-500 mb-2">Header এর Send আইকন এবং MovieDetails Telegram বাটনে এই link যাবে</p>
                  <input
                    type="text"
                    value={channelLink}
                    onChange={(e) => setChannelLink(e.target.value)}
                    placeholder="https://t.me/yourchannel"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">🔔 Notice REQ Channel Link</label>
                  <p className="text-xs text-gray-500 mb-2">Notice bar এর REQ বাটনে যাবে — খালি রাখলে উপরের Channel Link ব্যবহার হবে</p>
                  <input
                    type="text"
                    value={noticeChannelLink}
                    onChange={(e) => setNoticeChannelLink(e.target.value)}
                    placeholder="https://t.me/yourRequestChannel (Optional)"
                    className="w-full px-4 py-3 bg-gray-900 border border-green-700/40 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">📣 Notice Text (Marquee)</label>
                  <p className="text-xs text-gray-500 mb-2">হোম পেজে scroll হওয়া notice বার এ যে লেখা দেখাবে</p>
                  <input
                    type="text"
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="যেকোনো ঘোষণা লিখুন..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <input
                    type="checkbox"
                    checked={noticeEnabled}
                    onChange={(e) => setNoticeEnabled(e.target.checked)}
                    className="w-5 h-5 accent-yellow-500"
                  />
                  <div>
                    <label className="text-white font-medium">Notice Bar দেখানো হবে</label>
                    <p className="text-xs text-gray-500">বন্ধ করলে notice bar হোম পেজে দেখাবে না</p>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
                >
                  <Save size={18} className="inline mr-2" />
                  Save Settings
                </button>
              </div>

              {/* ===== FIRESTORE FIX SECTION ===== */}
              <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  🔧 Firestore Permission Fix
                </h3>
                <p className="text-gray-300 text-sm">
                  Delete বা Edit কাজ না করলে, Firestore Rules সমস্যা করছে। নিচের steps follow করুন:
                </p>

                {/* Test button */}
                <button
                  onClick={testFirestoreConnection}
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  {loading ? '⏳ Testing...' : '🔍 Connection & Permission Test করুন'}
                </button>

                {/* Step by step fix guide */}
                <div className="space-y-3 text-sm">
                  <p className="text-yellow-400 font-bold">📋 Firestore Rules Fix Steps:</p>
                  
                  <div className="bg-gray-900/80 rounded-lg p-3 space-y-2 text-gray-300 text-xs leading-relaxed">
                    <p><span className="text-white font-bold">Step 1:</span> যাও → <span className="text-blue-400">console.firebase.google.com</span></p>
                    <p><span className="text-white font-bold">Step 2:</span> তোমার project select করো: <span className="text-yellow-300">cineflix-universe</span></p>
                    <p><span className="text-white font-bold">Step 3:</span> Left menu → <span className="text-white">Firestore Database</span></p>
                    <p><span className="text-white font-bold">Step 4:</span> উপরে <span className="text-white">Rules</span> ট্যাবে ক্লিক করো</p>
                    <p><span className="text-white font-bold">Step 5:</span> নিচের code টা paste করো এবং <span className="text-green-400">Publish</span> করো:</p>
                  </div>

                  {/* Rules code */}
                  <div className="bg-black rounded-lg p-3 border border-green-700/40 relative">
                    <p className="text-[10px] text-green-400 font-mono font-bold mb-2">// Firebase Firestore Rules — এটা copy করো</p>
                    <pre className="text-green-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}</pre>
                  </div>

                  <div className="bg-orange-950/40 border border-orange-700/30 rounded-lg p-3 text-xs text-orange-300">
                    ⚠️ এই rules দিলে: যে কেউ read করতে পারবে, কিন্তু <strong>শুধু logged-in admin</strong> write/delete করতে পারবে।
                  </div>
                </div>

                {/* Auth check */}
                <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400 flex items-center justify-between">
                  <span>Currently logged in as:</span>
                  <span className="text-green-400 font-bold">{user?.email || 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
