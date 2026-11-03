
import "./globals.css";

export const metadata = {
  title: "GadgetKart | Mobiles & Tablets",
  description:
    "Compare mobile phones, tablets, prices, offers and specifications on GadgetKart.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
