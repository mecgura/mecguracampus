import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MecguraCampus — Multi-School ERP",
    template: "%s | MecguraCampus",
  },
  description: "MecguraCampusOS — one platform for every school. Multi-tenant SaaS school ERP.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
