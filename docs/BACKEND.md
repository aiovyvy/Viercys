# Backend and deployment

## Supported persistent local backend

`src/lib/db.ts` uses Node SQLite with WAL, foreign keys, a five-second busy timeout and `BEGIN IMMEDIATE` transactions. `database/sqlite.sql` is the idempotent schema; initialization adds the claimed_at email column to older Phase 2 databases. `npm run seed` preserves existing reservations and inserts missing seeded rooms/catalog records. It never deletes guest data.

Stored data: three categories with amenities; 20 individual rooms with capacities, rates and operational statuses; five extras; availability blocks; bookings with immutable guest/pricing/extras snapshots; allocated adults/children per room; guest profiles; payment and adjustment/refund records; itineraries; hashed staff/guest sessions; hashed expiring single-use lookup tokens; salted scrypt staff credentials; email attempts; replay-protected webhook events; rate-limit buckets.

Inventory checks use half-open dates [arrival, departure), so an arrival on another stay's departure is allowed. Database triggers reject overlapping confirmed allocations, room overcapacity and blocked dates. Blocks cannot be inserted across an existing reservation. Modification removes/reallocates rooms and reprices inside one transaction; cancellation is transactionally idempotent. Price amounts are integer cents; requested extras are excluded from the demo-paid total. No payment gateway exists or is implied.

Checkout idempotency keys are unique in the database and bound to a canonical payload hash. SessionStorage retains a checkout retry key but is not the reservation store. DB commits precede email submission; failed mail does not undo a successful reservation.

Use one Node deployment with a persistent volume. Back up SQLite using a consistent SQLite backup/snapshot operation; copying only the main file while WAL writes are active is not a reliable backup. Mount the DB and schema assets appropriately. Do not deploy this filesystem backend to ephemeral serverless instances or share a SQLite file across multiple network-mounted application hosts. Configure HTTPS, APP_URL, protected manager credentials and private service keys. This remains a fictional simulated-payment application even with real email credentials.

## Explicit path to Supabase/Postgres

The current service is deliberately a robust local equivalent permitted by the brief. **No Supabase adapter or Supabase Auth connection is implemented.** Setting Supabase URL/key variables would not activate one. Hosted Postgres is additional implementation/deployment work, rather than a hidden fallback.

To migrate:

1. Create a private Postgres schema mirroring `database/sqlite.sql`; use DATE for property calendar dates, JSONB for snapshots/amenities/itinerary and timestamptz for events. Keep currency amounts as integer minor units. Seed the same category IDs and room IDs/counts. Migrate actual reservations separately; do not use a destructive seed.
2. Implement an asynchronous repository layer replacing the synchronous DatabaseSync calls in db.ts, booking.ts, email.ts and the API handler. Keep policy.ts/catalog.ts business values and the test cases. A single transaction/RPC must validate available physical rooms, actual capacities, canonical idempotency hash and server-calculated pricing before inserting reservations/allocations/payment/outbox rows.
3. Store an allocation's date range/status alongside its room ID. Add a GiST exclusion constraint on `(room_id WITH =, stay_range WITH &&)` for active reservations, using `btree_gist` and `[)` dateranges. Update allocation dates/status transactionally on modification/cancellation. Check availability blocks under the same room locks. Never replace this with separate client SELECT then INSERT requests.
4. Use Supabase Auth verified identities or retain equivalent secure token sessions, with server ownership checks and staff role mapping. Enable RLS on all guest/booking/payment/email/session tables. Deny anonymous direct table reads/writes; never expose a service-role key to the browser. Confirmation links must remain scoped to a reference; only verified mailbox access may grant history access.
5. Move mail claims to an atomic Postgres operation such as UPDATE ... RETURNING or SELECT ... FOR UPDATE SKIP LOCKED; retain immutable HTML and per-version idempotency keys. Add a scheduler/worker only if unattended retry or automatic reminders are required.
6. Port and run the same invalid-date, capacity, idempotency, adjacent/overlap, concurrency, modification, cancellation, authorization, delivery-status and browser journey tests against the remote database. Verify backup/restore, SSL and multi-instance behavior before deploying.

This path documents the required changes honestly; a cloud migration is not marked complete or merely blocked by a missing key. The fully usable development/demo booking system runs with the persistent SQLite schema today.

## Email and AI verification boundary

Resend requests, rejection/retry/accepted handling and AI structured-response fallback are tested using mocks. Signed webhook acceptance, invalid signature rejection and duplicate-event handling are tested against the real local route. No external email has been sent and no live OpenAI response has been requested without user-provided credentials. Browser previews are inspected at desktop/mobile widths with image requests blocked; this is not a substitute for an Outlook/Gmail/device delivery matrix.