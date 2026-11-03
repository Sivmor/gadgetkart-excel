
import { notFound } from "next/navigation";
import { getProducts } from "../../../lib/products";
import ProductExperience from "./ProductExperience";

export const dynamicParams = false;

// REMOVE ONLY THE RAM/STORAGE SUFFIX
function familyKey(product) {
  const base = String(product.name || "")
    .replace(
      /\s*\(\s*(?:\d+\s*(?:GB)?\s*[\/+ ]\s*\d+\s*(?:GB|TB)?|\d+\s*(?:GB|TB))\s*\)\s*$/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  return [
    String(product.brand).toUpperCase(),
    String(product.category).toUpperCase(),
    base
  ].join("|");
}

// GENERATE ALL PRODUCT PAGES
export async function generateStaticParams() {
  const products = await getProducts();

  return products.map(product => ({
    id: String(product.id)
  }));
}

// PRODUCT DETAILS
export default async function ProductPage({ params }) {
  const { id } = await params;

  const products = await getProducts();

  const product = products.find(
    p => String(p.id) === id
  );

  if (!product) {
    notFound();
  }

  // MATCH RAM AND STORAGE VARIANTS
  const key = familyKey(product);

  const variants = products
    .filter(p => familyKey(p) === key)
    .sort(
      (a, b) => Number(a.price) - Number(b.price)
    )
    .map(p => ({
      id: String(p.id),
      name: p.name,
      price: p.price,
      ram: p.specifications?.RAM || "",
      storage: p.specifications?.ROM || "",
      in_stock: p.in_stock
    }));

  return (
    <ProductExperience
      product={product}
      variants={variants}
    />
  );
}
