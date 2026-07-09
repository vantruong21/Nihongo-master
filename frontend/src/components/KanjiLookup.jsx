import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_LABELS = {
  N5: 'N5 — Basic',
  N4: 'N4 — Elementary',
  N3: 'N3 — Intermediate',
  N2: 'N2 — Upper Intermediate',
  N1: 'N1 — Advanced',
};

const KanjiLookup = ({ onBack }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const currentStroke = useRef([]);
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLevel, setActiveLevel] = useState('N5');
  const [allKanji, setAllKanji] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKanji, setSelectedKanji] = useState(null);
  const recognitionTimer = useRef(null);

  useEffect(() => {
    const fetchAllKanji = async () => {
      setLoading(true);
      try {
        // Single endpoint: fetches ALL KANJI cards in one DB query (avoids N+1 problem)
        const res = await fetch(`${API_BASE_URL}/api/study-sets/kanji-cards`);
        if (!res.ok) throw new Error('Failed to fetch kanji cards');
        const kanji = await res.json();
        setAllKanji(Array.isArray(kanji) ? kanji : []);
      } catch (e) {
        console.error('Error fetching kanji:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllKanji();
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // Scale factor: canvas internal size vs CSS display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return [
        (e.touches[0].clientX - rect.left) * scaleX,
        (e.touches[0].clientY - rect.top) * scaleY,
      ];
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return [
        (e.changedTouches[0].clientX - rect.left) * scaleX,
        (e.changedTouches[0].clientY - rect.top) * scaleY,
      ];
    }
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ];
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      stroke.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => { redraw(); }, [redraw]);

  const onMouseDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const [x, y] = getPos(e, canvas);
    currentStroke.current = [[x, y]];
    setIsDrawing(true);
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const [x, y] = getPos(e, canvas);
    const stroke = currentStroke.current;
    const prev = stroke[stroke.length - 1];
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev[0], prev[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
    currentStroke.current = [...stroke, [x, y]];
  };

  const onMouseUp = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const newStrokes = [...strokes, currentStroke.current];
    setStrokes(newStrokes);
    currentStroke.current = [];
    setIsDrawing(false);
    clearTimeout(recognitionTimer.current);
    recognitionTimer.current = setTimeout(() => {
      recognizeHandwriting(newStrokes);
    }, 600);
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCandidates([]);
    clearTimeout(recognitionTimer.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    redraw();
  };

  const recognizeHandwriting = async (currentStrokes) => {
    if (!currentStrokes || currentStrokes.length === 0) return;
    try {
      const ink = currentStrokes.map(stroke => [
        stroke.map(p => p[0]),
        stroke.map(p => p[1]),
        stroke.map((_, i) => i * 100),
      ]);
      const body = JSON.stringify({
        options: 'enable_pre_space',
        requests: [{
          writing_guide: { writing_area_width: 200, writing_area_height: 200 },
          ink,
          language: 'ja',
          max_num_results: 8,
          max_completions: 0,
        }],
      });
      const res = await fetch(
        'https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
      const json = await res.json();
      if (json[0] === 'SUCCESS' && json[1]?.[0]?.[1]) {
        setCandidates(json[1][0][1].slice(0, 8));
      }
    } catch (e) {
      console.error('Handwriting recognition error:', e);
    }
  };

  const displayKanji = searchTerm
    ? allKanji.filter(q => {
        const s = searchTerm.toLowerCase();
        return (
          (q.prompt && q.prompt.includes(searchTerm)) ||
          (q.answer && q.answer.toLowerCase().includes(s)) ||
          (q.hint && q.hint.toLowerCase().includes(s))
        );
      })
    : allKanji.filter(q => {
        const lvl = (q.level || '').toUpperCase();
        return lvl === activeLevel || (!q.level && activeLevel === 'N5');
      });

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="mt-16 px-8 md:px-16 pt-10 pb-6 z-10">
        <button
          onClick={onBack}
          className="glass-link text-[10px] uppercase tracking-[0.2em] text-zen-black/60 hover:text-zen-black transition-colors duration-300 mb-6 inline-block font-bold cursor-pointer"
        >
          ← Repository
        </button>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zen-black/60 font-bold">Exploration Mode</p>
          <h1 className="text-4xl md:text-5xl font-extralight text-zen-black tracking-tighter">
            Kanji Explorer
          </h1>
        </div>
        <div className="w-full h-0.5 bg-gradient-to-r from-zen-black via-white/50 to-transparent mt-6" />
      </div>

      <div className="flex-1 px-8 md:px-16 pb-16 z-10">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">

          {/* Left: Search + Canvas */}
          <div className="lg:w-72 flex-shrink-0 space-y-6">
            <div className="glass-panel p-6 space-y-3">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">🔍 Search Kanji</p>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Kanji, meaning, hint..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full glass-input px-4 py-2.5 text-sm font-light focus:outline-none rounded-xl text-zen-black placeholder-black/30"
              />
            </div>

            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">✏ Draw Kanji</p>
                <button
                  onClick={clearCanvas}
                  className="text-[8px] uppercase tracking-[0.2em] font-bold text-zen-black/40 hover:text-zen-black/70 border border-black/10 hover:border-black/20 rounded-full px-3 py-1 transition-colors duration-200 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full aspect-square rounded-xl border border-black/10 bg-white/60 cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onMouseUp}
              />
              {candidates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-zen-black/40 font-bold">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {candidates.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setSearchTerm(c); clearCanvas(); }}
                        className="w-10 h-10 glass-panel glass-panel-hover flex items-center justify-center text-lg font-light text-zen-black hover:scale-110 transition-transform duration-200 cursor-pointer rounded-xl"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[8px] text-zen-black/30 leading-relaxed">
                Draw a character — suggestions appear automatically.
              </p>
            </div>
          </div>

          {/* Right: Level Tabs + Grid */}
          <div className="flex-1 space-y-6">
            {!searchTerm && (
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-200 cursor-pointer border ${
                      activeLevel === level
                        ? 'bg-zen-black text-white border-zen-black'
                        : 'glass-btn text-zen-black/60 border-black/10 hover:border-black/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">
              {searchTerm
                ? `Results for "${searchTerm}" — ${displayKanji.length} found`
                : `${LEVEL_LABELS[activeLevel]} — ${displayKanji.length} characters`}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="glass-panel p-10 text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full mx-auto animate-spin" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-semibold">Loading...</p>
                </div>
              </div>
            ) : displayKanji.length === 0 ? (
              <div className="glass-panel p-16 text-center">
                <p className="text-4xl font-light text-zen-black/20 mb-4">空</p>
                <p className="text-zen-black/60 text-sm">
                  {searchTerm ? 'No Kanji matched your search.' : `No Kanji tagged as ${activeLevel} yet.`}
                </p>
                <p className="text-zen-black/40 text-xs mt-2">
                  Add <code className="bg-black/5 px-1 rounded">"level": "{activeLevel}"</code> to cards when importing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                {displayKanji.map((q, i) => (
                  <button
                    key={q.id || i}
                    onClick={() => setSelectedKanji(q)}
                    title={q.answer}
                    className="aspect-square glass-panel glass-panel-hover flex items-center justify-center text-2xl font-light text-zen-black hover:scale-110 transition-transform duration-200 cursor-pointer rounded-2xl relative group"
                  >
                    {q.prompt}
                    {q.level && (
                      <span className="absolute top-0.5 right-1 text-[6px] text-zen-black/30 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {q.level}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Popup */}
      {selectedKanji && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedKanji(null)}
        >
          <div
            className="bg-[#fafafa] border border-black/10 shadow-2xl rounded-[28px] p-10 max-w-sm w-full animate-scale-in text-center space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {selectedKanji.level && (
              <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 rounded-full px-3 py-1">
                JLPT {selectedKanji.level}
              </span>
            )}
            <p className="text-8xl font-light text-zen-black leading-none">{selectedKanji.prompt}</p>
            <div className="space-y-1 pt-2 border-t border-black/5">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zen-black/40 font-bold">Meaning</p>
              <p className="text-lg font-light text-zen-black">{selectedKanji.answer}</p>
            </div>
            {selectedKanji.hint && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.3em] text-zen-black/40 font-bold">💡 Hint</p>
                <p className="text-sm text-zen-black/60 font-light italic">{selectedKanji.hint}</p>
              </div>
            )}
            {selectedKanji.mnemonic && (
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.3em] text-zen-black/40 font-bold">🧠 Mnemonic</p>
                <p className="text-sm text-amber-700/80 font-medium italic bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-2">
                  {selectedKanji.mnemonic}
                </p>
              </div>
            )}
            <button
              onClick={() => setSelectedKanji(null)}
              className="mt-2 text-[9px] uppercase tracking-[0.2em] font-bold text-zen-black/40 hover:text-zen-black transition-colors duration-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanjiLookup;
