# OrderCare

An AI customer-support agent embedded directly in an e-commerce order page. Because the agent already knows which order the customer is looking at, the customer never has to repeat order details — they just ask "where's my package?" or upload a photo of a cracked screen.

Built for the AI Tinkerers hackathon.

## What it does

- **Tracking** — the agent looks up live status, location and ETA and renders a tracking card in the chat.
- **Product issues** — the customer describes a problem (optionally with a photo). The agent opens a support case and checks return/replacement eligibility.
- **Photo triage** — uploaded photos are stored in Convex file storage and run through a vision model, which describes visible damage in cautious "appears consistent with" language rather than diagnosing.
- **Voice** — push-to-talk speech-to-text input and spoken replies (ElevenLabs). Every assistant reply is read aloud, typed or spoken.
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

4. Seed demo data (this **wipes** all OrderCare tables first):

   ```bash
   npm run seed
   ```

5. In another terminal, run the app and open <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Project layout

```
app/
  page.tsx                  My Orders list
  order/[orderId]/page.tsx  Order detail + support sidebar
  api/copilotkit/           CopilotKit runtime endpoint (OpenRouter-backed)
  api/analyze-image/        Vision pass over uploaded evidence photos
  api/transcribe/           Speech-to-text (ElevenLabs)
  api/tts/                  Text-to-speech (ElevenLabs)
components/
  SupportPanel.tsx          Agent context, actions, and photo upload
  ReplacementConfirmCard.tsx  Confirm/cancel UI for the replacement action
  SpokenReplies.tsx         Reads assistant replies aloud
  cards.tsx                 Tracking and eligibility cards
lib/
  prompt.ts                 Agent system prompt and guardrails
  openrouter.ts             Shared OpenRouter client and model setting
convex/
  schema.ts                 orders, products, supportCases, replacements, trackingEvents
  customer.ts               Current-customer resolution and order ownership checks
  orders.ts / tracking.ts / supportCases.ts / returns.ts
  seed.ts                   Demo data
```

Each Convex module is scoped to one capability (tracking, support cases, returns), and every function checks that the order belongs to the current customer before reading or writing it.

## Demo identity

There is no sign-in yet. `convex/customer.ts` resolves every request to the demo customer `C102` **on the server** — clients never pass a customer ID. To add real auth, configure a provider in `convex/auth.config.ts` and change `getCurrentCustomerId` to derive the customer from `ctx.auth.getUserIdentity()`; the ownership checks everywhere else stay as they are.
