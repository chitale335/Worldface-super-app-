import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Languages, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS_MENTOR = [
  'How are Maasai weddings conducted?',
  'What is the history of the Luo people?',
  'Explain the meaning of Ubuntu',
  'What is the significance of Diwali?',
];
const SUGGESTIONS_LANG = [
  'Teach me 5 basic Swahili greetings',
  'Translate "How are you?" to French',
  'What does "Hakuna matata" mean?',
  'Common Yoruba proverbs and meanings',
];

export default function CulturalMentor() {
  const [params] = useSearchParams();
  const mode = (params.get('mode') === 'language' ? 'language' : 'mentor') as 'mentor' | 'language';
  const country = params.get('country') || undefined;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cultural-mentor`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next, mode, country }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 429) toast.error('Rate limit reached. Try again shortly.');
        else if (res.status === 402) toast.error('AI credits exhausted. Please top up.');
        else toast.error('Failed to reach AI');
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              acc += delta;
              setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { role: 'assistant', content: acc }; return copy; });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = mode === 'language' ? SUGGESTIONS_LANG : SUGGESTIONS_MENTOR;

  return (
    <CulturalVerseLayout>
      <div className="max-w-3xl mx-auto p-4 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-violet/10 border border-border/50 mb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center">
            {mode === 'language' ? <Languages className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h2 className="font-heading font-semibold">{mode === 'language' ? 'AI Language Companion' : 'AI Cultural Mentor'}</h2>
            <p className="text-xs text-muted-foreground">{mode === 'language' ? 'Learn languages, translate, understand proverbs' : 'Ask about any culture, tradition, or history'}{country ? ` · ${country}` : ''}</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 rounded-2xl bg-card/30 p-4 border border-border/50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Try one of these:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-card border border-border/50 hover:border-primary/50 transition">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1">
                    <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin" /></div></div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={mode === 'language' ? 'Ask to translate, learn a phrase...' : 'Ask about a culture, custom, or history...'}
            rows={1}
            className="resize-none min-h-[44px]"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </CulturalVerseLayout>
  );
}
