import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  blob: Blob | null;
  audioContext: AudioContext | null;
  bassBoost?: number; // 0 to 10
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, blob, audioContext, bassBoost = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Reset state when new buffer arrives
  useEffect(() => {
    stopAudio();
    pausedTimeRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBuffer]);

  // Update filter gain in real-time
  useEffect(() => {
    if (bassFilterRef.current && audioContext) {
        // Map 0-10 slider to 0-15dB gain
        bassFilterRef.current.gain.setTargetAtTime(bassBoost * 1.5, audioContext.currentTime, 0.1);
    }
  }, [bassBoost, audioContext]);

  const playAudio = () => {
    if (!audioBuffer || !audioContext) return;

    // Resume context if suspended (browser requirement)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create Bass Filter
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.value = 200; // Boost frequencies below 200Hz
    filter.gain.value = bassBoost * 1.5;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect: Source -> Filter -> Analyser -> Destination
    source.connect(filter);
    filter.connect(analyser);
    analyser.connect(audioContext.destination);

    sourceRef.current = source;
    bassFilterRef.current = filter;
    analyserRef.current = analyser;

    const offset = pausedTimeRef.current % audioBuffer.duration;
    source.start(0, offset);
    startTimeRef.current = audioContext.currentTime - offset;
    
    setIsPlaying(true);
    
    source.onended = () => {
       // This fires even on stop(), so we check if we are actually at the end
       const duration = audioBuffer.duration;
       const elapsed = audioContext.currentTime - startTimeRef.current;
       if (elapsed >= duration) {
           setIsPlaying(false);
           pausedTimeRef.current = 0;
       }
    };
    
    visualize();
  };

  const pauseAudio = () => {
    if (sourceRef.current && isPlaying && audioContext) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      pausedTimeRef.current = audioContext.currentTime - startTimeRef.current;
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
        try {
            sourceRef.current.stop();
        } catch (e) { /* ignore */ }
        sourceRef.current.disconnect();
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    pausedTimeRef.current = 0;
  };

  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return; // Stop loop if not playing
      
      animationFrameRef.current = requestAnimationFrame(draw);
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(15, 23, 42)'; // Match bg
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient fill
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6');
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `lyrical-studio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!audioBuffer) {
    return (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
            <span className="text-slate-500">Generate audio to see playback controls</span>
        </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Audio Output</h3>
        <div className="text-xs text-slate-400 font-mono">
            {audioBuffer.duration.toFixed(2)}s • 24kHz • Mono
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={600} 
        height={100} 
        className="w-full h-24 bg-slate-900 rounded-lg mb-6 border border-slate-700"
      />

      <div className="flex gap-4 justify-center">
        {!isPlaying ? (
          <button
            onClick={playAudio}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Play
          </button>
        ) : (
          <button
            onClick={pauseAudio}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause
          </button>
        )}

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-medium transition-colors border border-slate-600"
        >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          Download WAV
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;