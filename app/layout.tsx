import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Turnero",
  description: "Frontend MVP de Turnero",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
