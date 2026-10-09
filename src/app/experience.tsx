"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photos } from "./data";
import { ReservationForm } from "@/components/reservation-form";
export { ReservationForm } from "@/components/reservation-form";
import SuitePreview from "@/components/cinematic/SuitePreview";
import { CATEGORIES, CURRENCY } from "@/lib/catalog";
import ArchitecturalJourney from "@/components/cinematic/ArchitecturalJourney";

export function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 760px) 100vw, 85vw"
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav">
        <Link href="/" className="wordmark" aria-label="VIERCYS home">
          VIERCYS<span>HOTELS & RESORTS</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className={open ? "navlinks open" : "navlinks"}
        >
          <Link href="/#story" onClick={() => setOpen(false)}>
            Our philosophy
          </Link>
          <Link href="/#destinations" onClick={() => setOpen(false)}>
            Destinations
          </Link>
          <Link href="/my-stay" onClick={() => setOpen(false)}>
            My VIERCYS
          </Link>
          <Link href="/concierge" onClick={() => setOpen(false)}>
            Concierge
          </Link>
        </nav>
        <Link className="book" href="/availability">
          Book your stay <span>↗</span>
        </Link>
        <button
          className="menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      <Link className="mobile-book-action" href="/availability">
        Book your stay ↗
      </Link>
    </>
  );
}
export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const gallery = root.current?.querySelector(".destinations");
        gallery?.classList.add("is-animated");
        const ctx = gsap.context(() => {
          gsap.to(".hero-photo", {
            yPercent: 22,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
          const travel = gsap.to(".destination-track", {
            x: () =>
              -Math.max(
                0,
                (document.querySelector(".destination-track") as HTMLElement)
                  .scrollWidth -
                  window.innerWidth +
                  96,
              ),
            ease: "none",
            scrollTrigger: {
              trigger: ".destinations",
              start: "top top",
              end: "+=1200",
              scrub: 1,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
          gsap.utils
            .toArray<HTMLElement>(".destination-image")
            .forEach((photo) => {
              const image = photo.querySelector("img");
              if (image)
                gsap.fromTo(
                  image,
                  { xPercent: 7, scale: 1.16 },
                  {
                    xPercent: -7,
                    ease: "none",
                    scrollTrigger: {
                      trigger: photo,
                      containerAnimation: travel,
                      start: "left right",
                      end: "right left",
                      scrub: true,
                    },
                  },
                );
            });
        }, root);
        return () => {
          ctx.revert();
          gallery?.classList.remove("is-animated");
        };
      },
    );
    return () => mm.revert();
  }, []);
  return (
    <div ref={root}>
      <Navigation />
      <main id="main">
        <section className="hero">
          <div className="hero-photo">
            <Photo
              src={photos.hero}
              alt="Sunlit white architecture overlooking the blue Santorini caldera"
              priority
            />
          </div>
          <div className="hero-shade" />
          <div className="hero-top">
            <span>AN AEGEAN STATE OF MIND</span>
            <span>SANTORINI · GREECE</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">THE ART OF BEING HERE</p>
            <h1>
              Where Earth
              <br />
              Meets <em>the Sea.</em>
            </h1>
            <div className="hero-bottom">
              <div>
                <Link className="hero-book" href="/availability">
                  Book your stay ↗
                </Link>
                <p>
                  A quieter world. A deeper blue.
                  <br />A place to return to yourself.
                </p>
              </div>
              <a href="#story" className="discover">
                SCROLL TO DISCOVER <span>↓</span>
              </a>
            </div>
          </div>
          <span className="hero-number">36°27′ N &nbsp; 25°22′ E</span>
        </section>
        <section id="reservation" className="reservation">
          <div className="reservation-heading">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <p>
              You book the stay. <em>We curate the experience.</em>
            </p>
          </div>
          <ReservationForm />
          <ol className="booking-steps" aria-label="How booking works">
            <li>
              <strong>1. Find your room</strong>
              <span>Choose dates and compare available spaces.</span>
            </li>
            <li>
              <strong>2. Curate your escape</strong>
              <span>Add experiences or skip straight to checkout.</span>
            </li>
            <li>
              <strong>3. Make it yours</strong>
              <span>Confirm a demo booking, then manage your stay.</span>
            </li>
          </ol>
          <p className="demo-note">
            Sample rates and simulated payments only. VIERCYS is a fictional
            property; reservations are saved in the local demo database.
          </p>
        </section>
        <section id="story" className="intro">
          <p className="eyebrow">
            THE VIERCYS PHILOSOPHY <span>01 /</span>
          </p>
          <div>
            <h2>
              Some places are visited.
              <br />
              Others are <em>felt.</em>
            </h2>
            <div className="intro-bottom">
              <span className="sun-symbol" aria-hidden="true">
                ✳
              </span>
              <p>
                Carved from limestone. Softened by sunlight. Open to the endless
                Aegean. We believe true luxury is the space to slow down — and
                the freedom to feel completely somewhere else.
              </p>
            </div>
          </div>
        </section>
        <ArchitecturalJourney />
        <SuitePreview
          categories={CATEGORIES.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            capacity: category.capacity,
            inventory: category.inventory,
            nightlyRate: category.rate / 100,
            currency: CURRENCY,
            amenities: [...category.amenities],
          }))}
        />
        <section id="destinations" className="destinations">
          <div className="destination-heading">
            <div>
              <p className="eyebrow">ONE PHILOSOPHY. NEW HORIZONS.</p>
              <h2>
                The world, <em>at our pace.</em>
              </h2>
            </div>
            <Link href="/destinations" className="gallery-hint">
              VIEW ALL DESTINATIONS ↗
            </Link>
          </div>
          <div className="destination-track">
            {[
              {
                name: "Santorini",
                country: "GREECE",
                photo: photos.hero,
                live: true,
              },
              {
                name: "Boracay",
                country: "PHILIPPINES",
                photo: photos.boracay,
              },
              { name: "Amalfi", country: "ITALY", photo: photos.amalfi },
              { name: "Bali", country: "INDONESIA", photo: photos.bali },
            ].map((d, i) => (
              <article className="destination" key={d.name}>
                <div className="destination-image">
                  <Photo
                    src={d.photo}
                    alt={`${d.name} destination landscape`}
                  />
                  <span className="destination-status">
                    {d.live ? "OUR FIRST ADDRESS" : "COMING SOON"}
                  </span>
                </div>
                <div className="destination-meta">
                  <span>
                    0{i + 1} / {d.country}
                  </span>
                  {d.live ? (
                    <Link href="/santorini">
                      <h3>
                        {d.name} <span>↗</span>
                      </h3>
                    </Link>
                  ) : (
                    <h3>{d.name}</h3>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="closing">
          <p className="eyebrow">THE SEA IS CALLING</p>
          <h2>
            Make room
            <br />
            for <em>something beautiful.</em>
          </h2>
          <a className="closing-cta" href="#reservation">
            Begin your escape <span>↗</span>
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
export function Footer() {
  return (
    <footer>
      <Link href="/" className="wordmark">
        VIERCYS<span>HOTELS & RESORTS</span>
      </Link>
      <p>Where Earth Meets the Sea.</p>
      <div>
        <Link href="/santorini">Discover Santorini ↗</Link>
        <span>© {new Date().getFullYear()} VIERCYS · Concept property</span>
        <small>
          Temporary editorial photography · Not original property photographs.
        </small>
      </div>
    </footer>
  );
}
