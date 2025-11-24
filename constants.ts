import { VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { name: 'Zephyr', gender: 'Female', style: 'Bright' },
  { name: 'Puck', gender: 'Male', style: 'Upbeat' },
  { name: 'Charon', gender: 'Male', style: 'Informative' },
  { name: 'Kore', gender: 'Female', style: 'Firm' },
  { name: 'Fenrir', gender: 'Male', style: 'Excitable' },
  { name: 'Leda', gender: 'Female', style: 'Youthful' },
  { name: 'Orus', gender: 'Male', style: 'Firm' },
  { name: 'Aoede', gender: 'Female', style: 'Breezy' },
  { name: 'Callirrhoe', gender: 'Female', style: 'Easy-going' },
  { name: 'Autonoe', gender: 'Female', style: 'Bright' },
  { name: 'Enceladus', gender: 'Male', style: 'Breathy' },
  { name: 'Iapetus', gender: 'Male', style: 'Clear' },
  { name: 'Umbriel', gender: 'Male', style: 'Easy-going' },
  { name: 'Algieba', gender: 'Male', style: 'Smooth' },
  { name: 'Despina', gender: 'Female', style: 'Smooth' },
  { name: 'Erinome', gender: 'Female', style: 'Clear' },
  { name: 'Algenib', gender: 'Male', style: 'Gravelly' },
  { name: 'Rasalgethi', gender: 'Female', style: 'Informative' },
  { name: 'Laomedeia', gender: 'Female', style: 'Upbeat' },
  { name: 'Achernar', gender: 'Male', style: 'Soft' },
  { name: 'Alnilam', gender: 'Male', style: 'Firm' },
  { name: 'Schedar', gender: 'Male', style: 'Even' },
  { name: 'Gacrux', gender: 'Female', style: 'Mature' },
  { name: 'Pulcherrima', gender: 'Female', style: 'Forward' },
  { name: 'Achird', gender: 'Female', style: 'Friendly' },
  { name: 'Zubenelgenubi', gender: 'Male', style: 'Casual' },
  { name: 'Vindemiatrix', gender: 'Female', style: 'Gentle' },
  { name: 'Sadachbia', gender: 'Female', style: 'Lively' },
  { name: 'Sadaltager', gender: 'Female', style: 'Knowledgeable' },
  { name: 'Sulafat', gender: 'Female', style: 'Warm' },
];

export const STYLES = [
  { label: 'Natural / None', value: '' },
  { label: 'Advertising (Persuasive)', value: 'Speak in a persuasive, confident, and professional advertising voice designed to sell:' },
  { label: 'Radio DJ (High Energy)', value: 'Speak in an energetic, fast-paced, and engaging Radio DJ voice:' },
  { label: 'Indian English (Generic)', value: 'Speak in a clear Indian English accent:' },
  { label: 'Indian RJ (Energetic)', value: 'Speak in an energetic Indian Radio DJ voice:' },
  { label: 'News Anchor (Formal)', value: 'Speak with the formal, clear, and authoritative tone of a News Anchor:' },
  { label: 'Storyteller (Captivating)', value: 'Speak in a slow, captivating, and dramatic storytelling tone:' },
  { label: 'Whisper (Mysterious)', value: 'Speak in a quiet, mysterious whisper:' },
  { label: 'Excited (Hype)', value: 'Speak with extreme excitement and hype:' },
  { label: 'Calm (Meditation)', value: 'Speak in a very slow, soothing, and calm meditation voice:' },
];

export const SPEED_OPTIONS = [
  { 
    id: 'slow', 
    label: 'Slow', 
    instruction: 'Speak slowly and clearly. Enunciate every word with deliberate pauses.',
    description: 'Adds gravitas, emphasizes key points, and gives the audience time to process complex information.'
  },
  { 
    id: 'normal', 
    label: 'Normal', 
    instruction: '',
    description: 'Standard conversational pace.'
  },
  { 
    id: 'fast', 
    label: 'Fast', 
    instruction: 'Speak very quickly and energetically.',
    description: 'Injects energy, builds excitement, or signals a transition to less critical information.'
  }
];

export const SAMPLE_SINGLE_PROMPT = `Say cheerfully: Have a wonderful day!`;

export const SAMPLE_MULTI_PROMPT = `Joe: How's it going today Jane?
Jane: Not too bad, how about you?`;