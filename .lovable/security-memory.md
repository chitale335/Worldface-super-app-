# Security Memory

WorldFace is an authenticated super app (social, chat, calls, wallet). All sensitive tables have RLS scoped to auth.uid() or membership tables; profiles are publicly readable by design (social discovery).

## Must never happen
- A user joining a private conversation they were not added to by the creator.
- AI edge functions (enhance-image, generate-studio-image, nexa-ai) being callable by unauthenticated visitors — they cost paid credits and must require a valid JWT.
- Roles being stored on profiles. Use the user_roles table + has_role() definer function.

## Accepted / intentional
- Many SECURITY DEFINER helpers exist (has_role, transfer_coins, start_direct_conversation, reward triggers, notification triggers). Each validates auth.uid() internally; do not flag the generic "definer executable" lints unless a specific function lacks an internal auth check.
- profiles, posts, comments, hashtags, founder_* tables are publicly readable on purpose (social feed + landing).
- Public storage buckets (avatars, post media) are intentionally public-read.
