SHARE — SRMIST Campus Marketplace

A peer-to-peer platform for exchanging resources, services, and opportunities within the SRMIST student community.

Chosen Vertical: Campus Marketplace / Resource Exchange

 Overview

Colleges have a lot of untapped value floating around — unused textbooks, rarely-used electronics, unattended event tickets, notes/study materials, skills people could teach, and items people want to give away. Right now, students rely on scattered WhatsApp groups, expiring Instagram stories, and word-of-mouth to find any of it.

SHARE is a single, verified, student-only space where that value can actually be found and exchanged — built around the persona of an SRMIST student trying to buy, sell, request, or give away something on campus without the usual friction and guesswork.

Approach & Logic

The core design decision was to treat "exchange" as broader than buying and selling:

Five categories (Textbooks, Electronics, Services, Opportunities, Dorm Essentials) map directly to the different types of untapped value described in the challenge context — goods, skills, and opportunities all live in the same feed instead of being forced into a generic marketplace format.
The Wanted Board exists because supply-only listings miss half the problem — plenty of value goes untapped simply because the person who wants it has no way to broadcast that demand. The board lets a student post a specific need (e.g., "Wanted: Scientific Calculator") with a budget and urgency, inverting the usual listing logic.
The AI Campus Assistant is grounded in real SRMIST context (Tech Park, UB Building, Central Library) rather than generic chat, so its answers are actually usable by a student navigating campus — this is the "smart, dynamic assistant" and "logical decision-making based on context" the challenge asks for.
The AI Deal Checker applies category- and condition-aware logic to flag a listing as Great Deal, Fair Price, or Overpriced, giving students a fast, low-effort way to judge whether an exchange is fair before committing — decision support baked into the core flow, not a bolt-on feature.
Verification scoped to @srmist.edu.in was a deliberate trust decision: real-world usability for a campus exchange depends on knowing you're only ever dealing with fellow students.

 How the Solution Works
A student signs in with their @srmist.edu.in account.
They browse the live listing feed by category, or search directly.
To list something, they open the creation modal — Gemini helps auto-generate a keyword-optimized title and description from a short input, lowering the effort to post.
To find something specific that isn't listed yet, they post a request on the Wanted Board instead.
Before agreeing to a trade, either side can run the AI Deal Checker on a listing to sanity-check the price.
If they need help navigating campus or the platform itself, the AI Campus Assistant is available as a slide-over chat at any time.

Built With
Platform: Google AI Studio
AI: Gemini, with model fallback (Gemini 2.5 → 1.5 Flash) for the assistant and deal-checker, Deepseek and Claude for research and refinement purposes
Design system: Soft-Brutalist, Modern Retro — dark canvas, warm amber accents, tactile 2px borders

 Assumptions Made
Every user is a verified, currently-enrolled SRMIST student with an @srmist.edu.in email — no support for alumni, staff, or guest access.
Listings are for genuine on-campus exchange (buy, sell, request, teach, give away), not general e-commerce or off-campus resale.
Pricing benchmarks used by the AI Deal Checker are approximate and meant to guide, not guarantee, a fair trade — final agreement is always between the two students.
The platform assumes reasonable good faith between verified students; it does not currently handle disputes or payments directly.
🚀 Repository & Workflow
Public GitHub repository, single branch, with regular commits tracking progress from initial prototype to current state.
All project code for SHARE lives in this repository.
