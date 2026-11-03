
import { getProducts } from "../lib/products";
import ProductCatalog from "./ProductCatalog";

export const dynamic = "force-static";

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
      {/* HEADER */}
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

        {/* HERO BANNER */}
        <section className="hero">
          <h1>Find Your Perfect Smartphone</h1>

          <p>
            Compare mobile phones, tablets, prices,
            offers and specifications in one place.
          </p>
        </section>

        {/* PRODUCT STATISTICS */}
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

        {/* SEARCH, FILTERS AND PRODUCT LIST */}
        <ProductCatalog products={products} />

      </main>

      {/* FOOTER */}
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
