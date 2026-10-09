"use client";
import { useEffect, useId, useRef, useState } from "react";
import { propertyToday, addDays, validateSearch } from "@/lib/policy";

function Calendar({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
  label: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [month, setMonth] = useState((value || min).slice(0, 7));
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  function dayKeyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: string,
  ) {
    const amount =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowDown"
            ? 7
            : event.key === "ArrowUp"
              ? -7
              : null;
    if (amount === null) return;
    event.preventDefault();
    const next = addDays(date, amount);
    if (next < min || next > max) return;
    const origin = event.currentTarget;
    setMonth(next.slice(0, 7));
    requestAnimationFrame(() => {
      const target = dialog.current?.querySelector<HTMLButtonElement>(
        `button[data-date="${next}"]`,
      );
      if (target) {
        origin.tabIndex = -1;
        target.tabIndex = 0;
        target.focus();
      }
    });
  }
  function move(amount: number) {
    const next = new Date(Date.UTC(year, number - 1 + amount, 1));
    setMonth(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return (
    <>
      <button
        type="button"
        className="calendar-open"
        aria-label={`Choose ${label} from calendar`}
        onClick={() => {
          setMonth(
            (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : min).slice(0, 7),
          );
          dialog.current?.showModal();
          requestAnimationFrame(() => {
            const selected = dialog.current?.querySelector<HTMLButtonElement>(
              `button[data-date="${value}"]:not(:disabled)`,
            );
            (
              selected ??
              dialog.current?.querySelector<HTMLButtonElement>(
                "button[data-date]:not(:disabled)",
              )
            )?.focus();
          });
        }}
      >
        Calendar
      </button>
      <dialog
        ref={dialog}
        className="date-dialog"
        aria-label={`${label} calendar`}
      >
        <div className="calendar-heading">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={month <= min.slice(0, 7)}
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 aria-live="polite">
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(first)}
          </h2>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={month >= max.slice(0, 7)}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="calendar-days">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                type="button"
                key={date}
                data-date={date}
                tabIndex={
                  date ===
                  (value.slice(0, 7) === month
                    ? value
                    : month === min.slice(0, 7)
                      ? min
                      : `${month}-01`)
                    ? 0
                    : -1
                }
                onKeyDown={(event) => dayKeyboard(event, date)}
                disabled={date < min || date > max}
                aria-label={`${label} ${date}`}
                aria-pressed={date === value}
                onClick={() => {
                  onChange(date);
                  dialog.current?.close();
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <button
          className="calendar-close"
          type="button"
          onClick={() => dialog.current?.close()}
        >
          Close calendar
        </button>
      </dialog>
    </>
  );
}
export function ReservationForm({
  initialArrival,
  initialDeparture,
  initialAdults = "2",
  initialChildren = "0",
  initialRooms = "1",
}: {
  initialArrival?: string;
  initialDeparture?: string;
  initialAdults?: string;
  initialChildren?: string;
  initialRooms?: string;
}) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const today = propertyToday();
  const horizon = addDays(today, 730);
  const [arrival, setArrival] = useState(initialArrival ?? addDays(today, 1));
  const [departure, setDeparture] = useState(
    initialDeparture ?? addDays(today, 4),
  );
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);
  useEffect(() => {
    const restore = () => setPending(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    const message = validateSearch({
      arrival,
      departure,
      adults: Number(adults),
      children: Number(children),
      rooms: Number(rooms),
    });
    if (message) {
      event.preventDefault();
      setError(message);
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>("[role=alert]")?.focus(),
      );
    } else {
      setError("");
      setPending(true);
    }
  }
  return (
    <form
      ref={form}
      action="/availability"
      method="get"
      noValidate
      onSubmit={submit}
      className="reservation-form corrected-search"
      aria-describedby={`${id}-policy`}
    >
      <div className="field property">
        <label htmlFor={`${id}-property`}>Destination</label>
        <select id={`${id}-property`} name="property">
          <option value="santorini">Santorini, Greece</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-arrival`}>Check-in</label>
        <input
          id={`${id}-arrival`}
          name="arrival"
          type="date"
          min={today}
          max={horizon}
          value={arrival}
          onChange={(e) => {
            setArrival(e.target.value);
            setError("");
          }}
          required
          aria-invalid={
            !!error &&
            /date|arrival|departure|check|night|stay|year/i.test(error)
          }
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Calendar
          value={arrival}
          onChange={(value) => {
            setArrival(value);
            setError("");
          }}
          min={today}
          max={horizon}
          label="check-in"
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-departure`}>Check-out</label>
        <input
          id={`${id}-departure`}
          name="departure"
          type="date"
          min={today}
          max={horizon}
          value={departure}
          onChange={(e) => {
            setDeparture(e.target.value);
            setError("");
          }}
          required
          aria-invalid={
            !!error &&
            /date|arrival|departure|check|night|stay|year/i.test(error)
          }
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Calendar
          value={departure}
          onChange={(value) => {
            setDeparture(value);
            setError("");
          }}
          min={today}
          max={horizon}
          label="check-out"
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-adults`}>Adults</label>
        <select
          id={`${id}-adults`}
          name="adults"
          value={adults}
          onChange={(e) => {
            setAdults(e.target.value);
            setError("");
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-children`}>Children</label>
        <select
          id={`${id}-children`}
          name="children"
          value={children}
          onChange={(e) => {
            setChildren(e.target.value);
            setError("");
          }}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <option value={i} key={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-rooms`}>Rooms</label>
        <select
          id={`${id}-rooms`}
          name="rooms"
          value={rooms}
          onChange={(e) => {
            setRooms(e.target.value);
            setError("");
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <button className="search" type="submit" disabled={pending}>
        {pending ? "Checking availability…" : "Check availability"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
      <p className="search-policy" id={`${id}-policy`}>
        Demo property · Up to 5 rooms per booking; every child counts toward
        room capacity. At least one adult per room. Stays of 1–30 nights, within
        the next 24 months. Dates follow Santorini local time.
      </p>
      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          tabIndex={-1}
          className="form-error"
        >
          <p>{error}</p>
          {Number(adults) + Number(children) > Number(rooms) * 4 &&
            Number(rooms) < 5 && (
              <button
                type="button"
                onClick={() => {
                  setRooms(
                    String(
                      Math.min(
                        5,
                        Math.ceil((Number(adults) + Number(children)) / 4),
                      ),
                    ),
                  );
                  setError("");
                }}
              >
                Add another room
              </button>
            )}
        </div>
      )}
    </form>
  );
}
