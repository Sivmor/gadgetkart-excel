
import "./globals.css";

export const metadata = {
  title: "GadgetKart | Mobiles & Tablets",
  description:
    "Compare mobile phones, tablets, prices and specifications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
