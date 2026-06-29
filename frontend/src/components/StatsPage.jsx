import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const StatsPage = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [weakPoints, setWeakPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/quiz/stats`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/quiz/sessions`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/quiz/weak-points`).then(r => r.json()),
    ]).then(([statsData, sessionsData, weakData]) => {
      setStats(statsData);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setWeakPoints(Array.isArray(weakData) ? weakData.slice(0, 10) : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const accuracy = stats && stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-panel p-12 space-y-4 text-center animate-fade-in max-w-xs w-full z-10">
          <div className="w-12 h-12 border-2 border-black/10 border-t-black rounded-full mx-auto animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-semibold">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-8 md:px-16 pt-24 pb-16 z-10 relative">

        {/* Header */}
        <header className="pb-12 animate-fade-in-up">
          <button 
            onClick={onBack} 
            className="glass-link text-[10px] uppercase tracking-[0.3em] text-zen-black/60 hover:text-zen-black transition-colors mb-6 inline-block font-bold cursor-pointer"
          >
            ← Back to Repository
          </button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-zen-black/60 font-bold mb-3">Metrics</p>
              <h2 className="text-5xl md:text-6xl font-extralight text-zen-black tracking-tighter">
                統計
              </h2>
            </div>
            <p className="text-zen-black/60 text-xs font-semibold hidden md:block">
              {stats?.totalSessions || 0} sessions recorded
            </p>
          </div>
          <div className="w-full h-0.5 bg-gradient-to-r from-zen-black via-white/50 to-transparent mt-6"></div>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
          {[
            { label: 'Streak', value: stats?.streak || 0, icon: '🔥', accent: (stats?.streak || 0) > 0 ? 'text-orange-500 font-bold' : 'text-zen-black', suffix: stats?.streak === 1 ? ' day' : ' days' },
            { label: 'Sessions', value: stats?.totalSessions || 0, icon: '📝' },
            { label: 'Total Cards', value: stats?.totalQuestions || 0, icon: '🗂' },
            { label: 'Correct', value: stats?.totalCorrect || 0, icon: '✓', accent: 'text-emerald-500 font-bold' },
            { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯' },
          ].map((card, i) => (
            <div key={i} className={`glass-panel glass-panel-hover p-6 animate-fade-in-up stagger-${i + 1}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">{card.label}</span>
                <span className="text-lg opacity-60">{card.icon}</span>
              </div>
              <p className={`text-4xl font-extralight ${card.accent || 'text-zen-black'}`}>
                {card.value}{card.suffix ? <span className="text-sm text-zen-black/60 font-medium">{card.suffix}</span> : null}
              </p>
            </div>
          ))}
        </div>

        {/* Accuracy Bar */}
        <div className="glass-panel p-8 mb-16 animate-fade-in-up stagger-3">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zen-black/60 font-bold">Overall Accuracy</span>
            <span className="text-sm font-semibold text-zen-black">{accuracy}%</span>
          </div>
          <div className="w-full h-3.5 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/35">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: `${accuracy}%`,
                transitionDelay: '0.5s',
                background: accuracy >= 70 ? 'linear-gradient(to right, #10b981, #059669)' : accuracy >= 50 ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #ef4444, #dc2626)',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)'
              }}
            ></div>
          </div>
        </div>

        {/* Weak Points */}
        {weakPoints.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center space-x-4 mb-8">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-white/40"></div>
              <span className="text-[9px] uppercase tracking-[0.4em] text-red-500 font-bold animate-pulse">⚠ Weak Points — Review These</span>
              <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent to-white/40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakPoints.map((wp, i) => (
                <div key={i} className={`glass-panel glass-panel-hover flex items-center justify-between p-5 border-l-4 border-l-red-400 hover:border-l-red-500 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="flex items-center space-x-4">
                    <span className="text-red-500 font-bold text-xs font-mono">×{wp.wrongCount}</span>
                    <span className="text-xl font-light text-zen-black">{wp.prompt}</span>
                  </div>
                  <span className="text-sm text-zen-black/60 font-semibold">{wp.answer}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History */}
        <div className="mb-16">
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-white/40"></div>
            <span className="text-[9px] uppercase tracking-[0.4em] text-zen-black/60 font-bold">Session History</span>
            <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent to-white/40"></div>
          </div>

          {sessions.length === 0 ? (
            <div className="glass-panel p-16 text-center animate-fade-in">
              <p className="text-zen-black/60 font-light text-sm">No sessions yet. Complete a quiz to see your history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, i) => {
                const pct = session.totalQuestions > 0
                  ? Math.round((session.score / session.totalQuestions) * 100)
                  : 0;
                return (
                  <div key={session.id} className={`glass-panel glass-panel-hover flex items-center justify-between p-5 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center bg-white/20 shadow-sm">
                        <span className="text-xs font-bold text-zen-black">
                          {pct}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zen-black leading-tight">
                          {session.studySet?.title || 'Unknown Set'}
                        </p>
                        <p className="text-[10px] text-zen-black/60 mt-1.5 font-medium">
                          {session.mode} · {session.score}/{session.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/20">
                        <div className="h-full bg-zen-black rounded-full progress-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-[9px] text-zen-black/40 mt-2 font-semibold">
                        {session.startTime ? new Date(session.startTime).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StatsPage;
