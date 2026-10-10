import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SITE = "https://worldface-kotekule.lovable.app";

export default function MyIdentity() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ username: string | null; display_name: string | null; verified: boolean } | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0, posts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, f1, f2, ps] = await Promise.all([
        supabase.from("profiles").select("username, display_name, verified").eq("user_id", user.id).maybeSingle(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setProfile(p.data ?? null);
      setCounts({ followers: f1.count ?? 0, following: f2.count ?? 0, posts: ps.count ?? 0 });
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;
  const profileCode = "WF-" + user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const profileLink = `${SITE}/u/${user.id}`;
  const referralLink = `${SITE}/auth?ref=${profileCode}`;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "My WorldFace profile", url: profileLink }); } catch { /* cancelled */ }
    } else copy(profileLink, "Profile link");
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={() => copy(value, label)} aria-label={`Copy ${label}`}><Copy className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 space-y-4">
        <h1 className="text-2xl font-heading font-bold gradient-text">My WorldFace ID</h1>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="glass-elevated rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
              <div className="rounded-xl bg-background p-3"><QRCodeSVG value={profileLink} size={168} /></div>
              <p className="font-heading text-lg font-semibold">{profile?.display_name ?? "WorldFace user"} {profile?.verified && "✔️"}</p>
              <p className="text-sm text-muted-foreground">@{profile?.username ?? "no-username"}</p>
              <div className="grid w-full grid-cols-3 gap-2 text-sm">
                <Link to="/people" className="rounded-lg bg-muted/40 py-2"><b>{counts.followers}</b><br />Followers</Link>
                <Link to="/people" className="rounded-lg bg-muted/40 py-2"><b>{counts.following}</b><br />Following</Link>
                <Link to="/profile" className="rounded-lg bg-muted/40 py-2"><b>{counts.posts}</b><br />Posts</Link>
              </div>
              <Button onClick={share} className="w-full"><Share2 className="mr-2 h-4 w-4" />Share profile</Button>
            </div>
            <div className="glass-elevated rounded-2xl px-4 divide-y divide-border/50">
              <Row label="Profile ID" value={user.id} />
              <Row label="Username" value={profile?.username ? `@${profile.username}` : "Not set — add one in Settings"} />
              <Row label="Profile Code" value={profileCode} />
              <Row label="Profile link" value={profileLink} />
              <Row label="Referral link" value={referralLink} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Referral tracking and referral earnings are planned; the link is ready to share now.</p>
          </>
        )}
      </div>
    </AppLayout>
  );
}
