import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, Loader2, Sparkles, Shield, Code, Globe, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import samwelImg from '@/assets/samwel-misori.jpg';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexa-ai`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || !line.trim()) continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

const NexaAI = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let accumulated = '';
    const upsert = (chunk: string) => {
      accumulated += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: accumulated } : m));
        }
        return [...prev, { role: 'assistant', content: accumulated }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || 'Failed to get response');
    }
  };

  const suggestions = [
    'What is WorldFace?',
    'How do coins work?',
    'How do I level up?',
    'What badges can I earn?',
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-5rem)] lg:h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg">NexaAI</h1>
            <p className="text-xs text-muted-foreground">Your WorldFace assistant</p>
          </div>
          <Sparkles className="h-4 w-4 text-primary ml-auto" />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 text-center px-2 py-8">
              {/* Creator Card */}
              <Card className="w-full max-w-sm bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 overflow-hidden">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-primary to-violet-500 rounded-full blur-sm opacity-60" />
                    <img
                      src={samwelImg}
                      alt="Samwel Misori — Creator of WorldFace AI"
                      className="relative w-24 h-24 rounded-full object-cover border-2 border-background"
                    />
                  </div>
                  <h3 className="font-heading font-bold text-lg">Samwel Misori</h3>
                  <p className="text-xs text-primary font-medium mb-2">Creator & Lead AI Architect</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Visionary behind NexaAI & the WorldFace ecosystem — building the future of social connectivity, payments, and AI-driven community.
                  </p>
                  <div className="flex gap-3 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Brain className="w-4 h-4 text-violet-400 mb-0.5" />
                      <span className="text-[10px]">AI</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Code className="w-4 h-4 text-cyan-400 mb-0.5" />
                      <span className="text-[10px]">Dev</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Globe className="w-4 h-4 text-emerald-400 mb-0.5" />
                      <span className="text-[10px]">Global</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Shield className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span className="text-[10px]">Security</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-xl font-heading font-bold mb-1">Welcome to NexaAI 🧠</h2>
                <p className="text-sm text-muted-foreground">Ask me anything about WorldFace!</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 whitespace-normal text-left"
                    onClick={() => { setInput(s); }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask NexaAI anything…"
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button onClick={send} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NexaAI;
