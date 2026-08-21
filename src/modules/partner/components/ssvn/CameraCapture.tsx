import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CircleStop, Video } from 'lucide-react';
import { pickRecorderMime, recorderFileExt } from '@/modules/trade-test/lib/mediaDuration';

type CaptureMeta = {
  capturedAt: string;
  durationSeconds: number | null;
};

export default function CameraCapture({
  mode,
  minDurationSec = 0,
  onCapture,
  onRecordingStart,
  disabled,
  captureLabel,
}: {
  mode: 'photo' | 'video';
  minDurationSec?: number;
  onCapture: (file: File, meta: CaptureMeta) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
  captureLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setError('Camera permission denied or not available. Allow camera access, or upload a file instead.');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `live-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, { capturedAt: new Date().toISOString(), durationSeconds: null });
        stopStream();
      },
      'image/jpeg',
      0.92,
    );
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickRecorderMime();
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || mime || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      const ext = recorderFileExt(type);
      const file = new File([blob], `live-video-${Date.now()}.${ext}`, { type: blob.type });
      const durationSeconds = Math.max(0, (Date.now() - startedAtRef.current) / 1000);
      onCapture(file, { capturedAt: new Date().toISOString(), durationSeconds });
      stopStream();
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    setElapsed(0);
    rec.start(250);
    setRecording(true);
    onRecordingStart?.();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
  };

  const stopRecording = () => {
    if (minDurationSec && elapsed < minDurationSec) return;
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-md border bg-black aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {!live && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            Camera off
          </div>
        )}
        {recording && (
          <div className="absolute top-2 left-2 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
            REC {elapsed}s
            {minDurationSec > 0 ? ` / ${minDurationSec}s min` : ''}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!live ? (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={startCamera}>
            {mode === 'photo' ? (
              <Camera className="h-4 w-4 mr-1" />
            ) : (
              <Video className="h-4 w-4 mr-1" />
            )}
            Open camera
          </Button>
        ) : mode === 'photo' ? (
          <>
            <Button type="button" size="sm" disabled={disabled} onClick={takePhoto}>
              {captureLabel || 'Take live photo'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={stopStream}>
              Cancel
            </Button>
          </>
        ) : recording ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled || elapsed < minDurationSec}
            onClick={stopRecording}
          >
            <CircleStop className="h-4 w-4 mr-1" />
            {elapsed < minDurationSec
              ? `Keep recording (${minDurationSec - elapsed}s left)`
              : captureLabel || 'Stop & save'}
          </Button>
        ) : (
          <>
            <Button type="button" size="sm" disabled={disabled} onClick={startRecording}>
              {captureLabel || 'Start recording'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={stopStream}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
