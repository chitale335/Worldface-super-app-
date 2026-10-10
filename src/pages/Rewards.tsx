import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Coins, Heart, Sparkles, Lock } from 'lucide-react';
import {
  useAllBadges,
  useCreatorStats,
  useLeaderboard,
  useUserBadges,
  xpForLevel,
} from '@/hooks/useRewards';
import { formatCount } from '@/lib/feed';

const Rewards = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCreatorStats(user?.id);
  const { data: myBadges } = useUserBadges(user?.id);
  const { data: allBadges } = useAllBadges();
  const { data: coinsBoard, isLoading: boardLoading } = useLeaderboard('coins', 50);
  const { data: xpBoard } = useLeaderboard('xp', 50);

  const level = stats?.level ?? 1;
  const xp = Number(stats?.xp ?? 0);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp
    ? Math.min(100, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    : 0;
  const xpToNext = Math.max(0, nextLevelXp - xp);

  const earnedIds = new Set((myBadges ?? []).map((b) => (b.badges as { id: string } | null)?.id).filter(Boolean));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Creator Rewards</h1>
        </div>

        {/* Level card */}
        <Card className="glass-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
          <CardContent className="p-6 relative">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground">Your level</p>
                    <p className="text-5xl font-heading font-bold text-primary">Lv {level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total XP</p>
                    <p className="text-2xl font-heading font-bold">{formatCount(xp)}</p>
                  </div>
                </div>
                <div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {xpToNext > 0
                      ? `${formatCount(xpToNext)} XP to level ${level + 1}`
                      : 'Max progress recorded'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
                    <Coins className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Coins received</p>
                      <p className="font-bold">{formatCount(Number(stats?.total_coins_received ?? 0))}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Likes received</p>
                      <p className="font-bold">{formatCount(Number(stats?.total_likes_received ?? 0))}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to earn */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> How to earn XP
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="font-bold text-primary">+10</p>
              <p className="text-xs text-muted-foreground">per post</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="font-bold text-primary">+2</p>
              <p className="text-xs text-muted-foreground">per like</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="font-bold text-primary">+3</p>
              <p className="text-xs text-muted-foreground">per comment</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="font-bold text-primary">+1</p>
              <p className="text-xs text-muted-foreground">per coin gift</p>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">
              Badges{' '}
              <span className="text-muted-foreground font-normal">
                ({earnedIds.size}/{allBadges?.length ?? 0})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(allBadges ?? []).map((b) => {
                const earned = earnedIds.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={`rounded-xl p-4 text-center border transition-all ${
                      earned
                        ? 'bg-gradient-to-br from-primary/15 to-accent/15 border-primary/30'
                        : 'bg-muted/30 border-border opacity-60'
                    }`}
                  >
                    <div className="text-3xl mb-1 relative inline-block">
                      {b.icon}
                      {!earned && (
                        <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{b.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Top creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="coins">
              <TabsList className="grid grid-cols-2 w-full sm:w-64 mb-4">
                <TabsTrigger value="coins">By coins</TabsTrigger>
                <TabsTrigger value="xp">By XP</TabsTrigger>
              </TabsList>
              <TabsContent value="coins">
                <LeaderboardList
                  rows={coinsBoard ?? []}
                  loading={boardLoading}
                  metric="coins"
                  meUserId={user?.id}
                />
              </TabsContent>
              <TabsContent value="xp">
                <LeaderboardList
                  rows={xpBoard ?? []}
                  loading={boardLoading}
                  metric="xp"
                  meUserId={user?.id}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

type LeaderRow = {
  user_id: string;
  xp: number | string;
  level: number;
  total_coins_received: number | string;
  profile: { display_name: string | null; avatar_url: string | null } | null;
};

const LeaderboardList = ({
  rows,
  loading,
  metric,
  meUserId,
}: {
  rows: LeaderRow[];
  loading: boolean;
  metric: 'coins' | 'xp';
  meUserId?: string;
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-sm">No creators yet</p>;
  }
  return (
    <div className="space-y-1">
      {rows.map((row, idx) => {
        const value =
          metric === 'coins' ? Number(row.total_coins_received) : Number(row.xp);
        const isMe = row.user_id === meUserId;
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
        const initials =
          row.profile?.display_name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';
        return (
          <Link
            key={row.user_id}
            to={`/u/${row.user_id}`}
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
              isMe ? 'bg-primary/10 border border-primary/30' : ''
            }`}
          >
            <div className="w-8 text-center text-sm font-bold text-muted-foreground">
              {medal ?? `#${rank}`}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={row.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {row.profile?.display_name ?? 'User'}
                {isMe && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Level {row.level}</p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {metric === 'coins' ? '🪙' : '✨'} {formatCount(value)}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
};

export default Rewards;
