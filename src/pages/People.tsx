import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageCircle, Loader2 } from 'lucide-react';

const People = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: people, isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user!.id)
        .order('display_name');
      return data ?? [];
    },
    enabled: !!user,
  });

  const filtered = people?.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(s) ||
      p.username?.toLowerCase().includes(s) ||
      p.location?.toLowerCase().includes(s) ||
      p.instagram_url?.toLowerCase().includes(s) ||
      p.twitter_url?.toLowerCase().includes(s) ||
      p.telegram_url?.toLowerCase().includes(s)
    );
  }) ?? [];

  const startConversation = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('start_direct_conversation', {
        other_user_id: otherUserId,
      });
      if (error) throw error;
      navigate(`/messages/${data}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-heading font-bold">Discover People</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, @username, or social handle..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? 'No people found matching your search.' : 'No other members yet. Invite your friends!'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((person) => {
              const initials = person.display_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <Card key={person.id} className="glass-card hover:shadow-elevated transition-shadow animate-fade-in">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={person.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-heading">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{person.display_name || 'Anonymous'}</h3>
                      {person.location && (
                        <p className="text-sm text-muted-foreground">📍 {person.location}</p>
                      )}
                      {person.bio && (
                        <p className="text-sm text-muted-foreground truncate">{person.bio}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startConversation(person.user_id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default People;
