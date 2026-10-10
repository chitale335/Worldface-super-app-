import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, Square, Download, Loader2, Upload, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const pickMimeType = () => {
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
};

export const AudioRecorder = () => {
  const { user } = useAuth();
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [track, setTrack] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 2 },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 192_000 });
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes('mp4') ? 'm4a' : 'webm';
        if (track) URL.revokeObjectURL(track.url);
        setTrack({ blob, url: URL.createObjectURL(blob), name: `Take_${Date.now()}.${ext}` });
        cleanup();
      };
      rec.start(1000);
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Audio must be under 50MB'); return; }
    if (track) URL.revokeObjectURL(track.url);
    setTrack({ blob: file, url: URL.createObjectURL(file), name: file.name });
    setTitle((t) => t || file.name.replace(/\.[^.]+$/, ''));
  };

  const download = () => {
    if (!track) return;
    const a = document.createElement('a');
    a.href = track.url;
    a.download = track.name;
    a.click();
    toast.success('Audio saved to your device');
  };

  const saveToLibrary = async () => {
    if (!track) return;
    if (!user) { toast.error('Sign in first'); return; }
    setSaving(true);
    try {
      const ext = track.name.split('.').pop() || 'webm';
      const path = `${user.id}/audio/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('posts')
        .upload(path, track.blob, { contentType: track.blob.type || 'audio/webm', cacheControl: '3600' });
      if (error) throw error;
      const { data } = supabase.storage.from('posts').getPublicUrl(path);
      await navigator.clipboard?.writeText(data.publicUrl).catch(() => undefined);
      toast.success('Saved — link copied, ready for your music page');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {recording ? (
          <Button variant="destructive" className="h-20 rounded-2xl flex flex-col gap-1" onClick={stop}>
            <Square className="w-6 h-6" />
            <span className="text-xs">Stop • {mmss}</span>
          </Button>
        ) : (
          <Button className="h-20 rounded-2xl flex flex-col gap-1 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold" onClick={start}>
            <Mic className="w-6 h-6" />
            <span className="text-xs">Record Audio</span>
          </Button>
        )}
        <Button variant="outline" className="h-20 rounded-2xl flex flex-col gap-1 border-dashed border-2" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-6 h-6" />
          <span className="text-xs">Upload Audio</span>
        </Button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
      </div>

      {track && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <audio src={track.url} controls className="w-full" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" maxLength={120} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={saveToLibrary} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Save to library
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
