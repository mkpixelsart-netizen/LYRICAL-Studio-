import React, { useState, useMemo } from 'react';
import { VOICES } from '../constants';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voice: string) => void;
  label?: string;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect, label, disabled = false }) => {
  const [filterGender, setFilterGender] = useState<'All' | 'Male' | 'Female'>('All');

  const filteredVoices = useMemo(() => {
    if (filterGender === 'All') return VOICES;
    return VOICES.filter(v => v.gender === filterGender);
  }, [filterGender]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Header / Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {label && <label className="text-sm font-medium text-slate-400 whitespace-nowrap">{label}</label>}
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700/50 ml-auto sm:ml-0">
          {(['All', 'Male', 'Female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                filterGender === g 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredVoices.map((voice) => {
            const isSelected = selectedVoice === voice.name;
            return (
                <button
                    key={voice.name}
                    onClick={() => onSelect(voice.name)}
                    disabled={disabled}
                    className={`
                        relative flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all duration-200 group h-24
                        ${isSelected 
                            ? 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-500/20 shadow-lg shadow-blue-900/40' 
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:shadow-md hover:text-slate-200'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <div className="flex items-center justify-center gap-1.5 w-full mb-2">
                        <span className={`font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {voice.name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold opacity-60 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {voice.gender.charAt(0)}
                        </span>
                    </div>
                    
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium truncate max-w-full transition-colors ${
                        isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-900/60 text-slate-500 group-hover:bg-slate-900 group-hover:text-slate-400'
                    }`}>
                        {voice.style}
                    </span>
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default VoiceSelector;