# VIERCYS Hotels & Resorts — Codex Master Build Brief

You are the lead creative developer, senior product designer, full-stack engineer, and QA engineer for VIERCYS Hotels & Resorts. Build a complete, responsive, cinematic Greek-inspired luxury hotel reservation website, not a generic hotel template. Work directly in this repository. Do not merely outline a plan: create code, run checks, and report actual results.

## Product and brand
- Brand: VIERCYS Hotels & Resorts. Tagline: “Where Earth Meets the Sea.” Secondary promise: “You book the stay. We curate the experience.”
- Public-facing inspiration: contemporary Greek/Mediterranean luxury architecture, natural limestone, sculptural archways, warm sunlight, deep Aegean blue, refined editorial serif typography, real-looking architectural photography, restrained elegance. NEVER mention Virgo, Pisces, zodiac, or astrology in the product.
- VIERCYS is a hotel brand, not an Agoda-style marketplace. Main bookable property: VIERCYS Santorini. Preview destinations: Boracay, Amalfi, Bali, explicitly marked coming soon, not falsely bookable.
- Exactly 20 physical rooms at Santorini: 10 Essential (Economy), 6 Signature Suites (Deluxe), 4 Grand Sanctuaries (VIP). Store individual room records with unique numbers and category, capacity, rates, and amenities.
- Use PHP currency? NO: display configurable currency and sensible demo prices; avoid suggesting real prices for the fictional property. Seed a demo currency consistently and disclose sample pricing where relevant.

## Visual direction and interaction
- Cinematic discovery, effortless booking. Homepage must feel custom art-directed and immersive, not cards-on-beige. Strong photography and editorial composition, responsive desktop and mobile.
- Implement meaningful scroll-controlled animation with GSAP ScrollTrigger: immersive hero, arch-shaped mask/architectural passage reveal, pinned storytelling, parallax depth, horizontal destination gallery with accessible alternative, rich room transitions. Scroll backwards naturally. Use Lenis only if it improves performance and does not interfere with accessibility. Optional Three.js/React Three Fiber for a single purposeful architectural camera/3D moment if performance allows; provide high-quality fallback. Do not use random rotating objects or generic fade-in as substitute.
- Always-visible accessible booking CTA. Never trap scrolling or force animation to complete before booking. Respect prefers-reduced-motion, keyboard controls, semantic headings, contrast, mobile touch, optimized images, loading states.
- Create a coherent photographic art direction. Do not use empty colored arch placeholders. If custom hero imagery is not present, implement clear local asset paths under public/images and attractive temporary licensed image sources with documented replacement steps; do not falsely claim these are original VIERCYS photos. Design can use an original AI-generated image as reference, but do not assume that image exists in the repository until provided.
- Design system: limestone #F3EEE5, deep Aegean #233F4B, olive #737766, champagne #C6AD85, charcoal #292C28; high-contrast editorial serif plus modern legible sans; varied sophisticated section compositions, not repetitive grids.

## Core guest experience and pages
Build real navigable pages and flows, not just a homepage: home, destinations, Santorini property details, availability search, Smart Room Finder (optional and skippable), room results with filters, room details/gallery, compare up to three categories, Curate Your Escape optional extras, guest details, checkout with clearly simulated payment (never collect actual card data), booking success, My VIERCYS guest dashboard, reservation lookup/verification, modify and cancel booking, downloadable/printable receipt, editable daily itinerary, concierge, account sign-in/sign-up where useful. Fully responsive mobile experience with useful My Stay, itinerary, concierge and optional digital check-in prototype.
- Search by check-in/check-out and guest count. Validate dates and capacity. Prevent overlapping confirmed reservations for the same physical room, with server-side atomic availability validation to avoid race conditions.
- Smart Room Finder asks trip purpose and priorities, returns explainable recommendations among actually available rooms; no forced questionnaire.
- Room comparison covers capacity, size, views, amenities, and price.
- Extras: airport transfer, dining, sunset sailing, spa, breakfast, special requests. Update totals transparently; distinguish confirmed extras from approval requests.
- Checkout supports guest booking without mandatory account. Booking reference generated only on successful database commit. Show taxes/fees, terms and accurate booking/payment status.
- Booking modifications must recheck availability; cancellation must respect displayed policy and be confirmed by user. Guest booking lookup requires secure verified link/token or equivalent, not booking ID alone.
- AI itinerary: inputs dates, guest interests, pace, budget and confirmed extras; generates editable day-by-day timeline, distinguish suggestions from booked items, never invent verified opening hours, costs, or confirmations. Provide a useful deterministic demo fallback if no AI API is configured.
- Concierge: helpful hotel FAQ, activity suggestions, booking navigation, with clear simulated/fallback behavior if no AI API. No unverified booking/payment claims.

## Staff portal
Separate staff login/roles and dashboard. Room inventory and operational statuses (cleaning, occupied, maintenance) distinct from date-based reservation availability. Reservation list/search/filter, check-in/out, modify/cancel, guest directory, payment status records, occupancy and revenue reporting. Restrict sensitive admin routes server-side. Provide seed demo data and demo staff access that is clearly labeled and disabled or protected in production.

## Email: essential, premium, and real when configured
Implement beautiful responsive HTML transactional emails using React Email or equivalent, delivered via Resend or comparable provider from secure server-side code. Templates: booking confirmation, booking modification, cancellation, and optional check-in reminder. Include tasteful VIERCYS wordmark, hero/architectural image with reliable fallback, warm ivory/blue color palette, personalized greeting, booking reference, property, room, dates, guest count, extras, detailed pricing, status, contact info, and secure Manage Booking CTA. Email must remain readable when images are blocked and on mobile. No external CSS or unsupported web fonts as essential layout dependencies.
- Trigger confirmation only after successful reservation persistence. Store send status and error details, retry safely/idempotently, do not duplicate reservations or emails on retries. Do not claim delivered when merely queued; distinguish accepted/sent/delivered if provider supports it.
- Add a local email preview route for QA. In demo mode without Resend credentials, display a clearly labeled email preview and log/send simulation status, NEVER pretend a real email was sent. Include environment setup for RESEND_API_KEY, verified sender domain/address, and optional test recipient. Do not hardcode secrets.

## Tech and architecture
Preferred: Next.js App Router, React, TypeScript, Tailwind CSS, GSAP/ScrollTrigger, optional Lenis and React Three Fiber, Supabase PostgreSQL/Auth with server-side authorization, Resend/React Email. Choose robust alternatives only with rationale. Use reusable components, typed schemas, server-side validation, safe migrations and seed scripts, environment example, README. Build in phases within this same project and keep progress documented in PROJECT_STATUS.md. Do not silently omit requirements. When backend credentials are absent, make a working and clearly labeled local demo mode that can be tested end-to-end, with an explicit path to switch to real persistence and email.

## Demonstration goal and quality gates
A first-time classmate should independently: land on cinematic home, choose Santorini, search dates, compare/select room, optionally add a romantic experience, complete simulated payment, receive real email if configured, view booking, generate itinerary; staff then sees same reservation in admin. Optimize for HCI: clarity, consistency, error prevention, feedback, accessibility, and performance. Test desktop/mobile, dates, booking conflicts, forms, modification, cancellation, admin permissions, and email preview. Run lint/typecheck/build and fix errors.

## How to execute
1. Inspect repository and available assets. If empty, scaffold Next.js with TypeScript and Tailwind.
2. Create a brief execution plan and PROJECT_STATUS.md, then START IMPLEMENTING without waiting for further permission for ordinary code changes.
3. FIRST deliver a polished cinematic homepage with meaningful scroll behavior and responsive fallback; then functional reservation flow and seeded 20-room inventory; then database, branded emails, guest/admin portals, AI itinerary/concierge, testing and polish.
4. Keep the development server runnable and show commands to launch it. After each milestone update PROJECT_STATUS.md with working features, missing integrations, and next actions.
5. Ask only when a real external credential or irreversible decision is required. Never invent successful tests, email delivery, or completed integrations.
