"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell, useData, api, Feedback } from "./journey";
import { EXTRAS, money, type ExtraSelection } from "@/lib/catalog";
import { formatDate, searchQuery, type SearchInput } from "@/lib/policy";
import type { Booking, Pricing } from "@/lib/booking";
export default function Checkout({
  search,
  roomIds,
}: {
  search: SearchInput;
  roomIds: string[];
}) {
  const router = useRouter();
  const [extras, setExtras] = useState<ExtraSelection[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestKey, setRequestKey] = useState("");
  const [quotedPayload, setQuotedPayload] = useState("");
  useEffect(() => {
    const key =
      window.sessionStorage.getItem(
        "viercys-checkout-" + roomIds.join(",") + "-" + search.arrival,
      ) || crypto.randomUUID();
    window.sessionStorage.setItem(
      "viercys-checkout-" + roomIds.join(",") + "-" + search.arrival,
      key,
    );
    queueMicrotask(() => setRequestKey(key));
  }, [roomIds, search.arrival]);
  const payload = { ...search, roomIds, extras };
  const body = JSON.stringify(payload);
  const quote = useData<{ pricing: Pricing; currency: string }>(
    "/api/quote",
    payload,
  );
  useEffect(() => {
    if (quote.data) queueMicrotask(() => setQuotedPayload(body));
  }, [quote.data, body]);
  function extra(id: string, quantity: number) {
    setExtras((current) => [
      ...current.filter((item) => item.id !== id),
      ...(quantity > 0 ? [{ id, quantity }] : []),
    ]);
    setError("");
  }
  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const result = await api<{ booking: Booking }>("/api/bookings", {
        ...payload,
        guest: {
          name: values.get("name"),
          email: values.get("email"),
          phone: values.get("phone"),
        },
        requests: values.get("requests"),
        consent: values.get("consent") === "on",
        idempotencyKey: requestKey,
      });
      window.sessionStorage.removeItem(
        "viercys-checkout-" + roomIds.join(",") + "-" + search.arrival,
      );
      router.push("/booking/" + result.booking.reference + "?success=1");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not confirm your stay.",
      );
      setBusy(false);
    }
  }
  return (
    <Shell title="Curate your escape." eyebrow="YOUR DEMO RESERVATION">
      <ol className="j-steps">
        <li>1. Rooms selected</li>
        <li>2. Optional experiences</li>
        <li>3. Guest details & demo confirmation</li>
      </ol>
      <p>
        {formatDate(search.arrival)} – {formatDate(search.departure)} ·{" "}
        {search.adults} adults · {search.children} children · {search.rooms}{" "}
        rooms
      </p>
      <Link className="text-link" href={"/availability?" + searchQuery(search)}>
        Change room selection ↗
      </Link>
      <section aria-labelledby="extras-heading">
        <h2 id="extras-heading">A little more of the island.</h2>
        <p>
          All experiences are optional. Leave quantities at zero to skip.
          Approval requests are excluded from the demo payment total.
        </p>
        <div className="j-grid">
          {EXTRAS.map((item) => (
            <div className="j-panel" key={item.id}>
              <h3>{item.name}</h3>
              <p>
                {money(item.price, quote.data?.currency)} {item.unit}
              </p>
              <p className="j-note">
                {item.status === "pending-approval"
                  ? "Request only · Subject to staff approval · Not reserved"
                  : "Confirmed in demo only · No real service reserved"}
              </p>
              <label className="j-label">
                {item.name} quantity
                <input
                  className="j-input"
                  type="number"
                  min="0"
                  max="540"
                  value={
                    extras.find((extra) => extra.id === item.id)?.quantity || 0
                  }
                  onChange={(e) =>
                    extra(
                      item.id,
                      Math.max(0, Math.min(540, Number(e.target.value))),
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>
      <Feedback error={quote.error} loading={quote.loading} />
      {quote.data && (
        <PriceSummary
          pricing={quote.data.pricing}
          currency={quote.data.currency}
        />
      )}
      <form onSubmit={confirm}>
        <h2>Your details.</h2>
        <p>Guest booking is welcome. No account or real card is required.</p>
        <div className="j-fields">
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Phone (optional)
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
          <label className="j-full">
            Special requests (subject to approval)
            <textarea name="requests" maxLength={2000} />
          </label>
        </div>
        <h2>Payment & cancellation.</h2>
        <div className="j-alert">
          <strong>DEMO PAYMENT — no money is charged.</strong>
          <p>
            We do not collect card numbers, CVV or payment credentials.
            Confirmation saves a real record in the local demo database and
            records payment as demo-paid.
          </p>
          <p>
            Full simulated refund for online cancellation until two calendar days
            hours before arrival. Changes depend on new availability and
            repricing. No actual travel or accommodation is booked.
          </p>
        </div>
        <label className="j-check">
          <input name="consent" type="checkbox" required />I accept the
          displayed demo payment terms and cancellation policy, and consent to
          storing my booking details for this demonstration.
        </label>
        <Feedback error={error} />
        <button
          className="j-button"
          type="submit"
          disabled={
            busy ||
            quote.loading ||
            !!quote.error ||
            !quote.data ||
            !requestKey ||
            quotedPayload !== body
          }
        >
          {busy
            ? "Saving your reservation…"
            : `Confirm demo booking${quote.data ? " · " + money(quote.data.pricing.total, quote.data.currency) : ""}`}
        </button>
        <p className="j-note">
          Availability is rechecked atomically on confirmation. Requested
          experiences are not confirmed or charged. A confirmation reference is
          created only after the database commit.
        </p>
      </form>
    </Shell>
  );
}
export function PriceSummary({
  pricing,
  currency,
}: {
  pricing: Pricing;
  currency: string;
}) {
  return (
    <section className="j-summary" aria-label="Price breakdown">
      <h2>Your stay, transparently priced.</h2>
      <dl>
        {pricing.rooms.map((room) => (
          <div key={room.id} style={{ display: "contents" }}>
            <dt>
              {room.name} · {room.number}
              <br />
              {room.nights} nights × {money(room.rate, currency)}
            </dt>
            <dd>{money(room.subtotal, currency)}</dd>
          </div>
        ))}
        {pricing.extras.map((extra) => (
          <div key={extra.id} style={{ display: "contents" }}>
            <dt>
              {extra.name} × {extra.quantity}
              <br />
              <small>
                {extra.status === "pending-approval"
                  ? "Approval request, excluded from total"
                  : "Confirmed demo extra"}
              </small>
            </dt>
            <dd>{money(extra.subtotal, currency)}</dd>
          </div>
        ))}
        <dt>Room subtotal</dt>
        <dd>{money(pricing.roomSubtotal, currency)}</dd>
        <dt>Confirmed demo extras</dt>
        <dd>{money(pricing.extrasSubtotal, currency)}</dd>
        <dt>Tax (13%) · No additional fees</dt>
        <dd>{money(pricing.tax, currency)}</dd>
        <dt className="total">Demo payment total</dt>
        <dd className="total">{money(pricing.total, currency)}</dd>
        <dt>Approval requests excluded</dt>
        <dd>{money(pricing.pendingApprovalTotal, currency)}</dd>
      </dl>
      <p className="j-note">
        Sample rates in {currency}. Approval requests may have separate costs if
        later approved; this demo does not confirm them.
      </p>
    </section>
  );
}
