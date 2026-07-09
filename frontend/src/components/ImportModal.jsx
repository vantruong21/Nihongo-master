import React, { useState } from 'react';

const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setError('');
      onClose();
    }, 250);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonData(event.target.result);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.title || !parsed.cards || !Array.isArray(parsed.cards)) {
        setError('JSON must contain "title" and "cards" array.');
        return;
      }
      setError('');
      setLoading(true);
      await onImport(parsed);
    } catch (err) {
      if (err.name === 'SyntaxError') {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError('Import failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center modal-backdrop p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      onClick={handleClose}
    >
      <div
        className={`glass-panel w-full max-w-2xl shadow-2xl transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/20">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📥</span>
            <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-zen-black">Import Study Set</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors duration-200 text-zen-black/60 hover:text-zen-black cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Drag Zone */}
          <div
            className={`border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer rounded-2xl ${dragActive
              ? 'border-zen-black bg-white/30 scale-[1.01]'
              : 'border-black/10 hover:border-black/20 bg-white/10'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className={`transition-transform duration-300 ${dragActive ? 'scale-105' : ''}`}>
              <span className="text-3xl block mb-3 opacity-60 animate-float">📄</span>
              <p className="text-xs font-semibold text-zen-black">
                Drag and drop your <span className="underline">.json</span> file here
              </p>
              <p className="text-[10px] text-zen-black/60 mt-1.5 font-medium">or paste JSON data below</p>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={jsonData}
              onChange={(e) => { setJsonData(e.target.value); setError(''); }}
              placeholder={'{ "title": "N5 Kanji", "description": "Basic Kanji", "cards": [\n  { "prompt": "飛", "answer": "fly / tobu", "type": "KANJI", "level": "N5", "hint": "A bird flying", "mnemonic": "Wings outstretched, soaring high" }\n] }'}
              className="w-full h-44 p-4 glass-input font-mono text-xs focus:outline-none transition-all duration-300 resize-none text-zen-black placeholder-black/30 rounded-2xl"
              spellCheck="false"
            />
            {jsonData && (
              <button
                onClick={() => setJsonData('')}
                className="absolute top-3 right-3 text-[9px] uppercase tracking-widest text-zen-black/60 hover:text-zen-black transition-colors font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="animate-fade-in flex items-center space-x-2 p-3.5 bg-red-50/40 backdrop-blur-sm border border-red-200/50 text-red-600 text-xs font-semibold rounded-xl">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-[9px] text-zen-black/60 font-medium">
              {jsonData ? `${jsonData.length} characters` : 'Awaiting data...'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!jsonData.trim() || loading}
              className={`px-10 py-3.5 glass-btn text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-200 ${
                !jsonData.trim() || loading ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  <span>Importing...</span>
                </span>
              ) : 'Initialize Set'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
