
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const idOf = (product) => String(product.id);

function capacity(value) {
  const match = String(value ?? "")
    .toUpperCase()
    .match(/(\d+(?:\.\d+)?)\s*(TB|GB)?/);

  return match
    ? Number(match[1]) * (match[2] === "TB" ? 1024 : 1)
    : null;
}

function matchesCategory(product, choice) {
  if (choice === "ALL") return true;

  const category = String(
    product.category || ""
  ).toUpperCase();

  return choice === "MOBILE"
    ? category.includes("MOBILE")
    : category.includes("TABLET");
}

export default function ProductCatalog({ products = [] }) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [ram, setRam] = useState("ALL");
  const [storage, setStorage] = useState("ALL");
  const [budget, setBudget] = useState("ALL");
  const [sort, setSort] = useState("name");
  const [stockOnly, setStockOnly] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [visible, setVisible] = useState(24);

  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState({});
  const [storageReady, setStorageReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // LOAD WISHLIST AND CART FROM BROWSER
  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(
        localStorage.getItem("gadgetkart_favorites") || "[]"
      );

      const storedCart = JSON.parse(
        localStorage.getItem("gadgetkart_cart") || "{}"
      );

      if (Array.isArray(storedFavorites)) {
        setFavorites(storedFavorites.map(String));
      }

      if (
        storedCart &&
        typeof storedCart === "object" &&
        !Array.isArray(storedCart)
      ) {
        setCart(storedCart);
      }
    } catch {
      // Invalid browser storage will not break the page.
    }

    setStorageReady(true);
  }, []);

  // SAVE WISHLIST AND CART
  useEffect(() => {
    if (!storageReady) return;

    try {
      localStorage.setItem(
        "gadgetkart_favorites",
        JSON.stringify(favorites)
      );

      localStorage.setItem(
        "gadgetkart_cart",
        JSON.stringify(cart)
      );
    } catch {
      // Storage may be blocked in private browsing.
    }
  }, [favorites, cart, storageReady]);

  // BRAND, RAM AND STORAGE OPTIONS FROM EXCEL
  const brands = useMemo(
    () => [...new Set(
      products.map(p => p.brand).filter(Boolean)
    )].sort(),
    [products]
  );

  const ramOptions = useMemo(
    () => [...new Set(
      products
        .map(p => capacity(p.specifications?.RAM))
        .filter(n => n !== null)
    )].sort((a, b) => a - b),
    [products]
  );

  const storageOptions = useMemo(
    () => [...new Set(
      products
        .map(p => capacity(p.specifications?.ROM))
        .filter(n => n !== null)
    )].sort((a, b) => a - b),
    [products]
  );

  const byId = useMemo(
    () => new Map(
      products.map(p => [idOf(p), p])
    ),
    [products]
  );

  // ADVANCED SEARCH AND FILTER
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter(p => {
      const specs = p.specifications || {};

      const searchable = [
        p.brand,
        p.name,
        p.category,
        p.colors,
        specs.RAM,
        specs.ROM,
        specs.Chipset,
        specs.Processor,
        specs.Battery,
        specs["Rear Camera"]
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const price = Number(p.price || 0);

      let inPriceRange = true;

      if (budget === "under10") {
        inPriceRange = price < 10000;
      }

      if (budget === "10to20") {
        inPriceRange = price >= 10000 && price < 20000;
      }

      if (budget === "20to30") {
        inPriceRange = price >= 20000 && price < 30000;
      }

      if (budget === "30to50") {
        inPriceRange = price >= 30000 && price < 50000;
      }

      if (budget === "above50") {
        inPriceRange = price >= 50000;
      }

      return (
        searchable.includes(query) &&
        matchesCategory(p, category) &&
        (brand === "ALL" || p.brand === brand) &&
        (ram === "ALL" ||
          capacity(specs.RAM) === Number(ram)) &&
        (storage === "ALL" ||
          capacity(specs.ROM) === Number(storage)) &&
        inPriceRange &&
        (!stockOnly || Boolean(p.in_stock)) &&
        (!wishlistOnly || favorites.includes(idOf(p)))
      );
    }).sort((a, b) => {
      if (sort === "low") {
        return Number(a.price) - Number(b.price);
      }

      if (sort === "high") {
        return Number(b.price) - Number(a.price);
      }

      return `${a.brand} ${a.name}`.localeCompare(
        `${b.brand} ${b.name}`
      );
    });
  }, [
    products,
    search,
    category,
    brand,
    ram,
    storage,
    budget,
    sort,
    stockOnly,
    wishlistOnly,
    favorites
  ]);

  // LIVE SEARCH SUGGESTIONS
  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query.length < 2) return [];

    return products.filter(p =>
      `${p.brand} ${p.name}`.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [search, products]);

  // CART CALCULATIONS
  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: byId.get(id),
      quantity: Math.max(0, Number(quantity) || 0)
    }))
    .filter(item => item.product && item.quantity > 0);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.product.price) * item.quantity,
    0
  );

  const comparedProducts = compareIds
    .map(id => byId.get(id))
    .filter(Boolean);

  // RESET FILTERS
  function resetFilters() {
    setSearch("");
    setCategory("ALL");
    setBrand("ALL");
    setRam("ALL");
    setStorage("ALL");
    setBudget("ALL");
    setSort("name");
    setStockOnly(false);
    setWishlistOnly(false);
    setVisible(24);
  }

  // ADD / REMOVE WISHLIST
  function toggleFavorite(id) {
    const key = String(id);

    setFavorites(old =>
      old.includes(key)
        ? old.filter(item => item !== key)
        : [...old, key]
    );
  }

  // ADD TO CART
  function addToCart(product) {
    if (!product.in_stock) return;

    const id = idOf(product);

    setCart(old => ({
      ...old,
      [id]: Math.min(
        99,
        (Number(old[id]) || 0) + 1
      )
    }));

    setCartOpen(true);
  }

  // CART QUANTITY
  function changeQuantity(id, change) {
    setCart(old => {
      const next = { ...old };

      const quantity = Math.min(
        99,
        Math.max(0, (Number(next[id]) || 0) + change)
      );

      if (quantity === 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }

      return next;
    });
  }

  // SELECT PRODUCTS FOR COMPARISON
  function toggleCompare(id) {
    const key = String(id);

    setCompareIds(old =>
      old.includes(key)
        ? old.filter(item => item !== key)
        : old.length < 4
          ? [...old, key]
          : old
    );
  }

  const compareRows = [
    ["Price", p => money(p.price)],
    ["Brand", p => p.brand || "—"],
    ["RAM", p => p.specifications?.RAM || "—"],
    ["Storage", p => p.specifications?.ROM || "—"],
    ["Processor", p =>
      p.specifications?.Chipset ||
      p.specifications?.Processor || "—"
    ],
    ["Display", p =>
      p.specifications?.["Screen Size"] || "—"
    ],
    ["Rear Camera", p =>
      p.specifications?.["Rear Camera"] || "—"
    ],
    ["Battery", p =>
      p.specifications?.Battery || "—"
    ],
    ["Charging", p =>
      p.specifications?.Charging || "—"
    ],
    ["Stock", p =>
      p.in_stock ? "In stock" : "Out of stock"
    ]
  ];

  return (
    <>
      {/* STICKY SEARCH AND SHOPPING BAR */}

      <section className="gk-tools">
        <div className="gk-search-area">
          <span className="gk-search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            aria-label="Search products"
            placeholder="Search mobiles, tablets, RAM, processor..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setVisible(24);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="gk-suggestions">
              {suggestions.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setSearch(`${p.brand} ${p.name}`);
                    setVisible(24);
                    setShowSuggestions(false);
                  }}
                >
                  <span>
                    {p.brand} {p.name}
                  </span>

                  <b>{money(p.price)}</b>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="gk-actions">
          <button
            type="button"
            className={
              wishlistOnly
                ? "gk-action selected"
                : "gk-action"
            }
            onClick={() => {
              setWishlistOnly(v => !v);
              setVisible(24);
            }}
            aria-pressed={wishlistOnly}
          >
            ♡ <span>Wishlist ({favorites.length})</span>
          </button>

          <button
            type="button"
            className="gk-action"
            onClick={() => setCartOpen(true)}
          >
            🛒 <span>Cart ({cartCount})</span>
          </button>
        </div>
      </section>

      {/* ADVANCED FILTER PANEL */}

      <section className="gk-filter-panel">
        <div className="gk-filter-heading">
          <div>
            <h2>Explore Tech</h2>
            <p>Find the right device for your budget.</p>
          </div>

          <button
            className="gk-reset"
            type="button"
            onClick={resetFilters}
          >
            Reset all filters
          </button>
        </div>

        {/* CATEGORY TABS */}

        <div className="gk-category-tabs">
          {[
            ["ALL", "All products"],
            ["MOBILE", "Mobiles"],
            ["TABLET", "Tablets"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={category === value ? "active" : ""}
              onClick={() => {
                setCategory(value);
                setVisible(24);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FILTER DROPDOWNS */}

        <div className="gk-filter-grid">
          <label>
            Brand
            <select
              value={brand}
              onChange={e => {
                setBrand(e.target.value);
                setVisible(24);
              }}
            >
              <option value="ALL">All brands</option>

              {brands.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Price
            <select
              value={budget}
              onChange={e => {
                setBudget(e.target.value);
                setVisible(24);
              }}
            >
              <option value="ALL">All prices</option>
              <option value="under10">Below ₹10,000</option>
              <option value="10to20">₹10,000 – ₹19,999</option>
              <option value="20to30">₹20,000 – ₹29,999</option>
              <option value="30to50">₹30,000 – ₹49,999</option>
              <option value="above50">₹50,000 and above</option>
            </select>
          </label>

          <label>
            RAM
            <select
              value={ram}
              onChange={e => {
                setRam(e.target.value);
                setVisible(24);
              }}
            >
              <option value="ALL">Any RAM</option>

              {ramOptions.map(n => (
                <option key={n} value={String(n)}>
                  {n} GB
                </option>
              ))}
            </select>
          </label>

          <label>
            Storage
            <select
              value={storage}
              onChange={e => {
                setStorage(e.target.value);
                setVisible(24);
              }}
            >
              <option value="ALL">Any storage</option>

              {storageOptions.map(n => (
                <option key={n} value={String(n)}>
                  {n} GB
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort by
            <select
              value={sort}
              onChange={e => {
                setSort(e.target.value);
                setVisible(24);
              }}
            >
              <option value="name">Name A–Z</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </label>
        </div>

        <label className="gk-checkline">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={e => {
              setStockOnly(e.target.checked);
              setVisible(24);
            }}
          />
          In-stock products only
        </label>
      </section>

      {/* PRODUCT RESULT COUNT */}

      <div className="gk-results-heading">
        <h2>
          Products <small>({filtered.length} found)</small>
        </h2>

        <span>Select 2–4 products to compare</span>
      </div>

      {/* PRODUCT CARDS */}

      <section className="product-grid">
        {filtered.slice(0, visible).map(p => {
          const specs = p.specifications || {};
          const id = idOf(p);
          const mrp = Number(p.mrp || 0);
          const price = Number(p.price || 0);

          const discount =
            mrp > price
              ? Math.round((1 - price / mrp) * 100)
              : 0;

          const liked = favorites.includes(id);
          const compared = compareIds.includes(id);

          const isTablet = String(
            p.category || ""
          ).toUpperCase().includes("TABLET");

          return (
            <article className="product-card" key={id}>
              <div className="gk-image-wrap">
                <Link
                  href={`/product/${id}`}
                  className="product-image"
                  aria-label={`View ${p.brand} ${p.name}`}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`${p.brand} ${p.name}`}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="placeholder-device"
                      aria-hidden="true"
                    >
                      {isTablet ? "▭" : "▯"}
                    </div>
                  )}
                </Link>

                {/* WISHLIST HEART */}

                <button
                  type="button"
                  className={
                    liked ? "gk-heart liked" : "gk-heart"
                  }
                  aria-label={
                    liked
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  aria-pressed={liked}
                  onClick={() => toggleFavorite(id)}
                >
                  {liked ? "♥" : "♡"}
                </button>

                {discount > 0 && (
                  <span className="gk-sale">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <div className="product-info">
                <span className="product-brand">
                  {p.brand}
                </span>

                <Link
                  href={`/product/${id}`}
                  className="gk-product-title"
                >
                  {p.brand} {p.name}
                </Link>

                <p className="variant">
                  {specs.RAM || "RAM not listed"}
                  {" · "}
                  {specs.ROM || "Storage not listed"}
                </p>

                <div className="price-section">
                  <strong>{money(price)}</strong>

                  {mrp > price && (
                    <del>{money(mrp)}</del>
                  )}
                </div>

                <p
                  className={
                    p.in_stock
                      ? "gk-stock yes"
                      : "gk-stock no"
                  }
                >
                  {p.in_stock
                    ? "● In stock"
                    : "● Out of stock"}
                </p>

                <div className="gk-mini-specs">
                  {specs.Chipset && (
                    <span>
                      Processor: {specs.Chipset}
                    </span>
                  )}

                  {specs.Battery && (
                    <span>
                      Battery: {specs.Battery}
                    </span>
                  )}

                  {specs["Rear Camera"] && (
                    <span>
                      Camera: {specs["Rear Camera"]}
                    </span>
                  )}
                </div>

                {/* COMPARE CHECKBOX */}

                <label className="gk-compare-check">
                  <input
                    type="checkbox"
                    checked={compared}
                    disabled={
                      !compared && compareIds.length >= 4
                    }
                    onChange={() => toggleCompare(id)}
                  />
                  Compare
                </label>

                <div className="gk-product-buttons">
                  <Link
                    href={`/product/${id}`}
                    className="gk-view-button"
                  >
                    View details
                  </Link>

                  <button
                    type="button"
                    className="gk-cart-button"
                    disabled={!p.in_stock}
                    onClick={() => addToCart(p)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* NO RESULTS */}

      {filtered.length === 0 && (
        <div className="gk-empty">
          <h3>No products found</h3>
          <p>Search ya filters change karke dekhein.</p>

          <button type="button" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      )}

      {/* LOAD MORE */}

      {visible < filtered.length && (
        <div className="gk-load-more">
          <button
            type="button"
            onClick={() => setVisible(n => n + 24)}
          >
            Load more products
          </button>
        </div>
      )}

      {/* FLOATING COMPARE BAR */}

      {compareIds.length > 0 && (
        <div className="gk-compare-bar">
          <span>
            <strong>{compareIds.length}/4</strong>
            {" "}products selected
          </span>

          <div>
            <button
              type="button"
              className="gk-text-button"
              onClick={() => setCompareIds([])}
            >
              Clear
            </button>

            <button
              type="button"
              className="gk-primary-button"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              Compare now
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT COMPARISON MODAL */}

      {compareOpen && (
        <div
          className="gk-modal-backdrop"
          onClick={() => setCompareOpen(false)}
        >
          <section
            className="gk-compare-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Product comparison"
            onClick={e => e.stopPropagation()}
          >
            <div className="gk-modal-title">
              <h2>Compare Devices</h2>

              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                aria-label="Close comparison"
              >
                ✕
              </button>
            </div>

            <div className="gk-compare-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>

                    {comparedProducts.map(p => (
                      <th key={p.id}>
                        <Link href={`/product/${p.id}`}>
                          {p.brand} {p.name}
                        </Link>

                        <button
                          type="button"
                          onClick={() => toggleCompare(p.id)}
                          aria-label={`Remove ${p.name}`}
                        >
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {compareRows.map(([label, value]) => (
                    <tr key={label}>
                      <th>{label}</th>

                      {comparedProducts.map(p => (
                        <td key={p.id}>
                          {value(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}

      {cartOpen && (
        <div
          className="gk-modal-backdrop"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="gk-cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            onClick={e => e.stopPropagation()}
          >
            <div className="gk-modal-title">
              <h2>My Cart ({cartCount})</h2>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="gk-cart-list">
              {cartItems.length === 0 ? (
                <div className="gk-empty">
                  <h3>Cart is empty</h3>
                  <p>Products add karke dekhein.</p>
                </div>
              ) : (
                cartItems.map(({ product, quantity }) => (
                  <div
                    className="gk-cart-item"
                    key={product.id}
                  >
                    <div>
                      <Link
                        href={`/product/${product.id}`}
                      >
                        {product.brand} {product.name}
                      </Link>

                      <p>{money(product.price)} each</p>
                    </div>

                    <div className="gk-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(idOf(product), -1)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <strong>{quantity}</strong>

                      <button
                        type="button"
                        disabled={
                          !product.in_stock ||
                          quantity >= 99
                        }
                        onClick={() =>
                          changeQuantity(idOf(product), 1)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="gk-cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{money(cartTotal)}</strong>
              </div>

              <p>
                Yeh demo cart hai. Abhi online payments
                aur orders enabled nahi hain.
              </p>

              <button
                type="button"
                disabled
                className="gk-primary-button"
              >
                Checkout — Coming Soon
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
