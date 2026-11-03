
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default function ProductCatalog({ products }) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [budget, setBudget] = useState("ALL");
  const [sort, setSort] = useState("name");
  const [stockOnly, setStockOnly] = useState(false);
  const [visible, setVisible] = useState(24);

  const brands = [...new Set(
    products.map(p => p.brand)
  )].sort();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter(p => {
      const searchText = [
        p.brand,
        p.name,
        p.category,
        p.specifications?.RAM,
        p.specifications?.ROM,
        p.specifications?.Chipset
      ].filter(Boolean).join(" ").toLowerCase();

      const isMobile = p.category
        .toUpperCase().includes("MOBILE");

      const isTablet = p.category
        .toUpperCase().includes("TABLET");

      const price = Number(p.price);

      let budgetMatch = true;

      if (budget === "under10") budgetMatch = price < 10000;
      if (budget === "10to20") {
        budgetMatch = price >= 10000 && price < 20000;
      }
      if (budget === "20to30") {
        budgetMatch = price >= 20000 && price < 30000;
      }
      if (budget === "above30") budgetMatch = price >= 30000;

      return (
        searchText.includes(query) &&
        (brand === "ALL" || p.brand === brand) &&
        (category === "ALL" ||
          (category === "MOBILE" && isMobile) ||
          (category === "TABLET" && isTablet)) &&
        budgetMatch &&
        (!stockOnly || p.in_stock)
      );
    }).sort((a, b) => {
      if (sort === "low") {
        return Number(a.price) - Number(b.price);
      }
      if (sort === "high") {
        return Number(b.price) - Number(a.price);
      }
      return (a.brand + a.name).localeCompare(
        b.brand + b.name
      );
    });
  }, [products, search, brand, category, budget, sort, stockOnly]);

  function resetFilters() {
    setSearch("");
    setBrand("ALL");
    setCategory("ALL");
    setBudget("ALL");
    setSort("name");
    setStockOnly(false);
    setVisible(24);
  }

  const fieldStyle = {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "white",
    fontSize: "14px",
    flex: "1 1 160px",
    minWidth: 0
  };

  return (
    <>
      <section
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "1px solid #e2e8f0"
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "21px" }}>
          Search & Filter Products
        </h2>

        <input
          type="search"
          placeholder="Search Samsung, Vivo, iPhone, RAM..."
          aria-label="Search products"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setVisible(24);
          }}
          style={{
            ...fieldStyle,
            width: "100%",
            marginBottom: "12px"
          }}
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
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

          <select
            aria-label="Sort by"
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

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "16px"
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
            onClick={resetFilters}
            style={{
              padding: "9px 16px",
              background: "#2874f0",
              color: "white",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer"
            }}
          >
            Reset Filters
          </button>
        </div>
      </section>

      <div className="section-title">
        <h2>Explore Products</h2>
        <span>{filtered.length} Products Found</span>
      </div>

      <section className="product-grid">
        {filtered.slice(0, visible).map(product => {
          const price = Number(product.price);
          const mrp = Number(product.mrp || 0);

          const discount = mrp > price
            ? Math.round((1 - price / mrp) * 100)
            : 0;

          const isTablet = product.category
            .toUpperCase().includes("TABLET");

          return (
            <article className="product-card" key={product.id}>
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

              <div className="product-info">
                <div className="product-brand">
                  {product.brand}
                </div>

                <h3>{product.brand} {product.name}</h3>

                <div className="variant">
                  {product.specifications?.RAM || "RAM N/A"}
                  {" | "}
                  {product.specifications?.ROM || "ROM N/A"}
                </div>

                <div className="price-section">
                  <strong>{rupees(price)}</strong>
                  {mrp > price && (
                    <del>{rupees(mrp)}</del>
                  )}
                </div>

                {discount > 0 && (
                  <p className="discount">{discount}% OFF</p>
                )}

                {product.net_price != null &&
                  Number(product.net_price) < price && (
                    <p className="cashback">
                      After Cashback: {rupees(product.net_price)}
                    </p>
                  )}

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

                <div className="highlights">
                  {product.specifications?.Chipset && (
                    <p>
                      <b>Chipset:</b>{" "}
                      {product.specifications.Chipset}
                    </p>
                  )}

                  {product.specifications?.Battery && (
                    <p>
                      <b>Battery:</b>{" "}
                      {product.specifications.Battery}
                    </p>
                  )}

                  {product.specifications?.["Rear Camera"] && (
                    <p>
                      <b>Camera:</b>{" "}
                      {product.specifications["Rear Camera"]}
                    </p>
                  )}
                </div>

                <details className="spec-details">
                  <summary>View Full Specifications</summary>

                  <div className="spec-list">
                    {product.colors && (
                      <p>
                        <b>Colors:</b> {product.colors}
                      </p>
                    )}

                    {Object.entries(
                      product.specifications || {}
                    ).filter(([, value]) => value)
                      .map(([key, value]) => (
                        <p key={key}>
                          <b>{key}:</b> {value}
                        </p>
                      ))}
                  </div>
                </details>
              </div>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h3>No Products Found</h3>
          <p>Please change your search or filters.</p>
        </div>
      )}

      {visible < filtered.length && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            onClick={() => setVisible(v => v + 24)}
            style={{
              background: "#2874f0",
              color: "white",
              padding: "13px 28px",
              borderRadius: "8px",
              border: "none",
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
