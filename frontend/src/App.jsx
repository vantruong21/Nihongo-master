import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImportModal from './components/ImportModal';
import QuizEngine from './components/QuizEngine';
import QuizResults from './components/QuizResults';
import StatsPage from './components/StatsPage';
import AuthPage from './components/AuthPage';
import KanjiLookup from './components/KanjiLookup';
import { API_BASE_URL } from './config';

const LiquidBackground = () => (
  <div className="liquid-bg-container">
    <div className="liquid-blob blob-1"></div>
    <div className="liquid-blob blob-2"></div>
    <div className="liquid-blob blob-3"></div>
    <div className="liquid-blob blob-4"></div>
  </div>
);

function App() {
  // Auth state
  const [user, setUser] = useState(null); // { username, role }
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [view, setView] = useState('LIBRARY');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // Edit study set modal state
  const [editingSet, setEditingSet] = useState(null); // { id, title, description }
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  const [activeSet, setActiveSet] = useState(null);
  const [quizMode, setQuizMode] = useState('TYPING');
  const [currentResults, setCurrentResults] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      // Verify token is still valid
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error('Token expired');
      }).then(data => {
        setToken(savedToken);
        setUser({ username: data.username, role: data.role });
        setAuthLoading(false);
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Fetch study sets when authenticated
  useEffect(() => {
    if (user) fetchStudySets();
  }, [user]);

  const fetchStudySets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-sets`);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setStudySets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching study sets:', error);
      setStudySets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = ({ token: newToken, username, role }) => {
    setToken(newToken);
    setUser({ username, role });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('LIBRARY');
  };

  // Helper to get auth headers
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  const handleStartQuiz = async (set, mode) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-sets/${set.id}`, {
        headers: authHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch study set details');
      const detailedSet = await response.json();
      setActiveSet(detailedSet);
      setQuizMode(mode);
      setView('QUIZ');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to load study set cards. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-sets/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (response.ok) {
        fetchStudySets();
      } else {
        alert('Failed to delete study set: Server error.');
      }
    } catch (error) {
      console.error('Error deleting study set:', error);
      alert('Failed to delete study set: Network error.');
    }
  };

  const handleOpenEdit = (set) => {
    setEditingSet(set);
    setEditTitle(set.title);
    setEditDescription(set.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSet || !editTitle.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/study-sets/${editingSet.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (res.ok) {
        fetchStudySets();
        setEditingSet(null);
      } else {
        alert('Failed to update study set.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleQuizFinish = async (results, startTime) => {
    setCurrentResults(results);
    setSessionStartTime(startTime);
    setView('RESULTS');

    try {
      await fetch(`${API_BASE_URL}/api/quiz/session`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          studySet: { id: activeSet.id },
          mode: quizMode,
          score: results.filter(r => r.isCorrect).length,
          totalQuestions: results.length,
          startTime: startTime,
          endTime: new Date(),
          details: results.map(r => ({
            question: { id: r.questionId },
            userAnswer: r.userAnswer,
            isCorrect: r.isCorrect
          }))
        }),
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Auth loading screen
  if (authLoading) {
    return (
      <>
        <LiquidBackground />
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center animate-fade-in space-y-4 max-w-sm w-full">
            <div className="w-12 h-12 border-2 border-black/10 border-t-black rounded-full mx-auto animate-spin"></div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-semibold">Restoring session...</p>
          </div>
        </div>
      </>
    );
  }

  // Not logged in → show auth page
  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // Quiz view
  if (view === 'QUIZ') {
    return <QuizEngine studySet={activeSet} mode={quizMode} onFinish={handleQuizFinish} onBack={() => setView('LIBRARY')} />;
  }

  // Results view
  if (view === 'RESULTS') {
    return (
      <QuizResults 
        studySet={activeSet} 
        results={currentResults} 
        startTime={sessionStartTime} 
        onBackToLibrary={() => { setView('LIBRARY'); fetchStudySets(); }} 
      />
    );
  }

  // Stats view
  if (view === 'STATS') {
    return (
      <>
        <Navbar
          user={user}
          onImportClick={() => setIsImportModalOpen(true)}
          onLibraryClick={() => setView('LIBRARY')}
          onStatsClick={() => setView('STATS')}
          onKanjiExplorerClick={() => setView('KANJI_EXPLORER')}
          onLogout={handleLogout}
        />
        <StatsPage onBack={() => setView('LIBRARY')} />
      </>
    );
  }

  // Kanji Explorer view
  if (view === 'KANJI_EXPLORER') {
    return (
      <>
        <LiquidBackground />
        <Navbar
          user={user}
          onImportClick={() => setIsImportModalOpen(true)}
          onLibraryClick={() => setView('LIBRARY')}
          onStatsClick={() => setView('STATS')}
          onKanjiExplorerClick={() => setView('KANJI_EXPLORER')}
          onLogout={handleLogout}
        />
        <KanjiLookup onBack={() => setView('LIBRARY')} />
      </>
    );
  }

  // Library view (default)
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <LiquidBackground />

      <Navbar
        user={user}
        onImportClick={() => setIsImportModalOpen(true)}
        onLibraryClick={() => setView('LIBRARY')}
        onStatsClick={() => setView('STATS')}
        onKanjiExplorerClick={() => setView('KANJI_EXPLORER')}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 mt-16 p-8 md:p-16 max-w-7xl mx-auto w-full z-10">
        {/* Hero Header */}
        <header className="pt-8 pb-10 space-y-4 animate-fade-in-up">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zen-black/60 font-bold mb-3 animate-fade-in stagger-1">academic portfolio</p>
              <h2 className="text-5xl md:text-6xl font-extralight text-zen-black tracking-tighter leading-none">
                Repository
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-zen-black/60 text-xs font-medium hidden md:block">
                {studySets.length} {studySets.length === 1 ? 'set' : 'sets'} available
              </p>
              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[9px] uppercase tracking-[0.15em] font-bold text-zen-black/60 bg-white/40 border border-black/10 rounded-xl px-3 py-2 focus:outline-none cursor-pointer hover:bg-white/60 transition-all duration-200"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            </div>
          </div>
          <div className="w-full h-0.5 bg-gradient-to-r from-zen-black via-white/50 to-transparent mt-6"></div>
        </header>
 
        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="glass-panel p-12 space-y-4 text-center animate-fade-in max-w-xs w-full">
              <div className="w-12 h-12 border-2 border-black/10 border-t-black rounded-full mx-auto animate-spin"></div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-semibold">Loading sets...</p>
            </div>
          </div>
        ) : (!studySets || studySets.length === 0) ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center py-24 animate-fade-in-up max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 border border-dashed border-black/20 rounded-full flex items-center justify-center mb-8 animate-float bg-white/20">
              <span className="text-3xl font-light text-zen-black/80">空</span>
            </div>
            <p className="text-zen-black font-semibold text-base mb-2">Your repository is empty</p>
            <p className="text-zen-black/60 text-xs mb-8 max-w-md">
              {user.role === 'ADMIN' ? 'Import a JSON study set to begin learning' : 'Ask an admin to import study sets'}
            </p>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-10 py-3.5 glass-btn text-[10px] uppercase tracking-[0.2em] font-bold"
              >
                Import First Set
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(() => {
              const sorted = [...studySets].sort((a, b) => {
                if (sortBy === 'oldest') return a.id - b.id;
                if (sortBy === 'az') return a.title.localeCompare(b.title);
                if (sortBy === 'za') return b.title.localeCompare(a.title);
                return b.id - a.id; // newest
              });
              return sorted.map((set, index) => (
              <div
                key={set.id}
                className={`glass-panel glass-panel-hover group p-8 flex flex-col justify-between md:aspect-square aspect-auto min-h-[300px] animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] text-zen-black/60 font-bold uppercase tracking-[0.3em]">
                      {set.cardCount ?? (set.questions?.length || 0)} cards
                    </span>
                    {user?.role === 'ADMIN' ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(set);
                          }}
                          className="text-[9px] uppercase tracking-[0.2em] text-zen-black/40 hover:text-zen-black transition-colors duration-300 cursor-pointer font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSet(set.id, set.title);
                          }}
                          className="text-[9px] uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-colors duration-300 cursor-pointer font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                    )}
                  </div>
                  <h3 className="text-2xl font-light text-zen-black mb-3 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                    {set.title}
                  </h3>
                  <p className="text-zen-black/60 text-sm font-light line-clamp-2 leading-relaxed">{set.description}</p>
                </div>
                
                {/* Card Bottom - Mode Selection */}
                <div className="pt-6 border-t border-white/50 flex flex-col space-y-3 opacity-100 translate-y-0 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-500">
                  <button
                    onClick={() => handleStartQuiz(set, 'TYPING')}
                    className="option-btn text-[10px] text-left uppercase tracking-[0.15em] text-zen-black/60 hover:text-zen-black font-semibold py-1.5 cursor-pointer"
                  >
                    ⌨ Typing Mode
                  </button>
                  <button
                    onClick={() => handleStartQuiz(set, 'MCQ')}
                    className="option-btn text-[10px] text-left uppercase tracking-[0.15em] text-zen-black/60 hover:text-zen-black font-semibold py-1.5 cursor-pointer"
                  >
                    ◉ Multiple Choice
                  </button>
                  <button
                    onClick={() => handleStartQuiz(set, 'GENIUS')}
                    className="option-btn text-[10px] text-left uppercase tracking-[0.15em] text-zen-black font-bold py-1.5 cursor-pointer"
                  >
                    ⚡ Genius Mode
                  </button>
                </div>
              </div>
              ));
            })()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/30 z-10">
        <p className="text-[9px] uppercase tracking-[0.4em] text-zen-black/40 font-semibold">日本語 — Built for mastery</p>
      </footer>

      {user.role === 'ADMIN' && (
        <ImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          onImport={(data) => {
            return fetch(`${API_BASE_URL}/api/study-sets/import`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify(data),
            }).then(res => {
              if (res.ok) {
                fetchStudySets();
                setIsImportModalOpen(false);
              } else {
                throw new Error('Backend error');
              }
            });
          }}
        />
      )}

      {/* Edit Study Set Modal */}
      {editingSet && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditingSet(null)}
        >
          <div
            className="bg-[#fafafa] border border-black/10 shadow-2xl rounded-[24px] p-10 max-w-sm w-full animate-scale-in space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-zen-black">✏ Edit Study Set</p>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] uppercase tracking-[0.25em] text-zen-black/60 font-bold block mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-sm font-light focus:outline-none rounded-xl text-zen-black"
                  placeholder="Study set title"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.25em] text-zen-black/60 font-bold block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-sm font-light focus:outline-none rounded-xl text-zen-black resize-none h-20"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setEditingSet(null)}
                className="flex-1 py-2.5 glass-btn text-[9px] uppercase tracking-[0.2em] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || editLoading}
                className={`flex-1 py-2.5 glass-btn text-[9px] uppercase tracking-[0.2em] font-bold ${
                  !editTitle.trim() || editLoading ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
