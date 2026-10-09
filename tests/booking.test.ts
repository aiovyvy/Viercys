import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const directory = mkdtempSync(join(tmpdir(), "viercys-"));
process.env.VIERCYS_DB_PATH = join(directory, "test.sqlite");
process.env.VIERCYS_DEMO_MODE = "true";
const { db, listRooms, session, createSession } = await import("../src/lib/db");
const {
  createBooking,
  available,
  allocation,
  pricing,
  modify,
  cancel,
  authorize,
  emailStatuses,
} = await import("../src/lib/booking");
const { validateSearch, propertyToday, addDays, dayNumber } =
  await import("../src/lib/policy");
const { sendEmails, emailHtml } = await import("../src/lib/email");
const input = {
  arrival: addDays(propertyToday(), 20),
  departure: addDays(propertyToday(), 23),
  adults: 2,
  children: 0,
  rooms: 1,
};
const make = (changes: Record<string, unknown> = {}) => ({
  ...input,
  roomIds: ["S-101"],
  guest: { name: "Alex Guest", email: "alex@example.test" },
  consent: true,
  idempotencyKey: randomUUID(),
  ...changes,
});
after(() => {
  db().close();
  rmSync(directory, { recursive: true, force: true });
});
test("strict dates, leap days, years, bounds and property calendar", () => {
  for (const [arrival, departure] of [
    ["222222-01-01", "222222-01-04"],
    ["2027-02-30", "2027-03-04"],
    ["2027-02-29", "2027-03-02"],
    ["2026-01-01", "2026-01-04"],
  ])
    assert.ok(validateSearch({ ...input, arrival, departure }, "2026-10-09"));
  assert.ok(Number.isFinite(dayNumber("2028-02-29")));
  assert.equal(
    validateSearch(
      { ...input, arrival: "2028-02-28", departure: "2028-03-02" },
      "2026-10-09",
    ),
    null,
  );
  assert.ok(validateSearch({ ...input, departure: input.arrival }));
  assert.ok(
    validateSearch({ ...input, departure: addDays(input.arrival, 31) }),
  );
  assert.ok(
    validateSearch({
      ...input,
      arrival: addDays(propertyToday(), 731),
      departure: addDays(propertyToday(), 734),
    }),
  );
  assert.equal(propertyToday(new Date("2026-10-08T22:30:00Z")), "2026-10-09");
  assert.ok(validateSearch({ ...input, adults: 11 }));
  assert.ok(validateSearch({ ...input, children: 9 }));
  assert.ok(validateSearch({ ...input, adults: 6, rooms: 1 }));
  assert.equal(validateSearch({ ...input, adults: 6, rooms: 3 }), null);
});
test("20 rooms, capacities and transparent price", () => {
  const rooms = listRooms();
  assert.equal(rooms.length, 20);
  assert.equal(
    Number(
      db().prepare("SELECT count(*) AS total FROM categories").get()!.total,
    ),
    3,
  );
  assert.equal(
    Number(db().prepare("SELECT count(*) AS total FROM extras").get()!.total),
    5,
  );
  assert.equal(
    rooms.filter((room) => room.category === "essential").length,
    10,
  );
  assert.equal(rooms.filter((room) => room.category === "signature").length, 6);
  assert.equal(rooms.filter((room) => room.category === "grand").length, 4);
  assert.throws(() =>
    allocation({ ...input, adults: 6, rooms: 2 }, rooms.slice(0, 2)),
  );
  assert.deepEqual(
    allocation(
      { ...input, adults: 3, children: 1, rooms: 2 },
      rooms.slice(0, 2),
    ).map((slot) => slot.adults + slot.children),
    [2, 2],
  );
  const total = pricing(
    input,
    [rooms[0]],
    [
      { id: "dinner", quantity: 1 },
      { id: "breakfast", quantity: 6 },
    ],
  );
  assert.equal(total.roomSubtotal, 54000);
  assert.equal(total.extrasSubtotal, 13200);
  assert.equal(total.tax, 8736);
  assert.equal(total.total, 75936);
  assert.equal(total.pendingApprovalTotal, 14000);
});
test("atomic overlap, adjacent interval and idempotent retries", () => {
  const request = make();
  const booking = createBooking(request);
  assert.equal(createBooking(request).reference, booking.reference);
  assert.throws(() =>
    createBooking({
      ...request,
      guest: { name: "Other", email: "other@example.test" },
    }),
  );
  assert.throws(() => createBooking(make()));
  assert.equal(available(input).length, 19);
  assert.doesNotThrow(() =>
    createBooking(
      make({
        arrival: input.departure,
        departure: addDays(input.departure, 3),
      }),
    ),
  );
  assert.equal(getCount(), 2);
  function getCount() {
    return Number(
      db().prepare("SELECT COUNT(*) AS count FROM bookings").get()!.count,
    );
  }
});
test("multi-room persistence, guest authorization, modification conflicts and cancellation", () => {
  const booking = createBooking(
    make({ roomIds: ["S-102", "S-201"], adults: 4, children: 1, rooms: 2 }),
  );
  assert.equal(
    booking.allocations.reduce(
      (total, slot) => total + slot.adults + slot.children,
      0,
    ),
    5,
  );
  assert.throws(() => authorize(booking.reference, null));
  const guest = session(createSession("guest", booking.reference));
  assert.equal(
    authorize(booking.reference, guest).reference,
    booking.reference,
  );
  assert.throws(() =>
    authorize(booking.reference, session(createSession("guest", "different"))),
  );
  const blocker = createBooking(
    make({
      roomIds: ["S-102"],
      arrival: addDays(input.arrival, 4),
      departure: addDays(input.arrival, 7),
    }),
  );
  assert.ok(blocker.reference);
  assert.throws(() =>
    modify(
      booking.reference,
      {
        ...input,
        arrival: addDays(input.arrival, 4),
        departure: addDays(input.arrival, 7),
        adults: 4,
        children: 1,
        rooms: 2,
      },
      guest,
    ),
  );
  assert.throws(() => cancel(booking.reference, guest, false));
  assert.equal(cancel(booking.reference, guest, true).status, "cancelled");
  assert.ok(available(input).some((room) => room.id === "S-102"));
});
test("full sold-out inventory returns none", () => {
  const sold = {
    ...input,
    arrival: addDays(propertyToday(), 100),
    departure: addDays(propertyToday(), 103),
  };
  for (const room of listRooms())
    createBooking(make({ ...sold, roomIds: [room.id] }));
  assert.equal(available(sold).length, 0);
  assert.throws(() => createBooking(make({ ...sold, roomIds: ["S-301"] })));
});
test("email fallback persists preview, escapes guest text and remains readable without images", async () => {
  const booking = createBooking(
    make({
      roomIds: ["S-103"],
      guest: { name: "Alex <script>", email: "preview@example.test" },
    }),
  );
  await sendEmails(booking.reference);
  assert.equal(emailStatuses(booking.reference)[0].status, "demo-preview");
  const html = await emailHtml(
    booking,
    "confirmation",
    "https://example.test/manage",
  );
  assert.ok(html.includes("Alex &lt;script&gt;"));
  assert.ok(html.includes(booking.reference));
  assert.ok(html.includes("Demo total"));
  assert.ok(html.includes("No real charge"));
  assert.ok(!html.includes("<script>"));
  await sendEmails(booking.reference);
  assert.equal(Number(emailStatuses(booking.reference)[0].attempts), 1);
});

test("room modifications reprice and record adjustment; cancellation is idempotent", () => {
  const booking = createBooking(make({ roomIds: ["S-105"] }));
  const guest = session(createSession("guest", booking.reference));
  const updated = modify(
    booking.reference,
    { ...input, rooms: 2, adults: 3, roomIds: ["S-105", "S-106"] },
    guest,
  );
  assert.equal(updated.rooms, 2);
  assert.ok(updated.pricing.total > booking.pricing.total);
  const adjustment = db()
    .prepare(
      "SELECT amount FROM payment_records WHERE reference=? AND status='demo-adjustment'",
    )
    .get(booking.reference);
  assert.equal(
    Number(adjustment!.amount),
    updated.pricing.total - booking.pricing.total,
  );
  const cancelled = cancel(booking.reference, guest, true);
  assert.equal(
    cancel(booking.reference, guest, true).version,
    cancelled.version,
  );
  assert.throws(() => modify(booking.reference, input, guest));
});
test("Resend errors persist; retries reuse the same provider key and HTML; accepted is not delivered", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM;
  process.env.RESEND_API_KEY = "mock-key";
  process.env.RESEND_FROM = "VIERCYS <sender@example.test>";
  const booking = createBooking(make({ roomIds: ["S-107"] }));
  const calls: { headers: Record<string, string>; body: string }[] = [];
  try {
    globalThis.fetch = async (_url, options) => {
      calls.push({
        headers: options?.headers as Record<string, string>,
        body: String(options?.body),
      });
      return new Response(
        JSON.stringify(
          calls.length === 1
            ? { message: "Mock rejection" }
            : { id: "provider-mocked-id" },
        ),
        {
          status: calls.length === 1 ? 429 : 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };
    await sendEmails(booking.reference);
    assert.equal(emailStatuses(booking.reference)[0].status, "failed");
    await sendEmails(booking.reference);
    assert.equal(emailStatuses(booking.reference)[0].status, "accepted");
    assert.equal(
      calls[0].headers["Idempotency-Key"],
      calls[1].headers["Idempotency-Key"],
    );
    assert.equal(calls[0].body, calls[1].body);
    await sendEmails(booking.reference);
    assert.equal(calls.length, 2);
    const html = JSON.parse(calls[0].body).html;
    const token = html.match(/token=([^"&]+)/)[1];
    const { hash } = await import("../src/lib/db");
    assert.equal(
      db()
        .prepare("SELECT email FROM lookup_tokens WHERE hash=?")
        .get(hash(token))!.email,
      "booking:" + booking.reference,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = previousFrom;
  }
});
