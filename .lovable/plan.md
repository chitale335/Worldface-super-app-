# WorldFace Communities — Implementation Plan

A big module. I'll ship it in **4 phases** so each phase is reviewable, testable, and doesn't block the app. Nothing existing gets removed.

## Phase 1 — Foundation (core groups + posts + membership)
**Tables** (all with RLS + GRANTs + `updated_at` triggers):
- `communities` — name, slug (unique), description, cover_url, avatar_url, type (enum: public/private/secret/business/school/fan_club/gaming/marketplace/local/verified_org), category, language, country, city, is_paid, monthly_price_coins, member_count, post_count, verified, owner_id
- `community_members` — community_id, user_id, role (enum: owner/admin/moderator/editor/expert/member/guest), status (active/pending/banned), joined_at
- `community_posts` — community_id, user_id, content, media_urls[], media_types[], poll (jsonb), is_pinned, is_announcement, like_count, comment_count
- `community_post_likes`, `community_post_comments`
- `community_join_requests` (for private/secret)
- `community_invites` (share links w/ token)

**Security helpers (SECURITY DEFINER)**:
- `is_community_member(_c uuid, _u uuid)`, `community_role(_c, _u)`, `can_view_community(_c, _u)`, `join_community(_c)`, `leave_community(_c)`

**RLS matrix**:
- Public: anyone reads community + posts; members write.
- Private: anyone sees community card; only members read posts; must request/be invited.
- Secret: only members can see it exists.
- Business/school/fan_club/etc = variants of public with extra metadata.

**UI**:
- `/communities` — discover (grid, filters by type/category/country)
- `/communities/new` — create
- `/communities/:slug` — feed, about, members, share/copy-link button
- `CommunityCard`, `CommunityHeader`, `JoinButton`, `RoleBadge`
- Integrate into `AppLayout` nav next to Feed.

## Phase 2 — Content & Real-time
- Community **stories** (24h), **reels**, **albums**, **file library**, **announcements**, **pinned posts**.
- Rich comments (GIF picker, voice notes, reactions).
- **Hashtags & topics** per community.
- **Group chat** per community (reuse `conversations` with `community_id` link) + **broadcast channels** (announce-only rooms).
- **Voice rooms** & **live streaming** (WebRTC signaling table + placeholder UI; hooks to existing `LiveStream.tsx`).
- **Events & calendar** table + RSVP.
- **AI content search** edge function (Lovable AI + embeddings on posts).

## Phase 3 — Monetization, Business, Roles
- **NexaPay integration**: paid communities, monthly memberships (`community_subscriptions`), one-off donations, tips on posts (reuses `wallets` + new `community_transactions`), ticketed events, premium (gated) posts.
- **Community shop** / product catalog / service booking / jobs board / business directory / community ads — one shared `community_listings` table with `kind` enum to keep the schema tight.
- **Role management UI** (owner→guest) with permission checks in RLS via `community_role()`.
- **Moderator tools**: report queue (reuse `reports` table), ban/mute, remove content.

## Phase 4 — AI, Rewards, Dashboard
- **Edge functions** (all JWT-verified, Lovable AI Gateway, `google/gemini-3-flash-preview`):
  - `community-moderate` (spam / fake-account / toxicity scoring on new posts)
  - `community-categorize` (auto-tag posts)
  - `community-summary` (daily/weekly digest)
  - `community-welcome` (personalized welcome DM to new members)
  - `community-recommend` (suggest communities to a user)
  - `community-translate` (already have `translate-text`; wire into chat)
  - `community-assistant` (per-community AI chat with context)
- **Rewards**: extend `award_xp()` to award XP for quality posts, invites (via invite token redemption), helpful answers (marked by OP), completed challenges (`community_challenges` table).
- **Dashboard** at `/communities/:slug/dashboard` (owner/admin only): growth chart, member insights, engagement, revenue (from `community_transactions`), content performance, moderator queue.

## Technical Notes
- All community routes gated by `can_view_community()`.
- Slugs unique + generated from name; shareable URL `/@:slug` alias + copy-link + native `navigator.share`.
- Media: reuse `posts` bucket with `community/{id}/…` prefix; new private `community-files` bucket for the file library (signed URLs).
- Realtime: enable `supabase_realtime` on `community_posts`, `community_messages`, `community_voice_participants`.
- Design tokens only (navy/slate palette, Space Grotesk + Inter). Mobile-first.
- No existing tables/policies modified except adding a nullable `community_id` FK on `conversations` and `messages` (safe additive change).

## Deliverable per phase
Each phase = 1 migration + components + 1 route bundle + brief manual test steps. I'll pause after each for your OK before continuing.

---

**Reply "go phase 1"** (or say what to change) and I'll start building.
