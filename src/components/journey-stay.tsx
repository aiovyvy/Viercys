"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, useData, api, Feedback, GuestLinks } from "./journey";
import { PriceSummary } from "./journey-checkout";
import type { Booking } from "@/lib/booking";
import { formatDate, type SearchInput } from "@/lib/policy";
import { money, type Room } from "@/lib/catalog";
type StayResponse = {
  booking: Booking;
  email: { kind: string; status: string; error?: string }[];
};
export function MyStay() {
  const router = useRouter();
  const result = useData<{ bookings: Booking[] }>("/api/bookings");
  return (
    <Shell title="My VIERCYS.">
      <p>
        Your reservation, your island rhythm. Use a secure access link to see
        all stays booked with your email.
      </p>
      <div className="j-actions">
        <Link href="/lookup" className="j-button">
          Request secure access
        </Link>
        <Link href="/profile" className="j-button secondary">
          Guest profile
        </Link>
        <Link href="/concierge" className="j-button secondary">
          Concierge
        </Link>
        <button
          type="button"
          className="j-button secondary"
          onClick={async () => {
            await api("/api/logout", {});
            result.refresh();
            router.refresh();
          }}
        >
          Sign out
        </button>
      </div>
      <Feedback error={result.error} loading={result.loading} />
      {result.data?.bookings.length === 0 && (
        <div className="notice">
          <h2>Your next chapter is waiting.</h2>
          <p>
            No reservations are accessible in this browser session. Request a
            verified link or book a demo stay.
          </p>
          <Link className="text-link" href="/availability">
            Book your stay ↗
          </Link>
        </div>
      )}
      {result.data?.bookings.map((booking) => (
        <article className="j-room" key={booking.reference}>
          <p className="j-status">
            {booking.status} · {booking.payment_status}
          </p>
          <h2>{booking.reference}</h2>
          <p>
            {formatDate(booking.arrival)} – {formatDate(booking.departure)} ·{" "}
            {booking.name}
            <br />
            {booking.rooms} rooms · {booking.adults} adults · {booking.children}{" "}
            children · {money(booking.pricing.total, booking.currency)}
          </p>
          <Link href={"/booking/" + booking.reference} className="j-button">
            View your stay
          </Link>
        </article>
      ))}
      <p className="j-note">
        Install My VIERCYS from your browser menu for a mobile companion.
        Booking details require a connection and a secure session; they are not
        cached offline.
      </p>
    </Shell>
  );
}
export function Stay({
  reference,
  success = false,
}: {
  reference: string;
  success?: boolean;
}) {
  const result = useData<StayResponse>(
    "/api/bookings/" + encodeURIComponent(reference),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [preview, setPreview] = useState<{
    pricing: import("@/lib/booking").Pricing;
    currency: string;
    search: SearchInput;
    roomIds: string[];
  } | null>(null);
  const catalog = useData<{ rooms: Room[]; currency: string }>("/api/catalog");
  const booking = result.data?.booking;
  async function action(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await api("/api/bookings/" + reference + "/" + path, body);
      setPreview(null);
      result.refresh();
      setCancelOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update your stay.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function change(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const search: SearchInput = {
      arrival: String(form.get("arrival")),
      departure: String(form.get("departure")),
      adults: Number(form.get("adults")),
      children: Number(form.get("children")),
      rooms: form.getAll("roomIds").length,
    };
    try {
      const quote = await api<{
        pricing: import("@/lib/booking").Pricing;
        currency: string;
      }>("/api/bookings/" + reference + "/modification-quote", {
        ...search,
        roomIds: form.getAll("roomIds").map(String),
      });
      setPreview({
        ...quote,
        search,
        roomIds: form.getAll("roomIds").map(String),
      });
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not preview changes.",
      );
    }
  }
  return (
    <Shell
      title={success ? "Your sanctuary awaits." : "Your stay, considered."}
    >
      <Feedback error={result.error || error} loading={result.loading} />
      {booking && (
        <>
          <p className="lead">
            {success
              ? `Thank you, ${booking.name}. Your demo reservation has been saved.`
              : `Welcome back, ${booking.name}.`}
          </p>
          <p className="j-status">
            {booking.status} · {booking.payment_status} ·{" "}
            {booking.checkin_status}
          </p>
          <h2>Booking reference: {booking.reference}</h2>
          <p>
            VIERCYS Santorini, Greece
            <br />
            {formatDate(booking.arrival)} – {formatDate(booking.departure)}
            <br />
            {booking.adults} adults · {booking.children} children ·{" "}
            {booking.rooms} rooms
          </p>
          <p>
            {booking.email}
            {booking.phone ? " · " + booking.phone : ""}
          </p>
          <GuestLinks reference={reference} />
          <h2>What happens next?</h2>
          <p>
            Your stay is saved in the local demo database and visible to staff.
            Review your details, prepare your editable itinerary, and use the
            concierge for suggestions. No real money or accommodation has been
            booked.
          </p>
          <div className="j-alert">
            <h3>Confirmation email</h3>
            {result.data?.email.map((event, index) => (
              <p key={index}>
                {event.kind}:{" "}
                <strong>
                  {event.status === "demo-preview"
                    ? "Demo preview — no email sent"
                    : event.status === "accepted"
                      ? "Accepted by email provider — delivery not verified"
                      : event.status}
                </strong>
                {event.error ? " · " + event.error : ""}
              </p>
            ))}
            <Link
              className="j-link"
              href={`/booking/${reference}/email-preview`}
            >
              View the branded email
            </Link>
            <button
              className="j-button secondary"
              type="button"
              disabled={busy}
              onClick={() => action("email-retry", {})}
            >
              Retry pending / failed email
            </button>
          </div>
          <PriceSummary pricing={booking.pricing} currency={booking.currency} />
          <h2>Your room allocation</h2>
          <ul>
            {booking.allocations.map((slot) => (
              <li key={slot.room_id}>
                Room {slot.room_id.replace("S-", "")} · {slot.adults} adults ·{" "}
                {slot.children} children
              </li>
            ))}
          </ul>
          {booking.requests && (
            <p>Special request, subject to approval: {booking.requests}</p>
          )}
          <p className="j-note">
            Online cancellation until two calendar days before arrival, with a
            full simulated refund. Date changes recheck inventory and
            recalculate the demo total. Dinner, sailing and spa are approval
            requests, not confirmed activities.
          </p>
          {booking.status === "confirmed" && (
            <>
              <div className="j-actions">
                <button
                  className="j-button secondary"
                  type="button"
                  onClick={() => setModifyOpen(!modifyOpen)}
                >
                  Modify dates, guests or rooms
                </button>
                <button
                  className="j-button secondary"
                  type="button"
                  onClick={() => setCancelOpen(!cancelOpen)}
                >
                  Cancel reservation
                </button>
                <button
                  className="j-button secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => action("check-in", {})}
                >
                  Demo digital check-in
                </button>
              </div>
              {modifyOpen && (
                <form
                  className="j-panel"
                  onSubmit={change}
                  onChange={() => setPreview(null)}
                >
                  <h2>Modify your stay</h2>
                  <p>
                    Select 1–5 rooms. Availability and capacity are rechecked
                    for your new dates before you confirm. No change is saved by
                    the preview.
                  </p>
                  <fieldset>
                    <legend>Physical rooms for your revised stay</legend>
                    {catalog.data?.rooms.map((room) => (
                      <label className="j-check" key={room.id}>
                        <input
                          type="checkbox"
                          name="roomIds"
                          value={room.id}
                          defaultChecked={booking.roomIds.includes(room.id)}
                        />
                        Room {room.number} · {room.category} · up to{" "}
                        {room.capacity} guests ·{" "}
                        {money(room.rate, booking.currency)} / night
                        {room.operational === "maintenance"
                          ? " · maintenance"
                          : ""}
                      </label>
                    ))}
                  </fieldset>
                  <div className="j-fields">
                    <label>
                      New check-in
                      <input
                        type="date"
                        name="arrival"
                        defaultValue={booking.arrival}
                        required
                      />
                    </label>
                    <label>
                      New check-out
                      <input
                        type="date"
                        name="departure"
                        defaultValue={booking.departure}
                        required
                      />
                    </label>
                    <label>
                      New adults
                      <input
                        type="number"
                        name="adults"
                        min="1"
                        max="10"
                        defaultValue={booking.adults}
                        required
                      />
                    </label>
                    <label>
                      New children
                      <input
                        type="number"
                        name="children"
                        min="0"
                        max="8"
                        defaultValue={booking.children}
                        required
                      />
                    </label>
                  </div>
                  <p>
                    Repricing uses the displayed room rates and existing
                    confirmed demo extras; approval requests remain excluded.
                    Changes replace the previous dates only after a successful
                    availability check.
                  </p>
                  <label className="j-check">
                    <input type="checkbox" required />I accept repricing and the
                    displayed modification terms.
                  </label>
                  <button className="j-button" disabled={busy} type="submit">
                    Preview new availability and total
                  </button>
                </form>
              )}
              {cancelOpen && (
                <section className="j-panel">
                  <h2>Confirm cancellation</h2>
                  <p>
                    This releases your rooms and records a simulated refund. You
                    can book again if availability permits.
                  </p>
                  <label className="j-check">
                    <input
                      type="checkbox"
                      checked={confirmCancel}
                      onChange={(e) => setConfirmCancel(e.target.checked)}
                    />
                    I confirm cancellation of {reference}.
                  </label>
                  <button
                    className="j-button"
                    disabled={!confirmCancel || busy}
                    type="button"
                    onClick={() => action("cancel", { confirm: true })}
                  >
                    Confirm cancellation
                  </button>
                </section>
              )}
            </>
          )}
          {preview && (
            <section className="j-panel">
              <h2>Review your proposed change</h2>
              <p>
                {formatDate(preview.search.arrival)} –{" "}
                {formatDate(preview.search.departure)}. Nothing has changed yet.
              </p>
              <PriceSummary
                pricing={preview.pricing}
                currency={preview.currency}
              />
              <button
                type="button"
                className="j-button"
                disabled={busy}
                onClick={() =>
                  action("modify", {
                    ...preview.search,
                    roomIds: preview.roomIds,
                  })
                }
              >
                Confirm reservation changes
              </button>
            </section>
          )}
        </>
      )}
    </Shell>
  );
}
export function Lookup({ token }: { token?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      await api("/api/verify", { token });
      router.push("/my-stay");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Access failed.");
      setBusy(false);
    }
  }
  return (
    <Shell title="A private way back.">
      <p>
        Access is verified by a private, expiring email link. A booking
        reference alone cannot unlock guest details.
      </p>
      {token ? (
        <>
          <p>
            This private access link grants access to reservations associated
            with its verified email address.
          </p>
          <button
            type="button"
            className="j-button"
            disabled={busy}
            onClick={verify}
          >
            {busy ? "Verifying…" : "Verify secure link"}
          </button>
        </>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const values = new FormData(event.currentTarget);
            try {
              const result = await api<{ message: string; demoLink?: string }>(
                "/api/lookup",
                { email: values.get("email") },
              );
              setMessage(result.message);
              setDemoLink(result.demoLink || "");
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Could not request access.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="j-fields">
            <label>
              Email used for booking
              <input name="email" type="email" autoComplete="email" required />
            </label>
          </div>
          <button className="j-button" disabled={busy}>
            {busy ? "Requesting access…" : "Request access link"}
          </button>
        </form>
      )}
      <Feedback error={error} />
      {message && <p role="status">{message}</p>}
      {demoLink && (
        <div className="j-alert">
          <strong>LOCAL DEMO ACCESS PREVIEW — no email sent.</strong>
          <p>
            This verification shortcut is shown only in explicitly enabled demo
            mode. Production requires email delivery.
          </p>
          <Link
            className="j-button"
            href={new URL(demoLink).pathname + new URL(demoLink).search}
          >
            Open demo verification link
          </Link>
        </div>
      )}
    </Shell>
  );
}
export function Receipt({ reference }: { reference: string }) {
  const result = useData<StayResponse>("/api/bookings/" + reference);
  const booking = result.data?.booking;
  return (
    <Shell title="Your VIERCYS receipt.">
      <Feedback error={result.error} loading={result.loading} />
      {booking && (
        <>
          <p>
            {booking.reference} · {booking.name}
            <br />
            VIERCYS Santorini · {formatDate(booking.arrival)} –{" "}
            {formatDate(booking.departure)}
            <br />
            {booking.adults} adults · {booking.children} children · Rooms{" "}
            {booking.pricing.rooms.map((room) => room.number).join(", ")}
          </p>
          <p className="receipt-notice">
            Fictional property · {booking.status} · {booking.payment_status} ·
            No real charge
          </p>
          <PriceSummary pricing={booking.pricing} currency={booking.currency} />
          <div className="j-actions">
            <button
              type="button"
              className="j-button"
              onClick={() => window.print()}
            >
              Print / save as PDF
            </button>
            <Link className="j-button secondary" href={"/booking/" + reference}>
              Back to your stay
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}
export function EmailPreview({ reference }: { reference: string }) {
  const result = useData<StayResponse>("/api/bookings/" + reference);
  return (
    <Shell title="A considered confirmation.">
      <Feedback error={result.error} loading={result.loading} />
      {result.data && (
        <>
          <p>
            Branded email QA preview. Delivery status:{" "}
            {result.data.email[0]?.status || "queued"}. Preview does not mean
            sent or delivered.
          </p>
          <GuestLinks reference={reference} />
          <iframe
            className="email-frame"
            title="VIERCYS transactional email preview"
            src={"/api/bookings/" + reference + "/email-preview"}
            sandbox="allow-popups allow-top-navigation-by-user-activation"
          />
        </>
      )}
    </Shell>
  );
}
