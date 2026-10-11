# OrderCare

An AI customer-support agent embedded directly in an e-commerce order page. Because the agent already knows which order the customer is looking at, the customer never has to repeat order details — they just ask "where's my package?" or upload a photo of a cracked screen.

Built for the AI Tinkerers hackathon.

## What it does

- **Shop and checkout** — browse products, add them to a cart and place an order (demo checkout, no payment). Each cart line becomes its own order, and new orders move from placed to delivered over about 90 seconds so testers can try every support flow on their own purchase.
- **Tracking** — the agent looks up live status, location and ETA and renders a tracking card in the chat.
- **Product issues** — the customer describes a problem (optionally with a photo). The agent opens a support case and checks return/replacement eligibility.
- **Photo triage** — uploaded photos are stored in Convex file storage and run through a vision model, which describes visible damage in cautious "appears consistent with" language rather than diagnosing.
- **Voice** — live dictation: while the mic is on, your words stream into the chat box as you speak (ElevenLabs realtime speech-to-text), and nothing is sent until you press Enter. Every assistant reply is read aloud (ElevenLabs text-to-speech).
- **Replacements (human-in-the-loop)** — the agent can propose a replacement, but nothing is created until the customer clicks **Confirm Replacement**. Duplicate replacements for the same order are rejected server-side.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Agent UI & actions | CopilotKit (`CopilotSidebar`, `useCopilotAction`) |
| LLM | Anthropic Claude via OpenRouter (OpenAI-compatible API) |
| Voice | ElevenLabs speech-to-text and text-to-speech |
| Backend & DB | Convex |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Convex (creates/links a deployment and writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`):

   ```bash
   npx convex dev
   ```

3. Add your API keys to `.env.local`:

   ```bash
   OPENROUTER_API_KEY=sk-or-...
   OPENROUTER_MODEL=anthropic/claude-sonnet-5.5   # optional, this is the default; must support vision
   ELEVENLABS_API_KEY=...                         # for voice input and spoken replies
   ELEVENLABS_VOICE_ID=...                        # optional
   ```

4. Set the Convex Auth keys on the deployment (one time per deployment). Generate `JWT_PRIVATE_KEY` and `JWKS` as described in the [Convex Auth manual setup](https://labs.convex.dev/auth/setup/manual), then:

   ```bash
   npx convex env set "JWT_PRIVATE_KEY=<key>"
   npx convex env set "JWKS=<jwks>"
   npx convex env set SITE_URL=http://localhost:3000
   ```

5. Load the product catalog (this **wipes** all OrderCare order data first):

   ```bash
   npm run seed
   ```

6. In another terminal, run the app and open <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Project layout

```
app/
  page.tsx                  Shop
  cart/page.tsx             Cart and checkout
  orders/page.tsx           My Orders list
  order/[orderId]/page.tsx  Order detail + support sidebar
  api/copilotkit/           CopilotKit runtime endpoint (OpenRouter-backed)
  api/analyze-image/        Vision pass over uploaded evidence photos
  api/scribe-token/         Single-use token for live speech-to-text (ElevenLabs)
  api/tts/                  Text-to-speech (ElevenLabs)
components/
  SiteHeader.tsx            Navigation and cart count
  SupportPanel.tsx          Agent context, actions, and photo upload
  ChatInput.tsx             Chat input with the live-dictation mic
  ReplacementConfirmCard.tsx  Confirm/cancel UI for the replacement action
  SpokenReplies.tsx         Reads assistant replies aloud
  cards.tsx                 Tracking and eligibility cards
lib/
  cart.ts                   Per-browser cart (localStorage)
  useLiveTranscription.ts   Mic capture and ElevenLabs realtime transcription
  shop.ts                   Price, date and status formatting
  prompt.ts                 Agent system prompt and guardrails
  openrouter.ts             Shared OpenRouter client and model setting
convex/
  schema.ts                 orders, products, supportCases, replacements, trackingEvents
  auth.ts / auth.config.ts  Convex Auth with the Anonymous provider
  customer.ts               Current-customer resolution and order ownership checks
  orders.ts                 Order list/detail, checkout, simulated delivery
  products.ts               Product catalog
  tracking.ts / supportCases.ts / returns.ts
  seed.ts                   Product catalog (internal; run from the CLI)
```

Each Convex module is scoped to one capability (tracking, support cases, returns), and every function checks that the order belongs to the current customer before reading or writing it.

## Visitor identity

There is no login form. On first load, each browser is silently signed in as its own **anonymous user** (Convex Auth, `Anonymous` provider), and the token is kept in localStorage. Orders are stored against that user, so every visitor sees only the orders they placed. Clearing site data or switching browsers starts a fresh, empty account.

`convex/customer.ts` resolves the customer **on the server** from the auth token — clients never pass a customer ID. To add real sign-in later, add another provider in `convex/auth.ts`; the ownership checks everywhere else stay as they are.

## Hosting

When deploying to production, set `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` (your public URL) on the production Convex deployment as well, and run the seed there with `npx convex run seed:seed --prod`. Put a spending limit on the OpenRouter key, since anyone with the link can chat with the agent.
