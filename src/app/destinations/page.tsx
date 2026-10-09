import Link from "next/link";
import { Navigation, Footer, Photo } from "../experience";
import { photos } from "../data";
export default function Destinations() {
  return (
    <>
      <Navigation />
      <main id="main" className="inner-main">
        <p className="eyebrow">THE VIERCYS COLLECTION</p>
        <h1>
          New horizons.
          <br />
          <em>One philosophy.</em>
        </h1>
        <p className="lead">
          Our journey begins in Santorini. Boracay, Amalfi and Bali are future
          destination concepts, coming soon.
        </p>
        <div className="all-destinations">
          {[
            {
              name: "Santorini",
              country: "GREECE",
              src: photos.hero,
              live: true,
            },
            { name: "Boracay", country: "PHILIPPINES", src: photos.boracay },
            { name: "Amalfi", country: "ITALY", src: photos.amalfi },
            { name: "Bali", country: "INDONESIA", src: photos.bali },
          ].map((d) => (
            <article key={d.name} className="destination">
              <div className="destination-image">
                <Photo src={d.src} alt={`${d.name} coastal landscape`} />
                <span className="destination-status">
                  {d.live ? "OUR FIRST ADDRESS" : "COMING SOON"}
                </span>
              </div>
              <div className="destination-meta">
                <span>{d.country}</span>
                <h2>{d.name}</h2>
                {d.live ? (
                  <Link className="text-link" href="/santorini">
                    Discover Santorini ↗
                  </Link>
                ) : (
                  <div>
                    <p className="demo-note">
                      Future destination · Reservations unavailable
                    </p>
                    <Link
                      className="text-link"
                      href={`/destinations/${d.name.toLowerCase()}`}
                    >
                      Preview destination ↗
                    </Link>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
