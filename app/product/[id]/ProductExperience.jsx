
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./product.module.css";

const money = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

function readSaved(key, fallback) {
  try {
    return JSON.parse(
      localStorage.getItem(key) || "null"
    ) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function ProductExperience({
  product,
  variants = []
}) {
  const images =
    Array.isArray(product.images) &&
    product.images.length
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];

  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState([]);
  const [liked, setLiked] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const specs = product.specifications || {};

  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);

  const discount =
    mrp > price
      ? Math.round((1 - price / mrp) * 100)
      : 0;

  const cashback = Number(product.cashback || 0);

  const hasBankOffer = Boolean(product.bank_name);

  const offers = product.offers || {};

  const colors = String(product.colors || "")
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean);

  // KEY PRODUCT FEATURES
  const featured = [
    ["RAM", specs.RAM],
    ["Storage", specs.ROM],
    ["Processor", specs.Chipset || specs.Processor],
    ["Battery", specs.Battery],
    ["Display", specs["Screen Size"]],
    ["Camera", specs["Rear Camera"]]
  ].filter(([, value]) => value);

  const fullSpecs = Object.entries(specs)
    .filter(([, value]) => value);

  // LOAD SAVED WISHLIST
  useEffect(() => {
    const saved = readSaved(
      "gadgetkart_favorites",
      []
    );

    setLiked(
      Array.isArray(saved) &&
      saved.map(String).includes(
        String(product.id)
      )
    );
  }, [product.id]);

  // ADD OR REMOVE FROM WISHLIST
  function toggleWishlist() {
    const old = readSaved(
      "gadgetkart_favorites",
      []
    );

    const list = Array.isArray(old)
      ? old.map(String)
      : [];

    const id = String(product.id);

    const next = list.includes(id)
      ? list.filter(item => item !== id)
      : [...list, id];

    try {
      localStorage.setItem(
        "gadgetkart_favorites",
        JSON.stringify(next)
      );

      setLiked(next.includes(id));
    } catch {
      setCartMessage(
        "Browser storage blocked hai; wishlist save nahi hui."
      );
    }
  }

  // ADD PRODUCT TO EXISTING CART
  function addToCart() {
    if (!product.in_stock) return;

    const old = readSaved(
      "gadgetkart_cart",
      {}
    );

    const saved =
      old &&
      typeof old === "object" &&
      !Array.isArray(old)
        ? old
        : {};

    const id = String(product.id);

    const next = {
      ...saved,
      [id]: Math.min(
        99,
        (Number(saved[id]) || 0) + 1
      )
    };

    try {
      localStorage.setItem(
        "gadgetkart_cart",
        JSON.stringify(next)
      );

      setCartMessage(
        "Added to cart! Homepage par Cart button se dekh sakte hain."
      );
    } catch {
      setCartMessage(
        "Browser storage blocked hai; cart save nahi hua."
      );
    }
  }

  const activeImage = images[active];

  const showImage =
    activeImage &&
    !failed.includes(active);

  const noImages = images.length === 0;

  return (
    <>
      {/* HEADER */}

      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            Gadget<span>Kart</span>
          </Link>

          <span className="header-text">
            Product Details
          </span>
        </div>
      </header>

      <main className={styles.page}>

        {/* BREADCRUMB */}

        <nav
          className={styles.breadcrumb}
          aria-label="Breadcrumb"
        >
          <Link href="/">Home</Link>
          <span> / </span>
          <span>
            {product.brand} {product.name}
          </span>
        </nav>

        <section className={styles.mainGrid}>

          {/* PRODUCT PHOTO GALLERY */}

          <div className={styles.galleryCard}>
            <div className={styles.mainPhoto}>

              {showImage ? (
                <img
                  src={activeImage}
                  alt={`${product.brand} ${product.name} image ${active + 1}`}
                  onError={() => {
                    setFailed(prev => [
                      ...new Set([
                        ...prev,
                        active
                      ])
                    ]);
                  }}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span aria-hidden="true">
                    {String(product.category)
                      .toUpperCase()
                      .includes("TABLET")
                      ? "▭"
                      : "▯"}
                  </span>

                  <p>
                    {noImages
                      ? "Product photo not uploaded"
                      : "Image unavailable"}
                  </p>
                </div>
              )}

            </div>

            {/* GALLERY NAVIGATION */}

            {images.length > 1 && (
              <>
                <div className={styles.galleryArrows}>
                  <button
                    type="button"
                    onClick={() =>
                      setActive(i =>
                        (i - 1 + images.length) %
                        images.length
                      )
                    }
                    aria-label="Previous image"
                  >
                    ←
                  </button>

                  <span>
                    {active + 1} / {images.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setActive(i =>
                        (i + 1) %
                        images.length
                      )
                    }
                    aria-label="Next image"
                  >
                    →
                  </button>
                </div>

                {/* THUMBNAILS */}

                <div className={styles.thumbnails}>
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      aria-label={`Show image ${index + 1}`}
                      aria-pressed={active === index}
                      className={
                        active === index
                          ? styles.thumbActive
                          : ""
                      }
                      onClick={() => setActive(index)}
                    >
                      <img
                        src={image}
                        alt=""
                        onError={e => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}

            {noImages && (
              <p className={styles.helper}>
                Photos ke liye Excel mein
                IMAGE URL, IMAGE URL 2 ...
                IMAGE URL 5 columns add kar sakte hain.
              </p>
            )}
          </div>

          {/* PRODUCT INFORMATION */}

          <div className={styles.infoCard}>
            <p className={styles.brand}>
              {product.brand}
            </p>

            <h1>
              {product.brand} {product.name}
            </h1>

            <p className={styles.subheading}>
              {product.category}

              {product.segment
                ? ` · ${product.segment}`
                : ""}
            </p>

            {/* PRICE */}

            <div className={styles.priceArea}>
              <strong>
                {money(price)}
              </strong>

              {mrp > price && (
                <del>{money(mrp)}</del>
              )}

              {discount > 0 && (
                <span className={styles.discount}>
                  {discount}% off
                </span>
              )}
            </div>

            <p
              className={
                product.in_stock
                  ? styles.stockYes
                  : styles.stockNo
              }
            >
              ● {product.in_stock
                ? "In Stock"
                : "Out of Stock"}
            </p>

            {/* RAM / STORAGE VARIANTS */}

            {variants.length > 1 && (
              <section className={styles.sectionWithin}>
                <h2>RAM / Storage Variants</h2>

                <div className={styles.variantGrid}>
                  {variants.map(v => (
                    <Link
                      key={v.id}
                      href={`/product/${v.id}`}
                      aria-current={
                        String(v.id) === String(product.id)
                          ? "page"
                          : undefined
                      }
                      className={`
                        ${styles.variant}
                        ${
                          String(v.id) === String(product.id)
                            ? styles.selectedVariant
                            : ""
                        }
                      `}
                    >
                      <strong>
                        {v.ram || "RAM ?"}
                        {" / "}
                        {v.storage || "Storage ?"}
                      </strong>

                      <span>
                        {money(v.price)}
                      </span>

                      {!v.in_stock && (
                        <small>
                          Out of stock
                        </small>
                      )}
                    </Link>
                  ))}
                </div>

                <p className={styles.helper}>
                  Variant select karne par uska actual
                  product page aur price khulega.
                </p>
              </section>
            )}

            {/* COLOR OPTIONS */}

            {colors.length > 0 && (
              <section className={styles.sectionWithin}>
                <h2>Listed Colors</h2>

                <div className={styles.colorGrid}>
                  {colors.map(color => (
                    <span
                      key={color}
                      className={styles.colorTag}
                    >
                      {color}
                    </span>
                  ))}
                </div>

                <p className={styles.helper}>
                  Color-wise stock Excel mein nahi hai;
                  purchase se pehle availability
                  confirm karein.
                </p>
              </section>
            )}

            {/* SHOPPING BUTTONS */}

            <div className={styles.buyButtons}>
              <button
                type="button"
                className={styles.cartButton}
                onClick={addToCart}
                disabled={!product.in_stock}
              >
                🛒 Add to Cart
              </button>

              <button
                type="button"
                className={styles.wishlistButton}
                onClick={toggleWishlist}
                aria-pressed={liked}
              >
                {liked
                  ? "♥ Saved"
                  : "♡ Wishlist"}
              </button>
            </div>

            {cartMessage && (
              <p
                className={styles.feedback}
                role="status"
              >
                {cartMessage}
              </p>
            )}

            <p className={styles.helper}>
              Cart abhi browser mein save hota hai.
              Online checkout/payment abhi available
              nahi hai.
            </p>
          </div>
        </section>

        {/* PRODUCT HIGHLIGHTS */}

        {featured.length > 0 && (
          <section className={styles.lowerCard}>
            <h2>Product Highlights</h2>

            <div className={styles.highlightGrid}>
              {featured.map(([label, value]) => (
                <div
                  key={label}
                  className={styles.highlight}
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* OFFERS SECTION */}

        <section className={styles.lowerCard}>
          <h2>Offers & Savings</h2>

          {discount > 0 && (
            <p className={styles.offerRow}>
              🏷️ {discount}% below listed MRP
              {" "}
              ({money(mrp - price)} difference).
            </p>
          )}

          {cashback > 0 && (
            <p className={styles.offerRow}>
              💳 Excel-listed cashback:
              {" "}
              {money(cashback)}.
            </p>
          )}

          {hasBankOffer && (
            <p className={styles.offerRow}>
              🏦 Bank: {product.bank_name}

              {offers.tenure
                ? ` · Tenure: ${offers.tenure}`
                : ""}
              .
            </p>
          )}

          {!hasBankOffer &&
            cashback <= 0 &&
            discount <= 0 && (
              <p className={styles.helper}>
                Abhi is product ke liye koi
                customer offer Excel mein
                listed nahi hai.
              </p>
            )}

          {(discount > 0 ||
            cashback > 0 ||
            hasBankOffer) && (
              <p className={styles.helper}>
                Offers, validity aur eligibility
                purchase se pehle confirm karein.
                Dealer Net Landing ko customer offer
                nahi maana gaya hai.
              </p>
            )}
        </section>

        {/* FULL SPECIFICATIONS */}

        <section className={styles.lowerCard}>
          <h2>Full Specifications</h2>

          <div className={styles.specTable}>
            {[
              ["Brand", product.brand],
              ["Model", product.name],
              ["Category", product.category],
              ["Colors", product.colors],
              ...fullSpecs
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div
                  key={label}
                  className={styles.specRow}
                >
                  <span>{label}</span>

                  <strong>
                    {String(value)}
                  </strong>
                </div>
              ))}
          </div>
        </section>

        <div className={styles.backBottom}>
          <Link href="/">
            ← Back to all products
          </Link>
        </div>
      </main>

      <footer className="footer">
        <p>
          © GadgetKart — Mobile & Tablet Price Catalog
        </p>

        <p>
          Prices, offers and stock are subject
          to confirmation.
        </p>
      </footer>
    </>
  );
}
