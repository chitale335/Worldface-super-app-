import { CulturalVerseLayout } from './CulturalVerseLayout';
import { Sparkles } from 'lucide-react';

interface Props { title: string; desc: string }

export default function ComingSoon({ title, desc }: Props) {
  return (
    <CulturalVerseLayout>
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-violet flex items-center justify-center mb-4 shadow-glow">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2 gradient-text">{title}</h1>
        <p className="text-muted-foreground">{desc}</p>
        <p className="text-xs text-muted-foreground/70 mt-6">This feature ships in the next CulturalVerse phase.</p>
      </div>
    </CulturalVerseLayout>
  );
}
