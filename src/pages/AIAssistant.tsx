import { useEffect, useRef, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot, Send, Mic, Square, Volume2, VolumeX, Loader2, Plus, MessageSquare, Trash2, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };
type Conv = { id: string; title: string; language: string; updated_at: string };

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function encodeWav(chunks: Float32Array[], sampleRate: number): Promise<Blob> {
  const target = 16000;
  const merged = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0; for (const c of chunks) { merged.set(c, o); o += c.length; }
  // linear downsample
  const ratio = sampleRate / target;
  const outLen = Math.floor(merged.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buffer = new ArrayBuffer(44 + out.length * 2);
  const view = new DataView(buffer);
  const wr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); view.setUint32(4, 36 + out.length * 2, true); wr(8, 'WAVE');
  wr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, target, true); view.setUint32(28, target * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  wr(36, 'data'); view.setUint32(40, out.length * 2, true);
  new Int16Array(buffer, 44).set(out);
  return new Blob([buffer], { type: 'audio/wav' });
}

const AIAssistant = () => {
  const { user, session } = useAuth();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<{ ctx: AudioContext; stream: MediaStream; node: ScriptProcessorNode; source: MediaStreamAudioSourceNode; chunks: Float32Array[] } | null>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, language, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations((data ?? []) as Conv[]);
  };
  useEffect(() => { loadConversations(); }, [user]);

  const openConversation = async (id: string) => {
    setConvId(id);
    const { data } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at');
    setMessages((data ?? []).filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content })));
  };

  const newChat = () => { setConvId(null); setMessages([]); };

  const deleteConversation = async (id: string) => {
    await supabase.from('ai_conversations').delete().eq('id', id);
    if (convId === id) newChat();
    loadConversations();
  };

  const speak = async (text: string) => {
    try {
      setSpeaking(true);
      const resp = await fetch(`${FN_BASE}/worldface-ai-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => setSpeaking(false);
      await a.play();
    } catch (e: any) {
      setSpeaking(false);
      toast.error('Voice playback failed');
    }
  };

  const stopSpeaking = () => { audioRef.current?.pause(); setSpeaking(false); };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy(true);

    let accumulated = '';
    let localConvId = convId;
    try {
      const resp = await fetch(`${FN_BASE}/worldface-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ messages: next, language, conversationId: convId }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(j.error || `Error ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j.conversationId && !localConvId) { localConvId = j.conversationId; setConvId(j.conversationId); }
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accumulated } : m);
                return [...prev, { role: 'assistant', content: accumulated }];
              });
            }
          } catch { /* ignore */ }
        }
      }
      loadConversations();
      if (autoSpeak && accumulated) speak(accumulated);
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node); node.connect(ctx.destination);
      recRef.current = { ctx, stream, node, source, chunks };
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = async () => {
    const r = recRef.current;
    if (!r) return;
    setRecording(false);
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect(); r.source.disconnect();
    const blob = await encodeWav(r.chunks, r.ctx.sampleRate);
    await r.ctx.close();
    recRef.current = null;
    if (blob.size < 2048) { toast.error('Recording too short'); return; }

    setTranscribing(true);
    try {
      const form = new FormData();
      form.append('file', blob, 'recording.wav');
      form.append('language', language === 'sw' ? 'sw' : 'en');
      const resp = await fetch(`${FN_BASE}/worldface-ai-stt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: form,
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error || 'STT failed');
      const text = (j.text ?? '').trim();
      if (!text) { toast.error('Couldn\'t hear that — try again'); return; }
      await send(text);
    } catch (e: any) {
      toast.error(e.message || 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  const suggestions = language === 'sw'
    ? ['Nisaidie kuandika chapisho la muziki', 'Toa hashtag za mtindo', 'Ninawezaje kupata coins?', 'Nini kipya kwenye WorldFace?']
    : ['Help me write a music post', 'Suggest trending hashtags', 'How do I earn coins?', 'What is new on WorldFace?'];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[260px_1fr] gap-0 h-[calc(100vh-5rem)] lg:h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col border-r border-border">
          <div className="p-3 border-b border-border">
            <Button onClick={newChat} className="w-full" size="sm"><Plus className="h-4 w-4 mr-1" /> New chat</Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No history yet</p>
              )}
              {conversations.map((c) => (
                <div key={c.id} className={`group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-muted ${convId === c.id ? 'bg-muted' : ''}`} onClick={() => openConversation(c.id)}>
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat */}
        <section className="flex flex-col min-h-0">
          <header className="flex items-center gap-3 p-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-lg">WorldFace AI</h1>
              <p className="text-xs text-muted-foreground">Voice + text assistant</p>
            </div>
            <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Kiswahili</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => { if (speaking) stopSpeaking(); setAutoSpeak((v) => !v); }} title={autoSpeak ? 'Voice on' : 'Voice off'}>
              {autoSpeak ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-6 text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold">
                    {language === 'sw' ? 'Karibu WorldFace AI 👋' : 'Welcome to WorldFace AI 👋'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'sw' ? 'Ongea au andika — nitakusaidia' : 'Speak or type — I\'m here to help'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {suggestions.map((s) => (
                    <Button key={s} variant="outline" size="sm" className="text-xs h-auto py-2 whitespace-normal text-left" onClick={() => send(s)}>{s}</Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs"><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2">
                      <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                    </div>
                  ) : m.content}
                  {m.role === 'assistant' && m.content && !busy && (
                    <button className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1" onClick={() => speaking ? stopSpeaking() : speak(m.content)}>
                      {speaking ? <><Square className="h-3 w-3" /> Stop</> : <><Volume2 className="h-3 w-3" /> Play</>}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {busy && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 mt-1"><AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            {recording && (
              <div className="mb-2 flex items-center justify-center gap-2 text-sm text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                {language === 'sw' ? 'Ninasikiliza...' : 'Listening...'}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Button
                type="button"
                size="icon"
                variant={recording ? 'destructive' : 'outline'}
                onClick={recording ? stopRecording : startRecording}
                disabled={busy || transcribing}
                title="Voice"
              >
                {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={language === 'sw' ? 'Andika ujumbe...' : 'Type a message...'}
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
                disabled={busy || recording}
              />
              <Button onClick={() => send()} disabled={!input.trim() || busy || recording} size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
