let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let audioUnlocked = false;

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function pcmBase64ToWavUrl(base64Pcm: string, sampleRate = 24000): string {
  const binary = atob(base64Pcm);
  const pcmData = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    pcmData[i] = binary.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmData);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function parseSampleRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : 24000;
}

function configureAudioElement(audio: HTMLAudioElement): void {
  audio.preload = 'auto';
  audio.playsInline = true;
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
}

/** Call on user tap so iOS Safari allows playback after async work */
export function primeAudioPlayback(): void {
  if (audioUnlocked || typeof Audio === 'undefined') return;

  const silent = new Audio(
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
  );
  configureAudioElement(silent);
  silent.volume = 0.01;
  void silent
    .play()
    .then(() => {
      silent.pause();
      audioUnlocked = true;
    })
    .catch(() => {
      audioUnlocked = true;
    });
}

export function stopAudioPlayback(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export async function playGeminiAudio(data: string, mimeType: string): Promise<void> {
  stopAudioPlayback();

  const lower = mimeType.toLowerCase();
  let url: string;

  if (lower.includes('pcm') || lower.includes('l16') || lower.includes('linear16')) {
    url = pcmBase64ToWavUrl(data, parseSampleRate(mimeType));
  } else {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const blobType = lower.includes('mpeg') || lower.includes('mp3')
      ? 'audio/mpeg'
      : lower.includes('ogg') || lower.includes('opus')
        ? 'audio/ogg'
        : 'audio/wav';
    const blob = new Blob([bytes], { type: blobType });
    url = URL.createObjectURL(blob);
  }

  currentObjectUrl = url;

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    configureAudioElement(audio);
    currentAudio = audio;

    const finish = () => {
      stopAudioPlayback();
      resolve();
    };

    audio.onended = finish;
    audio.onerror = () => {
      stopAudioPlayback();
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch((err) => {
      stopAudioPlayback();
      reject(err instanceof Error ? err : new Error('Audio playback blocked'));
    });
  });
}

export function playPcmBase64(base64Pcm: string): Promise<void> {
  return playGeminiAudio(base64Pcm, 'audio/L16;codec=pcm;rate=24000');
}

export function canPlayGeminiAudio(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}
