export interface VoiceOption {
  name: string;
  gender: 'Male' | 'Female';
  style: string;
}

export enum GenerationMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI'
}

export interface SpeakerConfig {
  name: string;
  voiceName: string;
}

export interface AudioState {
  isPlaying: boolean;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
}

export interface GenerationResult {
  audioBuffer: AudioBuffer;
  blob: Blob;
}