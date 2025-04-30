import "@/app/ui/global.css";
import { InterFont } from "./ui/fonts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard Prac",
    default: "Dashboard Prac",
  },
  description: "A small dashboard app using Next js Features",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${InterFont.className} antialiased`}>{children}</body>
    </html>
  );
}
