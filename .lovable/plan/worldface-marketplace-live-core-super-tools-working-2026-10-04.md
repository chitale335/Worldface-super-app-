# WorldFace: Marketplace live + core Super Tools working

## Goal
Replace demo marketplace and the main PLANNED tools with working features that save real data, then publish.

## What gets built (phase 1)
1. **Marketplace (live)**: sellers create listings with photos, price, category and location. Buyers can search, filter and message the seller through the real Messenger.
2. **Store & Products**: each seller has a store page (`/store/:username`) and a "My Products" manager where they can add, edit, hide and delete products.
3. **Orders**: buyers place orders. Sellers see incoming orders and move them through Pending, Paid, Shipped/Delivered, Completed or Cancelled. Buyers can see their order history.
4. **Payments**: orders are paid from the WorldFace Wallet balance. Each payment records a transaction and an audit entry. M-PESA, card and Stripe payments stay marked "needs provider" until you supply real provider keys. They will not be shown as live before then.
5. **Referral**: real tracking. A `?ref=CODE` link is saved when someone signs up. You can see who you invited, who joined, and what you earned.
6. **Earnings**: one dashboard that adds up store sales, creator payouts and referral rewards.
7. **API Keys**: create, name, revoke and rotate keys. Each key is shown once and stored only as a hash. Usage is logged.
8. **Webhooks**: add endpoint URLs for events (order.created, order.paid, payment.received). Each webhook gets a signing secret, and deliveries are signed. You can see a delivery log and send a test event.
9. **MCP**: a status page that shows the connection URL and the available tools. It also adds tools for listing your orders and products.
10. **Super Tools**: these items change from PLANNED to LIVE once they work. Anything not built yet keeps its honest label.

## Publish & GitHub
- After the build passes and I've tested it, I'll publish the app so the installable phone app (PWA) and MCP run at worldface-kotekule.lovable.app.
- **I can't connect GitHub for you.** You need to do it in the editor: Plus (+) → GitHub → Connect project → Create Repository. After that, every change syncs automatically.

## Technical details
- New tables: stores, products, orders, order_items, referrals, api_keys, webhooks, webhook_deliveries. Each includes GRANTs, RLS (owner/buyer/seller scoped) and created_at/updated_at.
- Edge functions:
  - `marketplace-checkout`: debits the wallet atomically through a security-definer function, then emits webhooks.
  - `api-keys`: generates keys and stores SHA-256 hashes.
  - `webhook-dispatch`: signs deliveries with HMAC-SHA256.
- The existing `/marketplace` mock data is replaced with real data. A reusable store/product component set will be added.
- Text is in English and Swahili. Every screen gets loading, empty and error states and is built mobile-first.

## Later phases (keep their honest status)
Business/Company/Enterprise pages, invoices, subscriptions, 2FA, and reviews & ratings.
