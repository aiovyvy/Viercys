"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shell, useData, Feedback } from "./journey";
import { ReservationForm } from "./reservation-form";
import { CATEGORIES, money, type Room } from "@/lib/catalog";
import { searchQuery, nights, type SearchInput } from "@/lib/policy";
type Result = {
  rooms: Room[];
  currency: string;
  categories: ((typeof CATEGORIES)[number] & { remaining: number })[];
};
export default function Results({
  search,
  initialError,
  initialCategory = "",
}: {
  search: SearchInput;
  initialError: string | null;
  initialCategory?: string;
}) {
  const response = useData<Result>("/api/availability?" + searchQuery(search));
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [compare, setCompare] = useState<string[]>([]);
  const [filter, setFilter] = useState(initialCategory);
  const [sort, setSort] = useState("price");
  const [purpose, setPurpose] = useState("");
  const [priority, setPriority] = useState("pace");
  const [budget, setBudget] = useState("600");
  const rooms = response.data?.rooms || [];
  const chosen = Object.entries(selected).flatMap(([id, count]) =>
    rooms.filter((room) => room.category === id).slice(0, count),
  );
  const capacity = chosen.reduce((sum, room) => sum + room.capacity, 0);
  const price = chosen.reduce(
    (sum, room) => sum + room.rate * nights(search),
    0,
  );
  const categories = [...CATEGORIES]
    .filter((cat) => !filter || cat.id === filter)
    .sort((a, b) => (sort === "space" ? b.size - a.size : a.rate - b.rate));
  const recommend = [...CATEGORIES]
    .filter(
      (cat) =>
        rooms.some((room) => room.category === cat.id) &&
        cat.rate <= Number(budget) * 100,
    )
    .sort((a, b) =>
      priority === "space"
        ? b.size - a.size
        : priority === "value"
          ? a.rate - b.rate
          : purpose === "romantic" || purpose === "wellness"
            ? a.id === "signature"
              ? -1
              : 1
            : purpose === "family"
              ? b.capacity - a.capacity
              : a.rate - b.rate,
    )[0];
  return (
    <Shell title="Find your sanctuary.">
      <p className="lead">
        Choose your dates, compare spaces and select physical rooms for your
        party. Availability is checked again when you confirm.
      </p>
      <ReservationForm
        initialArrival={search.arrival}
        initialDeparture={search.departure}
        initialAdults={String(search.adults)}
        initialChildren={String(search.children)}
        initialRooms={String(search.rooms)}
      />
      <Feedback
        error={initialError || response.error}
        loading={response.loading}
      />
      {!initialError && response.data && (
        <>
          <div className="j-row">
            <p>
              {nights(search)} nights · {search.adults} adults ·{" "}
              {search.children} children · {search.rooms} rooms requested
            </p>
            <p>{rooms.length} of 20 rooms available for these dates</p>
          </div>
          <details className="j-panel">
            <summary>Optional: Find Your Sanctuary — skip anytime</summary>
            <div className="j-fields">
              <label>
                Trip purpose
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="">Choose a purpose</option>
                  <option value="romantic">Romantic escape</option>
                  <option value="family">Family</option>
                  <option value="wellness">Wellness</option>
                  <option value="solo">Solo</option>
                </select>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="pace">Match my trip</option>
                  <option value="space">More space</option>
                  <option value="value">Lower nightly rate</option>
                </select>
              </label>
              <label>
                Nightly budget per room ({response.data.currency})
                <input
                  type="number"
                  min="180"
                  max="2000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </label>
            </div>
            {purpose &&
              (recommend ? (
                <p>
                  Consider {recommend.name}:{" "}
                  {purpose === "family"
                    ? `capacity for ${recommend.capacity} guests per room`
                    : priority === "space"
                      ? `${recommend.size} m² of space`
                      : priority === "value"
                        ? "the lowest available nightly rate within your budget"
                        : "a space suited to your pace"}
                  , with rooms available on these dates and a sample rate within
                  your budget. Final fit depends on your selected room
                  combination.
                </p>
              ) : (
                <p>
                  No available categories match that budget. Increase your
                  budget or change your dates.
                </p>
              ))}
          </details>
          <div className="j-fields">
            <label>
              Category filter
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort rooms
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="price">Nightly price</option>
                <option value="space">Largest spaces first</option>
              </select>
            </label>
          </div>
          {rooms.length === 0 && (
            <div className="notice">
              <h2>No rooms available.</h2>
              <p>Try other dates. No room has been held or payment taken.</p>
            </div>
          )}
          <div className="j-grid">
            {categories.map((cat) => {
              const remaining = rooms.filter(
                (room) => room.category === cat.id,
              ).length;
              return (
                <article className="j-room" key={cat.id}>
                  <div className="j-room-photo">
                    <Image
                      src={cat.photo}
                      alt={`${cat.name} editorial inspiration`}
                      fill
                      sizes="(max-width:600px) 100vw, 33vw"
                    />
                  </div>
                  <p className="j-status">
                    {cat.tier} · {remaining} of {cat.inventory} available
                  </p>
                  <h2>{cat.name}</h2>
                  <p>{cat.description}</p>
                  <p>
                    {cat.size} m² · {cat.view} · Up to {cat.capacity} guests
                  </p>
                  <p>
                    <strong>{money(cat.rate, response.data!.currency)}</strong>{" "}
                    per night ·{" "}
                    {money(cat.rate * nights(search), response.data!.currency)}{" "}
                    for {nights(search)} nights before tax
                  </p>
                  <ul>
                    {cat.amenities.slice(0, 3).map((amenity) => (
                      <li key={amenity}>{amenity}</li>
                    ))}
                  </ul>
                  <div className="j-row">
                    <label className="j-label">
                      Rooms to select
                      <input
                        className="j-input"
                        type="number"
                        min="0"
                        max={Math.min(remaining, search.rooms)}
                        value={selected[cat.id] || 0}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            [cat.id]: Math.max(
                              0,
                              Math.min(
                                remaining,
                                search.rooms,
                                Number(e.target.value),
                              ),
                            ),
                          })
                        }
                        disabled={!remaining}
                      />
                    </label>
                    <Link
                      className="j-link"
                      href={`/rooms/${cat.id}?${searchQuery(search)}`}
                    >
                      Room details & gallery
                    </Link>
                  </div>
                  <label className="j-check">
                    <input
                      type="checkbox"
                      checked={compare.includes(cat.id)}
                      disabled={
                        !compare.includes(cat.id) && compare.length >= 3
                      }
                      onChange={(e) =>
                        setCompare(
                          e.target.checked
                            ? [...compare, cat.id]
                            : compare.filter((id) => id !== cat.id),
                        )
                      }
                    />
                    Compare {cat.name}
                  </label>
                </article>
              );
            })}
          </div>
          {compare.length > 0 && (
            <Link
              className="j-button secondary"
              href={`/compare?${searchQuery(search)}&categories=${compare.join(",")}`}
            >
              Compare {compare.length} categories
            </Link>
          )}
          <div className="j-summary">
            <h2>Your room selection</h2>
            <p>
              {chosen.length} / {search.rooms} rooms · Capacity for {capacity} /{" "}
              {search.adults + search.children} guests
            </p>
            <p>
              Rooms:{" "}
              {chosen.length
                ? chosen.map((room) => room.number).join(", ")
                : "Choose above"}
            </p>
            <p>
              Room subtotal {money(price, response.data.currency)} + 13% tax{" "}
              {money(Math.round(price * 0.13), response.data.currency)} ={" "}
              {money(Math.round(price * 1.13), response.data.currency)} sample
              total
            </p>
            {chosen.length === search.rooms &&
            capacity >= search.adults + search.children ? (
              <Link
                className="j-button"
                href={`/checkout?${searchQuery(search)}&roomIds=${chosen.map((room) => room.id).join(",")}`}
              >
                Continue to experiences
              </Link>
            ) : (
              <p className="j-note">
                Select exactly {search.rooms} rooms with capacity for your whole
                party. Every room needs an adult. You can increase the room
                count above without resetting dates.
              </p>
            )}
          </div>
          <p className="j-note">
            Editorial images illustrate room inspiration, not photographs of
            this fictional property. Cleaning and occupied operational labels do
            not replace date-based reservation checks; maintenance rooms are
            excluded.
          </p>
        </>
      )}
    </Shell>
  );
}
