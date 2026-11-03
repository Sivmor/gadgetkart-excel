
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "../../../lib/products";

export const dynamicParams = false;

const rupees = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

// Excel ke sabhi products ke detail pages banenge
export async function generateStaticParams() {
  const products = await getProducts();

  return products.map(product => ({
    id: String(product.id)
  }));
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const products = await getProducts();

  const product = products.find(
    item => String(item.id) === String(id)
  );

  if (!product) {
    notFound();
  }

  const price = Number(product.price);
  const mrp = Number(product.mrp || 0);

  const discount = mrp > price
    ? Math.round((1 - price / mrp) * 100)
    : 0;

  const isTablet = product.category
    .toUpperCase().includes("TABLET");

  const specifications = Object.entries(
    product.specifications || {}
  ).filter(([, value]) => value);

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(100px, 35%) 1fr",
    gap: "14px",
    padding: "13px 10px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    overflowWrap: "anywhere"
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            Gadget<span>Kart</span>
          </Link>

          <div className="header-text">
            Mobile & Tablet Details
          </div>
        </div>
      </header>

      <main className="container">

        <div style={{ marginBottom: "20px" }}>
          <Link
            href="/"
            style={{
              color: "#2874f0",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            ← Back to All Products
          </Link>
        </div>

        <section
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "24px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            border: "1px solid #e2e8f0"
          }}
        >

          {/* PRODUCT IMAGE */}

          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              minHeight: "300px",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={`${product.brand} ${product.name}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  objectFit: "contain"
                }}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "100px" }}>
                  {isTablet ? "💻" : "📱"}
                </div>
                <p style={{ color: "#64748b" }}>
                  Product Image Coming Soon
                </p>
              </div>
            )}
          </div>

          {/* PRODUCT INFORMATION */}

          <div>
            <p
              style={{
                color: "#2874f0",
                fontWeight: "bold",
                fontSize: "14px",
                textTransform: "uppercase"
              }}
            >
              {product.brand}
            </p>

            <h1
              style={{
                fontSize: "clamp(23px, 4vw, 32px)",
                lineHeight: 1.3,
                marginBottom: "12px"
              }}
            >
              {product.brand} {product.name}
            </h1>

            <p style={{ color: "#64748b" }}>
              {product.category}
              {product.segment ? ` | ${product.segment}` : ""}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                margin: "24px 0"
              }}
            >
              <strong style={{ fontSize: "32px" }}>
                {rupees(price)}
              </strong>

              {mrp > price && (
                <del style={{ color: "#94a3b8" }}>
                  {rupees(mrp)}
                </del>
              )}

              {discount > 0 && (
                <span
                  style={{
                    color: "#16803c",
                    fontWeight: "bold"
                  }}
                >
                  {discount}% OFF
                </span>
              )}
            </div>

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

            {product.colors && (
              <p>
                <b>Available Colors:</b> {product.colors}
              </p>
            )}

            <h3 style={{ marginTop: "25px" }}>
              Product Highlights
            </h3>

            <div className="highlights">
              {[
                "RAM",
                "ROM",
                "Chipset",
                "Screen Size",
                "Battery",
                "Rear Camera"
              ].filter(key => product.specifications?.[key])
                .map(key => (
                  <p key={key}>
                    <b>{key}:</b>{" "}
                    {product.specifications[key]}
                  </p>
                ))}
            </div>

            {product.bank_name && (
              <div
                style={{
                  background: "#eff6ff",
                  padding: "14px",
                  borderRadius: "8px",
                  marginTop: "20px"
                }}
              >
                <strong>Bank Offer Information</strong>
                <p>{product.bank_name}</p>

                {product.offers?.tenure && (
                  <p>
                    Tenure: {product.offers.tenure}
                  </p>
                )}

                <small>
                  Offer terms and eligibility must be
                  confirmed before purchase.
                </small>
              </div>
            )}
          </div>
        </section>

        {/* COMPLETE SPECIFICATIONS */}

        <section
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "24px",
            marginTop: "25px",
            border: "1px solid #e2e8f0"
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Full Specifications
          </h2>

          <div style={rowStyle}>
            <strong>Brand</strong>
            <span>{product.brand}</span>
          </div>

          <div style={rowStyle}>
            <strong>Model</strong>
            <span>{product.name}</span>
          </div>

          <div style={rowStyle}>
            <strong>Category</strong>
            <span>{product.category}</span>
          </div>

          {product.colors && (
            <div style={rowStyle}>
              <strong>Colors</strong>
              <span>{product.colors}</span>
            </div>
          )}

          {specifications.map(([key, value]) => (
            <div key={key} style={rowStyle}>
              <strong>{key}</strong>
              <span>{String(value)}</span>
            </div>
          ))}
        </section>

        <div style={{ marginTop: "30px" }}>
          <Link
            href="/"
            style={{
              background: "#2874f0",
              color: "white",
              borderRadius: "8px",
              padding: "14px 25px",
              display: "inline-block",
              fontWeight: "bold"
            }}
          >
            ← Explore More Products
          </Link>
        </div>
      </main>

      <footer className="footer">
        <p>
          © GadgetKart | Mobile & Tablet Price Catalog
        </p>
        <p>
          Prices and availability are subject to change.
        </p>
      </footer>
    </>
  );
}
