
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// PRICE FORMAT
const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function ProductCatalog({ products = [] }) {

  // SEARCH AND FILTER STATES
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [budget, setBudget] = useState("ALL");
  const [sort, setSort] = useState("name");
  const [stockOnly, setStockOnly] = useState(false);
  const [visible, setVisible] = useState(24);

  // ALL BRANDS FROM EXCEL
  const brands = useMemo(
    () =>
      [...new Set(products.map(p => p.brand).filter(Boolean))]
        .sort(),
    [products]
  );

  // FILTER PRODUCTS
  const filtered = useMemo(() => {

    const query = search.trim().toLowerCase();

    return products
      .filter(product => {

        const specs = product.specifications || {};

        const searchText = [
          product.brand,
          product.name,
          product.category,
          specs.RAM,
          specs.ROM,
          specs.Chipset,
          specs.Processor
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const productCategory = String(
          product.category || ""
        ).toUpperCase();

        const isMobile = productCategory.includes("MOBILE");
        const isTablet = productCategory.includes("TABLET");

        const price = Number(product.price);

        // PRICE FILTER
        let budgetMatch = true;

        if (budget === "under10") {
          budgetMatch = price < 10000;
        }

        if (budget === "10to20") {
          budgetMatch = price >= 10000 && price < 20000;
        }

        if (budget === "20to30") {
          budgetMatch = price >= 20000 && price < 30000;
        }

        if (budget === "above30") {
          budgetMatch = price >= 30000;
        }

        return (
          searchText.includes(query) &&
          (brand === "ALL" || product.brand === brand) &&
          (
            category === "ALL" ||
            (category === "MOBILE" && isMobile) ||
            (category === "TABLET" && isTablet)
          ) &&
          budgetMatch &&
          (!stockOnly || product.in_stock)
        );

      })
      .sort((a, b) => {

        if (sort === "low") {
          return Number(a.price) - Number(b.price);
        }

        if (sort === "high") {
          return Number(b.price) - Number(a.price);
        }

        return (
          String(a.brand || "") + String(a.name || "")
        ).localeCompare(
          String(b.brand || "") + String(b.name || "")
        );

      });

  }, [
    products,
    search,
    brand,
    category,
    budget,
    sort,
    stockOnly
  ]);

  // RESET FILTERS
  function resetFilters() {
    setSearch("");
    setBrand("ALL");
    setCategory("ALL");
    setBudget("ALL");
    setSort("name");
    setStockOnly(false);
    setVisible(24);
  }

  // FILTER INPUT DESIGN
  const fieldStyle = {
    padding: "13px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "white",
    fontSize: "14px",
    flex: "1 1 160px",
    minWidth: 0
  };

  return (
    <>

      {/* SEARCH AND FILTER SECTION */}

      <section
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "1px solid #e2e8f0"
        }}
      >

        <h2
          style={{
            marginTop: 0,
            fontSize: "21px"
          }}
        >
          🔍 Search & Filter Products
        </h2>

        {/* SEARCH BAR */}

        <input
          type="search"
          placeholder="Search Samsung, Vivo, Oppo, iPhone, RAM..."
          aria-label="Search products"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setVisible(24);
          }}
          style={{
            ...fieldStyle,
            width: "100%",
            marginBottom: "14px"
          }}
        />

        {/* FILTER DROPDOWNS */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >

          {/* CATEGORY FILTER */}

          <select
            aria-label="Category"
            value={category}
            style={fieldStyle}
            onChange={e => {
              setCategory(e.target.value);
              setVisible(24);
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="MOBILE">Mobile Phones</option>
            <option value="TABLET">Tablets</option>
          </select>

          {/* BRAND FILTER */}

          <select
            aria-label="Brand"
            value={brand}
            style={fieldStyle}
            onChange={e => {
              setBrand(e.target.value);
              setVisible(24);
            }}
          >
            <option value="ALL">All Brands</option>

            {brands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* PRICE FILTER */}

          <select
            aria-label="Price range"
            value={budget}
            style={fieldStyle}
            onChange={e => {
              setBudget(e.target.value);
              setVisible(24);
            }}
          >
            <option value="ALL">All Prices</option>
            <option value="under10">Below ₹10,000</option>
            <option value="10to20">₹10,000 - ₹19,999</option>
            <option value="20to30">₹20,000 - ₹29,999</option>
            <option value="above30">₹30,000 & Above</option>
          </select>

          {/* SORTING */}

          <select
            aria-label="Sort products"
            value={sort}
            style={fieldStyle}
            onChange={e => {
              setSort(e.target.value);
              setVisible(24);
            }}
          >
            <option value="name">Name A-Z</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>

        </div>

        {/* STOCK FILTER AND RESET */}

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "18px"
          }}
        >

          <label>
            <input
              type="checkbox"
              checked={stockOnly}
              onChange={e => {
                setStockOnly(e.target.checked);
                setVisible(24);
              }}
            />
            {" "}In Stock Only
          </label>

          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: "10px 18px",
              background: "#2874f0",
              color: "white",
              border: "none",
              borderRadius: "7px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Reset Filters
          </button>

        </div>

      </section>

      {/* PRODUCT COUNT */}

      <div className="section-title">
        <h2>Explore Products</h2>

        <span>
          {filtered.length} Products Found
        </span>
      </div>

      {/* PRODUCT GRID */}

      <section className="product-grid">

        {filtered.slice(0, visible).map(product => {

          const price = Number(product.price);
          const mrp = Number(product.mrp || 0);

          const discount =
            mrp > price
              ? Math.round((1 - price / mrp) * 100)
              : 0;

          const isTablet = String(
            product.category || ""
          ).toUpperCase().includes("TABLET");

          const specs = product.specifications || {};

          return (

            <article
              className="product-card"
              key={product.id}
            >

              {/* PRODUCT IMAGE */}

              <div className="product-image">

                {product.image_url ? (

                  <img
                    src={product.image_url}
                    alt={`${product.brand} ${product.name}`}
                    loading="lazy"
                  />

                ) : (

                  <div className="placeholder-device">
                    {isTablet ? "💻" : "📱"}
                  </div>

                )}

              </div>

              {/* PRODUCT INFORMATION */}

              <div className="product-info">

                {/* BRAND */}

                <div className="product-brand">
                  {product.brand}
                </div>

                {/* PRODUCT NAME */}

                <h3>
                  {product.brand} {product.name}
                </h3>

                {/* RAM AND STORAGE */}

                <div className="variant">
                  {specs.RAM || "RAM N/A"}
                  {" | "}
                  {specs.ROM || "Storage N/A"}
                </div>

                {/* PRODUCT PRICE */}

                <div className="price-section">

                  <strong>
                    {rupees(price)}
                  </strong>

                  {mrp > price && (
                    <del>
                      {rupees(mrp)}
                    </del>
                  )}

                </div>

                {/* DISCOUNT */}

                {discount > 0 && (
                  <p className="discount">
                    {discount}% OFF
                  </p>
                )}

                {/* STOCK STATUS */}

                <div className="stock-status">

                  {product.in_stock ? (

                    <span className="in-stock">
                      ● In Stock
                    </span>

                  ) : (

                    <span className="out-stock">
                      ● Out of Stock
                    </span>

                  )}

                </div>

                {/* PRODUCT HIGHLIGHTS */}

                <div className="highlights">

                  {specs.Chipset && (
                    <p>
                      <b>Chipset:</b> {specs.Chipset}
                    </p>
                  )}

                  {specs.Battery && (
                    <p>
                      <b>Battery:</b> {specs.Battery}
                    </p>
                  )}

                  {specs["Rear Camera"] && (
                    <p>
                      <b>Camera:</b> {specs["Rear Camera"]}
                    </p>
                  )}

                </div>

                {/* FULL SPECIFICATIONS */}

                <details className="spec-details">

                  <summary>
                    View Full Specifications
                  </summary>

                  <div className="spec-list">

                    {product.colors && (
                      <p>
                        <b>Colors:</b> {product.colors}
                      </p>
                    )}

                    {Object.entries(specs)
                      .filter(([, value]) => value)
                      .map(([key, value]) => (

                        <p key={key}>
                          <b>{key}:</b> {String(value)}
                        </p>

                      ))}

                  </div>

                </details>

                {/* VIEW DETAILS BUTTON */}

                <Link
                  href={`/product/${product.id}`}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    background: "#2874f0",
                    color: "#ffffff",
                    padding: "14px",
                    marginTop: "18px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textDecoration: "none"
                  }}
                >
                  View Details →
                </Link>

              </div>

            </article>

          );

        })}

      </section>

      {/* EMPTY SEARCH RESULTS */}

      {filtered.length === 0 && (

        <div
          style={{
            textAlign: "center",
            padding: "45px",
            background: "white",
            borderRadius: "12px"
          }}
        >
          <h3>No Products Found</h3>

          <p>
            Try changing your search or filters.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: "12px 20px",
              background: "#2874f0",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Clear All Filters
          </button>

        </div>

      )}

      {/* LOAD MORE PRODUCTS */}

      {visible < filtered.length && (

        <div
          style={{
            textAlign: "center",
            marginTop: "30px"
          }}
        >

          <button
            type="button"
            onClick={() => setVisible(v => v + 24)}
            style={{
              background: "#2874f0",
              color: "white",
              padding: "14px 28px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Load More Products
          </button>

        </div>

      )}

    </>
  );
}
