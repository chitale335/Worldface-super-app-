import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Video,
  Mic,
  Bot,
  Trophy,
  BarChart3,
  Users,
  ArrowRight,
  Wand2,
} from 'lucide-react';

const tools = [
  { name: 'Studio', description: 'Create and edit content for short-form videos and stories.', icon: Video, color: 'from-violet-600 to-purple-600', link: '/studio' },
  { name: 'Go Live', description: 'Start livestreams, host sessions, and build audience in real time.', icon: Mic, color: 'from-red-500 to-orange-500', link: '/live' },
  { name: 'NexaAI', description: 'Use AI assistant tools for content, ideation, and support.', icon: Bot, color: 'from-cyan-500 to-blue-500', link: '/ai' },
  { name: 'Rewards', description: 'Track coins, XP, unlocks, and creator achievement milestones.', icon: Trophy, color: 'from-amber-500 to-yellow-500', link: '/rewards' },
  { name: 'Analytics', description: 'View reach, engagement, and audience growth in one place.', icon: BarChart3, color: 'from-emerald-500 to-teal-500', link: '/payouts/analytics' },
  { name: 'Communities', description: 'Grow your brand with creator communities and groups.', icon: Users, color: 'from-pink-500 to-rose-500', link: '/communities' },
];

const CreatorTools = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3">Creator workspace</Badge>
            <h1 className="text-3xl md:text-4xl font-heading font-bold gradient-text">Creator Tools</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to create, grow, analyze, and monetize your audience.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings">
              <Wand2 className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Creator overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Produce content faster.</p>
              <p>Grow communities with better engagement.</p>
              <p>Monetize through payouts, rewards, and live experiences.</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Growth stats
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Track reach, engagement, and monetization performance across your content and communities.
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Earn coins, XP, unlock achievements, and compare position on creator leaderboards.
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
                    Open tool
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

export default CreatorTools;
