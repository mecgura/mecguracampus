import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MecguraCampus — Multi-School ERP",
    template: "%s | MecguraCampus",
  },
  description: "MecguraCampusOS — one platform for every school. Multi-tenant SaaS school ERP.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  themeColor: "#0C160D",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MecguraCampus" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
