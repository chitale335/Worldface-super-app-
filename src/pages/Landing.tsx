import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe, Sparkles, Zap, CreditCard, Image as ImageIcon, BarChart3, ArrowRight, Brain } from 'lucide-react';
import heroBrain from '@/assets/ai-brain-hero.jpg';

const features = [
  { icon: Globe, title: 'AI Websites', desc: 'Tengeneza tovuti kamili kwa sentensi moja.' },
  { icon: Sparkles, title: 'Content Studio', desc: 'Andika posts, captions na scripts mara moja.' },
  { icon: Zap, title: 'Automation', desc: 'Workflows zinazojiendesha 24/7 bila wewe.' },
  { icon: CreditCard, title: 'Payments', desc: 'M-Pesa, kadi na crypto — zote sehemu moja.' },
  { icon: ImageIcon, title: 'AI Media', desc: 'Picha, video na audio za studio quality.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Pata insights za AI kuhusu watumiaji wako.' },
];

const steps = [
  { n: '01', title: 'Jiunge', desc: 'Ingiza email yako kupata early access ya bure.' },
  { n: '02', title: 'Chagua zana', desc: 'Teua AI tools unazohitaji — websites, media au automation.' },
  { n: '03', title: 'Lansha', desc: 'Anza kutumia kwa dakika moja. Bila code, bila usumbufu.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading font-bold tracking-tight">NexaAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/payments" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
              <span>💳</span> NexaPay
            </a>
          </nav>
          <Button asChild size="sm" className="bg-gradient-to-r from-primary to-cyan text-white border-0">
            <a href="#early-access">Early Access</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3 w-3" /> Powered by NexaAI Engine
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
              Akili moja.{' '}
              <span className="bg-gradient-to-r from-primary via-cyan to-emerald bg-clip-text text-transparent">
                Ulimwengu mzima wa AI.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              NexaAI inakusaidia kuunda websites, content, media na payments — yote kwa lugha rahisi. Hakuna code. Hakuna mipaka.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-cyan text-white border-0 shadow-glow">
                <a href="#early-access">Pata Early Access <ArrowRight className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Tazama App</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/30 via-cyan/20 to-transparent blur-3xl rounded-full" />
            <img
              src={heroBrain}
              alt="AI brain neural network"
              width={1536}
              height={1024}
              className="relative rounded-2xl border border-border/40 shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Kila kitu unachohitaji</h2>
          <p className="text-muted-foreground">Ecosystem moja, AI tools sita zenye nguvu.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="group p-6 bg-card/60 backdrop-blur border-border/50 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-cyan/20 border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Inavyofanya kazi</h2>
          <p className="text-muted-foreground">Hatua tatu rahisi. Dakika moja.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="relative p-8 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50">
              <div className="text-5xl font-heading font-bold bg-gradient-to-br from-primary to-cyan bg-clip-text text-transparent mb-4">{n}</div>
              <h3 className="font-heading font-semibold text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Early Access CTA */}
      <section id="early-access" className="container mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-cyan/10 to-emerald/10 p-10 md:p-16 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan/30 rounded-full blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/20 border border-amber/40 text-xs font-medium text-amber mb-5">
              🎁 Limited Early Access
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">Kuwa wa kwanza kuijaribu.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Jiunge na waitlist ya NexaAI sasa upate access ya bure mara baada ya kuzinduliwa.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-cyan text-white border-0 shadow-glow text-base h-12 px-8">
              <a href="https://worldface.lovable.app" target="_blank" rel="noopener noreferrer">
                Join Waitlist <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        © 2026 NexaAI · WorldFace Ecosystem
      </footer>
      {/* NexaPay banner */}
      <section className="container mx-auto px-6 pb-10">
        <a
          href="/payments"
          className="block rounded-2xl p-6 md:p-8 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 text-white shadow-2xl hover:shadow-amber-500/30 transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                <span>💳</span> NexaPay
              </div>
              <p className="text-white/90 text-sm md:text-base mt-1">
                Tuma, pokea, na lipia kila kitu ndani ya WorldFace ecosystem.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm font-semibold text-sm">
              Fungua NexaPay <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </a>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        © 2026 NexaAI · WorldFace Ecosystem
      </footer>
    </div>
  );
};

export default Landing;
