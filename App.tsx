import React, { useState, useEffect } from 'react';
import { GeminiService } from './services/geminiService';
import VoiceSelector from './components/VoiceSelector';
import AudioPlayer from './components/AudioPlayer';
import { GenerationMode, SpeakerConfig } from './types';
import { SAMPLE_SINGLE_PROMPT, SAMPLE_MULTI_PROMPT, STYLES, SPEED_OPTIONS } from './constants';

// Initialize service outside component to avoid recreation
let geminiService: GeminiService | null = null;
try {
  geminiService = new GeminiService();
} catch (error) {
  console.error("Failed to initialize Gemini Service:", error);
}

// --- Persistence Helpers ---
const STORAGE_KEYS = {
  MODE: 'mmk_studio_mode',
  VOICE_SINGLE: 'mmk_studio_voice_single',
  SPEAKER_1: 'mmk_studio_speaker_1',
  SPEAKER_2: 'mmk_studio_speaker_2',
  STYLE: 'mmk_studio_style',
  SPEED: 'mmk_studio_speed',
  BASS: 'mmk_studio_bass',
};

const getStoredState = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
};

export default function App() {
  // --- State with Persistence ---
  const [mode, setMode] = useState<GenerationMode>(() => 
    getStoredState(STORAGE_KEYS.MODE, GenerationMode.SINGLE)
  );
  
  // Single Speaker State
  const [selectedVoice, setSelectedVoice] = useState<string>(() => 
    getStoredState(STORAGE_KEYS.VOICE_SINGLE, 'Zephyr')
  );
  
  // Multi Speaker State
  const [speaker1, setSpeaker1] = useState<SpeakerConfig>(() => 
    getStoredState(STORAGE_KEYS.SPEAKER_1, { name: 'Joe', voiceName: 'Kore' })
  );
  const [speaker2, setSpeaker2] = useState<SpeakerConfig>(() => 
    getStoredState(STORAGE_KEYS.SPEAKER_2, { name: 'Jane', voiceName: 'Puck' })
  );

  // Style, Speed, Bass State
  const [selectedStyle, setSelectedStyle] = useState<string>(() => 
    getStoredState(STORAGE_KEYS.STYLE, '')
  );
  const [selectedSpeedId, setSelectedSpeedId] = useState<string>(() => 
    getStoredState(STORAGE_KEYS.SPEED, 'normal')
  );
  const [bassBoost, setBassBoost] = useState<number>(() => 
    getStoredState(STORAGE_KEYS.BASS, 0)
  );

  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [text, setText] = useState(mode === GenerationMode.SINGLE ? SAMPLE_SINGLE_PROMPT : SAMPLE_MULTI_PROMPT);

  // UI Toggles for Multi-Speaker Dropdowns
  const [showSpeaker1Voice, setShowSpeaker1Voice] = useState(false);
  const [showSpeaker2Voice, setShowSpeaker2Voice] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Transcript Generation State
  const [transcriptTopic, setTranscriptTopic] = useState('');
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MODE, JSON.stringify(mode)); }, [mode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.VOICE_SINGLE, JSON.stringify(selectedVoice)); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SPEAKER_1, JSON.stringify(speaker1)); }, [speaker1]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SPEAKER_2, JSON.stringify(speaker2)); }, [speaker2]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STYLE, JSON.stringify(selectedStyle)); }, [selectedStyle]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SPEED, JSON.stringify(selectedSpeedId)); }, [selectedSpeedId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BASS, JSON.stringify(bassBoost)); }, [bassBoost]);

  // --- Mode Change Effect ---
  useEffect(() => {
    // Only reset text if it matches the default sample text
    if (mode === GenerationMode.SINGLE) {
      if (text === SAMPLE_MULTI_PROMPT) setText(SAMPLE_SINGLE_PROMPT);
    } else {
      if (text === SAMPLE_SINGLE_PROMPT) setText(SAMPLE_MULTI_PROMPT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // --- Handlers ---

  const handleGenerateAudio = async () => {
    if (!geminiService) {
      setError("API Key missing or Service failed to initialize.");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setAudioBuffer(null);
    setAudioBlob(null);

    try {
      await geminiService.resumeContext();
      
      const speedConfig = SPEED_OPTIONS.find(s => s.id === selectedSpeedId);
      const speedInstruction = speedConfig ? speedConfig.instruction : '';

      let result;
      if (mode === GenerationMode.SINGLE) {
        result = await geminiService.generateSingleSpeakerAudio(text, selectedVoice, selectedStyle, speedInstruction);
      } else {
        result = await geminiService.generateMultiSpeakerAudio(text, [speaker1, speaker2], selectedStyle, speedInstruction);
      }

      setAudioBuffer(result.buffer);
      setAudioBlob(result.blob);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTranscript = async () => {
    if (!geminiService || !transcriptTopic.trim()) return;
    
    setIsGeneratingTranscript(true);
    setError(null);
    try {
        const script = await geminiService.generateTranscript(transcriptTopic);
        setText(script);
    } catch (err: any) {
        setError("Failed to generate transcript: " + err.message);
    } finally {
        setIsGeneratingTranscript(false);
    }
  };

  const currentSpeedInfo = SPEED_OPTIONS.find(s => s.id === selectedSpeedId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight text-white">LYRICAL Studio</h1>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setMode(GenerationMode.SINGLE)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mode === GenerationMode.SINGLE ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Single Speaker
            </button>
            <button
              onClick={() => setMode(GenerationMode.MULTI)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mode === GenerationMode.MULTI ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Multi Speaker
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Tone/Style Selector */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Speaking Style
            </h2>
            <div className="space-y-4">
               <div>
                 <label className="text-sm font-medium text-slate-300">Select Tone / Accent</label>
                 <select 
                   value={selectedStyle} 
                   onChange={(e) => setSelectedStyle(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 mt-1"
                 >
                    {STYLES.map((style, idx) => (
                        <option key={idx} value={style.value}>{style.label}</option>
                    ))}
                 </select>
               </div>

               {/* Bass Controller */}
               <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex justify-between items-center mb-1">
                     <label className="text-sm font-medium text-slate-300">Improve Bass Voice</label>
                     <span className="text-xs text-purple-400 font-mono">{bassBoost > 0 ? `+${bassBoost * 10}%` : 'Off'}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    value={bassBoost}
                    onChange={(e) => setBassBoost(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Enhances low frequencies during playback.</p>
               </div>
               
               {/* Quick Presets */}
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => setSelectedStyle(STYLES.find(s => s.label.includes('Advertising'))?.value || '')}
                    className="px-2 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded text-xs text-purple-200 transition-colors"
                  >
                    Advertising
                  </button>
                  <button 
                    onClick={() => setSelectedStyle(STYLES.find(s => s.label.includes('Radio DJ'))?.value || '')}
                    className="px-2 py-1.5 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-500/30 rounded text-xs text-orange-200 transition-colors"
                  >
                    Radio DJ
                  </button>
               </div>
            </div>
          </div>

          {/* Speed Control */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Speaking Pace
            </h2>
            <div className="space-y-4">
               <div className="flex bg-slate-900 p-1 rounded-lg">
                 {SPEED_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedSpeedId(option.id)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${selectedSpeedId === option.id ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {option.label}
                    </button>
                 ))}
               </div>
               
               <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 min-h-[80px]">
                   <p className="text-xs font-medium text-green-400 mb-1">{currentSpeedInfo?.label} Pace</p>
                   <p className="text-xs text-slate-400 leading-relaxed">
                       {currentSpeedInfo?.description}
                   </p>
               </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Voice Configuration
            </h2>
            
            {mode === GenerationMode.SINGLE ? (
              <VoiceSelector 
                selectedVoice={selectedVoice} 
                onSelect={setSelectedVoice} 
                label="Select Voice Model"
              />
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-300">Speaker 1 Name</label>
                   <input 
                     type="text" 
                     value={speaker1.name} 
                     onChange={(e) => setSpeaker1({...speaker1, name: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
                   />
                   <div className="mt-2">
                     <button 
                        className="text-xs text-blue-400 hover:text-blue-300 mb-1 font-medium"
                        onClick={() => setShowSpeaker1Voice(!showSpeaker1Voice)}
                     >
                       {speaker1.voiceName} (Change)
                     </button>
                     {showSpeaker1Voice && (
                       <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 animate-fadeIn">
                          <VoiceSelector 
                              selectedVoice={speaker1.voiceName}
                              onSelect={(v) => {
                                  setSpeaker1({...speaker1, voiceName: v});
                                  setShowSpeaker1Voice(false);
                              }}
                              label="Select Voice for Speaker 1"
                          />
                       </div>
                     )}
                   </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-slate-700">
                   <label className="text-sm font-medium text-slate-300">Speaker 2 Name</label>
                   <input 
                     type="text" 
                     value={speaker2.name} 
                     onChange={(e) => setSpeaker2({...speaker2, name: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
                   />
                   <div className="mt-2">
                     <button 
                        className="text-xs text-blue-400 hover:text-blue-300 mb-1 font-medium"
                        onClick={() => setShowSpeaker2Voice(!showSpeaker2Voice)}
                     >
                       {speaker2.voiceName} (Change)
                     </button>
                     {showSpeaker2Voice && (
                       <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 animate-fadeIn">
                          <VoiceSelector 
                              selectedVoice={speaker2.voiceName}
                              onSelect={(v) => {
                                  setSpeaker2({...speaker2, voiceName: v});
                                  setShowSpeaker2Voice(false);
                              }}
                              label="Select Voice for Speaker 2"
                          />
                       </div>
                     )}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Input & Output */}
        <div className="lg:col-span-8 space-y-6">
            
          {/* Input Area */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap justify-between items-center gap-3">
                <h2 className="font-semibold text-white min-w-fit">Text Input</h2>
                
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Text Justification Controls */}
                    <div className="flex bg-slate-700/50 rounded-lg p-1 gap-1">
                        <button 
                            onClick={() => setTextAlign('left')}
                            className={`p-2 rounded transition-all ${textAlign === 'left' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            title="Align Left"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => setTextAlign('center')}
                            className={`p-2 rounded transition-all ${textAlign === 'center' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            title="Align Center"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => setTextAlign('right')}
                            className={`p-2 rounded transition-all ${textAlign === 'right' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            title="Align Right"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => setTextAlign('justify')}
                            className={`p-2 rounded transition-all ${textAlign === 'justify' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            title="Full Justify"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1.5 rounded font-mono whitespace-nowrap">
                        {text.length} chars
                    </div>
                </div>
            </div>
            <div className="relative group">
                <textarea
                    className={`w-full h-[300px] bg-slate-900 text-slate-200 p-6 text-lg leading-relaxed outline-none resize-none font-mono transition-all focus:bg-slate-900/80`}
                    style={{ textAlign: textAlign }}
                    placeholder="Enter your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                {mode === GenerationMode.MULTI && (
                    <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-slate-900/90 p-2 rounded border border-slate-800 shadow-lg backdrop-blur-sm pointer-events-none hidden sm:block">
                        Format: <strong>{speaker1.name}:</strong> ... <strong>{speaker2.name}:</strong> ...
                    </div>
                )}
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center flex-wrap gap-2">
                <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                    {selectedStyle && <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        {STYLES.find(s => s.value === selectedStyle)?.label.split('(')[0]}
                    </span>}
                    {selectedSpeedId !== 'normal' && <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded border border-green-800/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {SPEED_OPTIONS.find(s => s.id === selectedSpeedId)?.label} Pace
                    </span>}
                </div>
                <button
                    onClick={handleGenerateAudio}
                    disabled={isLoading || !text}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center
                        ${isLoading || !text ? 'bg-slate-600 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:shadow-pink-500/20'}
                    `}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Generate Speech
                        </>
                    )}
                </button>
            </div>
          </div>

          {/* AI Transcript Generator */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-3 text-slate-400 uppercase tracking-wider">AI Assistance</h2>
            <div className="space-y-3">
                <label className="text-sm text-slate-300">Generate Transcript Topic</label>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        placeholder="e.g. Podcast about Mumbai street food" 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-slate-200"
                        value={transcriptTopic}
                        onChange={(e) => setTranscriptTopic(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerateTranscript}
                        disabled={isGeneratingTranscript || !transcriptTopic}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg px-3 py-2 transition-colors"
                    >
                        {isGeneratingTranscript ? (
                           <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-xs text-slate-500">Uses Gemini 2.0 Flash to write a script for you.</p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
             <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3 animate-fadeIn">
                <svg className="w-5 h-5 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
             </div>
          )}

          {/* Audio Player */}
          <AudioPlayer 
            audioBuffer={audioBuffer} 
            blob={audioBlob}
            audioContext={geminiService?.getAudioContext() || null} 
            bassBoost={bassBoost}
          />
        </div>
      </main>
    </div>
  );
}