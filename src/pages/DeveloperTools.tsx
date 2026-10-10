import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  Database,
  ShieldCheck,
  KeyRound,
  Rocket,
  TerminalSquare,
  ArrowRight,
  Braces,
} from 'lucide-react';

const tools = [
  { name: 'API', description: 'Connect apps and services to WorldFace programmatically.', icon: Braces, color: 'from-cyan-500 to-blue-500', link: '/settings' },
  { name: 'SDKs', description: 'Use official tools to build faster and integrate with confidence.', icon: Code2, color: 'from-violet-500 to-purple-500', link: '/settings' },
  { name: 'Webhooks', description: 'Listen for events and automate reactions in real time.', icon: Rocket, color: 'from-emerald-500 to-teal-500', link: '/settings' },
  { name: 'Security', description: 'Manage keys, auth settings, and operational safeguards.', icon: ShieldCheck, color: 'from-amber-500 to-orange-500', link: '/settings' },
  { name: 'Data Layer', description: 'Understand storage, sync, and app data architecture.', icon: Database, color: 'from-pink-500 to-rose-500', link: '/settings' },
  { name: 'Debug Console', description: 'Inspect app state, logs, and diagnostics for troubleshooting.', icon: TerminalSquare, color: 'from-slate-600 to-slate-800', link: '/settings' },
];

const DeveloperTools = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3">Developer center</Badge>
            <h1 className="text-3xl md:text-4xl font-heading font-bold gradient-text">Developer Tools</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Build, test, secure, and ship integrations with the WorldFace platform.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings">
              <KeyRound className="h-4 w-4 mr-2" />
              Security settings
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Platform access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Connect to app APIs and authenticated services.</p>
              <p>Use secure tokens and environment controls.</p>
              <p>Track release and environment health easily.</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Protect keys, validate webhooks, and enforce app-level safeguards before exposing features publicly.
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-amber-500" />
                Debugging
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Inspect logs, state, and environment behavior during development and QA validation.
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map(({ name, description, icon: Icon, color, link }) => (
            <Link key={name} to={link} className="group">
              <Card className="glass-card h-full transition hover:border-primary/50 hover:shadow-lg">
                <CardContent className="p-5 space-y-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-bold">{name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Open section
                    <ArrowRight className="h-4 w-4 ml-2 transition group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default DeveloperTools;
