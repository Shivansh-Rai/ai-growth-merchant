import type { Metadata } from "next";
import { displayFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Next Gen Store",
    template: "%s · The Next Gen Store",
  },
  description:
    "AI-powered merchant growth platform — monitor customers, products, growth opportunities and agent activity.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={displayFont.variable}>
      <body>{children}</body>
    </html>
  );
}
