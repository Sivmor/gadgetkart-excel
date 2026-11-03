
import { getProducts } from "../lib/products";

export const dynamic = "force-static";

const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export default async function HomePage() {
  const products = await getProducts();

  const mobiles = products.filter(p =>
    p.category.toUpperCase().includes("MOBILE")
  ).length;

  const tablets = products.filter(p =>
    p.category.toUpperCase().includes("TABLET")
  ).length;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            Gadget<span>Kart</span>
          </div>

          <div className="header-text">
            Mobiles | Tablets | Latest Prices
          </div>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Find Your Perfect Smartphone</h1>

          <p>
            Compare mobile phones, tablets, prices
            and specifications in one place.
          </p>
        </section>

        <section className="stats">
          <div className="stat-box">
            <strong>{products.length}</strong>
            <span>Total Products</span>
          </div>

          <div className="stat-box">
            <strong>{mobiles}</strong>
            <span>Mobiles</span>
          </div>

          <div className="stat-box">
            <strong>{tablets}</strong>
            <span>Tablets</span>
          </div>
        </section>

        <div className="section-title">
          <h2>Explore Products</h2>
          <span>{products.length} products available</span>
        </div>

        <section className="product-grid">
          {products.map(product => {
            const mrp = Number(product.mrp || 0);
            const price = Number(product.price);

            const discount =
              mrp > price
                ? Math.round((1 - price / mrp) * 100)
                : 0;

            const isTablet = product.category
              .toUpperCase()
              .includes("TABLET");

            return (
              <article
                className="product-card"
                key={product.id}
              >
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

                  <h3>
                    {product.brand} {product.name}
                  </h3>

                  <div className="variant">
                    {product.specifications.RAM || "RAM N/A"}
                    {" | "}
                    {product.specifications.ROM || "ROM N/A"}
                  </div>

                  <div className="price-section">
                    <strong>{rupees(price)}</strong>

                    {mrp > price && (
                      <del>{rupees(mrp)}</del>
                    )}
                  </div>

                  {discount > 0 && (
                    <p className="discount">
                      {discount}% OFF
                    </p>
                  )}

                  {product.net_price != null &&
                    Number(product.net_price) < price && (
                    <p className="cashback">
                      After cashback: {rupees(product.net_price)}
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
                    {product.specifications.Chipset && (
                      <p>
                        <b>Processor:</b>{" "}
                        {product.specifications.Chipset}
                      </p>
                    )}

                    {product.specifications.Battery && (
                      <p>
                        <b>Battery:</b>{" "}
                        {product.specifications.Battery}
                      </p>
                    )}

                    {product.specifications["Rear Camera"] && (
                      <p>
                        <b>Camera:</b>{" "}
                        {product.specifications["Rear Camera"]}
                      </p>
                    )}
                  </div>

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

                      {Object.entries(
                        product.specifications
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

        {products.length === 0 && (
          <p>No products found in Excel.</p>
        )}
      </main>

      <footer className="footer">
        <p>
          © GadgetKart | Mobile & Tablet Price Catalog
        </p>
        <p>Prices and availability are subject to change.</p>
      </footer>
    </>
  );
}
