// Helpers for the social feed module

export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) ?? [];
  return Array.from(
    new Set(matches.map((m) => m.slice(1).toLowerCase()).filter((t) => t.length > 0 && t.length <= 50)),
  );
};

export const formatCount = (n: number | null | undefined): string => {
  const num = n ?? 0;
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(num < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};

export const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
};

export const renderCaption = (text: string | null | undefined): Array<{ type: 'text' | 'tag'; value: string }> => {
  if (!text) return [];
  const parts: Array<{ type: 'text' | 'tag'; value: string }> = [];
  const regex = /#([a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    parts.push({ type: 'tag', value: m[1].toLowerCase() });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });
  return parts;
};
