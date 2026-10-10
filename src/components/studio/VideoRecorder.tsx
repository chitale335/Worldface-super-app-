import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Camera, SwitchCamera, Circle, Square, Download, Upload, Loader2, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Pick a container/codec the browser can actually record, keeping the audio track. */
const pickMimeType = () => {
  const candidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
};

export const VideoRecorder = () => {
  const { user } = useAuth();
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [live, setLive] = useState(false);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => () => {
    stopStream();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [stopStream]);

  const startCamera = async (mode: 'user' | 'environment') => {
    stopStream();
    try {
      // Audio is always captured so recorded clips never lose their sound.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true; // avoid local echo while recording
      }
      setLive(true);
    } catch {
      toast.error('Camera or microphone access denied');
      setLive(false);
    }
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    if (!stream.getAudioTracks().length) {
      toast.error('No microphone detected — sound would be lost');
      return;
    }
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 4_000_000,
      audioBitsPerSecond: 128_000,
    });
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const type = rec.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      if (clip) URL.revokeObjectURL(clip.url);
      setClip({ blob, url: URL.createObjectURL(blob), name: `WorldFace_${Date.now()}.${ext}` });
      toast.success('Clip ready — sound included');
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error('Video must be under 200MB'); return; }
    if (clip) URL.revokeObjectURL(clip.url);
    setClip({ blob: file, url: URL.createObjectURL(file), name: file.name });
  };

  const download = () => {
    if (!clip) return;
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = clip.name;
    a.click();
    toast.success('Video saved to your device');
  };

  const publish = async () => {
    if (!clip) return;
    if (!user) { toast.error('Sign in to publish'); return; }
    setPublishing(true);
    try {
      const ext = clip.name.split('.').pop() || 'webm';
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('posts')
        .upload(path, clip.blob, { contentType: clip.blob.type || 'video/webm', cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('posts').getPublicUrl(path);
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        type: 'video',
        caption: caption.trim() || null,
        media_url: data.publicUrl,
      });
      if (error) throw error;
      toast.success('Published to your feed 🎬');
      setCaption('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not publish');
    } finally {
      setPublishing(false);
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-20 rounded-2xl flex flex-col gap-1 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold"
          onClick={() => startCamera(facing)}
        >
          <Camera className="w-6 h-6" />
          <span className="text-xs">{live ? 'Restart Camera' : 'Open Camera'}</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 rounded-2xl flex flex-col gap-1 border-dashed border-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">Upload Video</span>
        </Button>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </div>

      {live && (
        <Card className="overflow-hidden rounded-2xl border-2 border-primary/30">
          <div className="relative bg-black aspect-[9/16] max-h-[60vh]">
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={facing === 'user' ? { transform: 'scaleX(-1)' } : undefined}
            />
            {recording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1 text-xs text-destructive-foreground">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {mmss}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 p-4 bg-card">
            <Button variant="outline" size="icon" className="rounded-full" disabled={recording}
              onClick={() => { const next = facing === 'user' ? 'environment' : 'user'; setFacing(next); startCamera(next); }}>
              <SwitchCamera className="h-5 w-5" />
            </Button>
            {recording ? (
              <Button size="lg" variant="destructive" className="rounded-full h-16 w-16 p-0" onClick={stopRecording}>
                <Square className="w-7 h-7" />
              </Button>
            ) : (
              <Button size="lg" className="rounded-full h-16 w-16 p-0 bg-gradient-to-r from-rose-500 to-red-600 text-white" onClick={startRecording}>
                <Circle className="w-8 h-8" />
              </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => { if (recording) stopRecording(); stopStream(); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      )}

      {clip && (
        <Card className="overflow-hidden rounded-2xl">
          <video src={clip.url} controls playsInline className="w-full max-h-[50vh] bg-black" />
          <CardContent className="p-4 space-y-3">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption for your feed… use #hashtags"
              rows={2}
              maxLength={2200}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={publish} disabled={publishing}>
                {publishing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Publish to feed
              </Button>
              <Button size="sm" variant="outline" onClick={download}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
