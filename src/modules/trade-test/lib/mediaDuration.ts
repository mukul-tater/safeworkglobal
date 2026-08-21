/** Read duration of a video/audio File in the browser. */
export function getMediaDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const d = Number(el.duration);
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error('Could not read video duration'));
        return;
      }
      resolve(d);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video duration'));
    };
    el.src = url;
  });
}

export function pickRecorderMime(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

export function recorderFileExt(mime: string): string {
  return mime.includes('mp4') ? 'mp4' : 'webm';
}
