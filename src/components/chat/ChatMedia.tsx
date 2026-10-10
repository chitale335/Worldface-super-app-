import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function extractPath(mediaUrl: string): string {
  // If it's a full public URL from the old bucket, extract the path after /chat-media/
  const marker = '/chat-media/';
  const idx = mediaUrl.indexOf(marker);
  if (idx >= 0) return mediaUrl.slice(idx + marker.length);
  return mediaUrl;
}

export function useSignedChatMediaUrl(mediaUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!mediaUrl) { setUrl(null); return; }
    const path = extractPath(mediaUrl);
    supabase.storage.from('chat-media').createSignedUrl(path, 60 * 60).then(({ data }) => {
      if (active) setUrl(data?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [mediaUrl]);
  return url;
}

export function ChatImage({ mediaUrl, className }: { mediaUrl: string; className?: string }) {
  const url = useSignedChatMediaUrl(mediaUrl);
  if (!url) return <div className={className} style={{ minHeight: 120, background: 'rgba(0,0,0,0.05)' }} />;
  return <img src={url} alt="attachment" className={className} loading="lazy" />;
}

export function ChatAudio({ mediaUrl, className }: { mediaUrl: string; className?: string }) {
  const url = useSignedChatMediaUrl(mediaUrl);
  if (!url) return null;
  return <audio controls src={url} className={className} />;
}
